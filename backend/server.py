from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import asyncio
from groq import Groq

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'NEXIQ_secret')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7

# LLM Config
GROQ_API_KEY = os.environ.get('GROQ_API_KEY')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ==================== Lifespan ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    mongo_client.close()


# ==================== App ====================

app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")


# ==================== Models ====================

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class ConversationCreate(BaseModel):
    title: Optional[str] = "New Chat"
    model: Optional[str] = "llama-3.3-70b-versatile"
    provider: Optional[str] = "groq"

class ConversationUpdate(BaseModel):
    title: Optional[str] = None

class ConversationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    conversation_id: str
    user_id: str
    title: str
    model: str
    provider: str
    created_at: datetime
    updated_at: datetime

class MessageCreate(BaseModel):
    content: str
    model: Optional[str] = "llama-3.3-70b-versatile"
    provider: Optional[str] = "groq"

class MessageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str
    conversation_id: str
    role: str
    content: str
    model: Optional[str] = None
    provider: Optional[str] = None
    tokens_used: Optional[int] = None
    created_at: datetime

class TokenUsageResponse(BaseModel):
    total_tokens: int
    conversations_count: int
    messages_count: int


# ==================== Auth Helpers ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    session_token = request.cookies.get("session_token")

    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]

    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")

    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


# ==================== Auth Routes ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)

    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "picture": None,
        "created_at": now.isoformat()
    }
    await db.users.insert_one(user_doc)

    session_token = f"sess_{uuid.uuid4().hex}"
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (now + timedelta(days=JWT_EXPIRATION_DAYS)).isoformat(),
        "created_at": now.isoformat()
    }
    await db.user_sessions.insert_one(session_doc)

    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=JWT_EXPIRATION_DAYS * 24 * 60 * 60
    )

    return {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "picture": None,
        "created_at": now.isoformat(),
        "token": session_token
    }


@api_router.post("/auth/login")
async def login(user_data: UserLogin, response: Response):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(user_data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    now = datetime.now(timezone.utc)
    session_token = f"sess_{uuid.uuid4().hex}"
    session_doc = {
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": (now + timedelta(days=JWT_EXPIRATION_DAYS)).isoformat(),
        "created_at": now.isoformat()
    }
    await db.user_sessions.insert_one(session_doc)

    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=JWT_EXPIRATION_DAYS * 24 * 60 * 60
    )

    created_at = user.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)

    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "created_at": created_at.isoformat() if isinstance(created_at, datetime) else created_at,
        "token": session_token
    }


@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    created_at = user.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)

    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "created_at": created_at.isoformat() if isinstance(created_at, datetime) else created_at
    }


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})

    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}


# ==================== Conversation Routes ====================

@api_router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(user: dict = Depends(get_current_user)):
    conversations = await db.conversations.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("updated_at", -1).to_list(100)

    for conv in conversations:
        for field in ["created_at", "updated_at"]:
            if isinstance(conv.get(field), str):
                conv[field] = datetime.fromisoformat(conv[field])

    return conversations


@api_router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(data: ConversationCreate, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    conversation_id = f"conv_{uuid.uuid4().hex[:12]}"

    conv_doc = {
        "conversation_id": conversation_id,
        "user_id": user["user_id"],
        "title": data.title,
        "model": data.model,
        "provider": data.provider,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    await db.conversations.insert_one(conv_doc)

    conv_doc["created_at"] = now
    conv_doc["updated_at"] = now
    return conv_doc


@api_router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(conversation_id: str, user: dict = Depends(get_current_user)):
    conv = await db.conversations.find_one(
        {"conversation_id": conversation_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    for field in ["created_at", "updated_at"]:
        if isinstance(conv.get(field), str):
            conv[field] = datetime.fromisoformat(conv[field])

    return conv


@api_router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(conversation_id: str, data: ConversationUpdate, user: dict = Depends(get_current_user)):
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if data.title:
        update_data["title"] = data.title

    result = await db.conversations.update_one(
        {"conversation_id": conversation_id, "user_id": user["user_id"]},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conv = await db.conversations.find_one({"conversation_id": conversation_id}, {"_id": 0})

    for field in ["created_at", "updated_at"]:
        if isinstance(conv.get(field), str):
            conv[field] = datetime.fromisoformat(conv[field])

    return conv


@api_router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, user: dict = Depends(get_current_user)):
    result = await db.conversations.delete_one(
        {"conversation_id": conversation_id, "user_id": user["user_id"]}
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await db.messages.delete_many({"conversation_id": conversation_id})
    return {"message": "Conversation deleted"}


# ==================== Message Routes ====================

@api_router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(conversation_id: str, user: dict = Depends(get_current_user)):
    conv = await db.conversations.find_one(
        {"conversation_id": conversation_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = await db.messages.find(
        {"conversation_id": conversation_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(1000)

    for msg in messages:
        if isinstance(msg.get("created_at"), str):
            msg["created_at"] = datetime.fromisoformat(msg["created_at"])

    return messages


@api_router.post("/conversations/{conversation_id}/messages/stream")
async def send_message_stream(
    conversation_id: str,
    data: MessageCreate,
    user: dict = Depends(get_current_user)
):
    conv = await db.conversations.find_one(
        {"conversation_id": conversation_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    now = datetime.now(timezone.utc)

    user_message_id = f"msg_{uuid.uuid4().hex[:12]}"
    user_msg_doc = {
        "message_id": user_message_id,
        "conversation_id": conversation_id,
        "role": "user",
        "content": data.content,
        "model": None,
        "provider": None,
        "tokens_used": None,
        "created_at": now.isoformat()
    }
    await db.messages.insert_one(user_msg_doc)

    history = await db.messages.find(
        {"conversation_id": conversation_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(50)

    system_message = """You are NEXIQ, a premium AI assistant engineered for developers, creators, and knowledge workers. You are sharp, technically fluent, and direct.

Core rules:
- Always be direct. Lead with the answer, then explain.
- Code-first for technical questions. Show working code before explaining.
- Admit uncertainty cleanly in one sentence, then give your best answer.
- No sycophancy. Never start with "Great question!" or hollow affirmations.
- Match the user's register. If casual, be casual. If technical, mirror that.
- Use markdown. Headers, bullet points, code blocks with language tags.
- For complex problems, think step by step and show reasoning.

You are confident but not arrogant, technical but not condescending, concise but helpful. Occasionally witty when appropriate."""

    async def generate_stream():
        try:
            provider = data.provider or conv.get("provider", "groq")
            model = data.model or conv.get("model", "llama-3.3-70b-versatile")

            # Build message history
            context_messages = []
            for msg in history[-10:]:
                role = "user" if msg["role"] == "user" else "assistant"
                context_messages.append({"role": role, "content": msg["content"]})
            context_messages.append({"role": "user", "content": data.content})

            ai_message_id = f"msg_{uuid.uuid4().hex[:12]}"
            full_response = ""

            yield f"data: {{\"type\":\"start\",\"message_id\":\"{ai_message_id}\"}}\n\n"

            # ===== Groq (default, free, works in India) =====
            if provider in ("groq", "openai", "gemini"):
                if not GROQ_API_KEY:
                    raise ValueError("GROQ_API_KEY not set in .env")
                groq_client = Groq(api_key=GROQ_API_KEY)
                result = groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "system", "content": system_message}] + context_messages
                )
                full_response = result.choices[0].message.content

            # ===== Anthropic =====
            elif provider == "anthropic":
                import anthropic as anthropic_lib
                ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
                if not ANTHROPIC_API_KEY:
                    raise ValueError("ANTHROPIC_API_KEY not set in .env")
                anthropic_client = anthropic_lib.Anthropic(api_key=ANTHROPIC_API_KEY)
                result = anthropic_client.messages.create(
                    model="claude-opus-4-5",
                    max_tokens=2048,
                    system=system_message,
                    messages=context_messages
                )
                full_response = result.content[0].text

            # Stream in chunks
            chunk_size = 10
            for i in range(0, len(full_response), chunk_size):
                chunk = full_response[i:i + chunk_size]
                escaped_chunk = (
                    chunk
                    .replace('\\', '\\\\')
                    .replace('"', '\\"')
                    .replace('\n', '\\n')
                    .replace('\r', '\\r')
                    .replace('\t', '\\t')
                )
                yield f'data: {{"type":"chunk","content":"{escaped_chunk}"}}\n\n'
                await asyncio.sleep(0.02)

            # Save AI message
            ai_msg_doc = {
                "message_id": ai_message_id,
                "conversation_id": conversation_id,
                "role": "assistant",
                "content": full_response,
                "model": model,
                "provider": provider,
                "tokens_used": len(full_response.split()) * 2,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.messages.insert_one(ai_msg_doc)

            await db.conversations.update_one(
                {"conversation_id": conversation_id},
                {"$set": {
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "model": model,
                    "provider": provider
                }}
            )

            if len(history) == 0:
                title = data.content[:50] + ("..." if len(data.content) > 50 else "")
                await db.conversations.update_one(
                    {"conversation_id": conversation_id},
                    {"$set": {"title": title}}
                )

            yield f"data: {{\"type\":\"end\",\"tokens_used\":{len(full_response.split()) * 2}}}\n\n"

        except Exception as e:
            logger.error(f"Stream error: {e}")
            yield f"data: {{\"type\":\"error\",\"message\":\"{str(e)}\"}}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


# ==================== Token Usage ====================

@api_router.get("/usage", response_model=TokenUsageResponse)
async def get_token_usage(user: dict = Depends(get_current_user)):
    conversations = await db.conversations.find(
        {"user_id": user["user_id"]}, {"_id": 0, "conversation_id": 1}
    ).to_list(1000)

    conv_ids = [c["conversation_id"] for c in conversations]

    messages = await db.messages.find(
        {"conversation_id": {"$in": conv_ids}, "tokens_used": {"$ne": None}},
        {"_id": 0, "tokens_used": 1}
    ).to_list(10000)

    total_tokens = sum(m.get("tokens_used", 0) or 0 for m in messages)

    return {
        "total_tokens": total_tokens,
        "conversations_count": len(conversations),
        "messages_count": len(messages)
    }


# ==================== Health Check ====================

@api_router.get("/")
async def root():
    return {"message": "NEXIQ API is running", "status": "healthy"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


# ==================== Register router & middleware ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)