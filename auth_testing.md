# Auth Testing Playbook for NEXIQ

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('NEXIQ');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: null,
  created_at: new Date().toISOString()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
  created_at: new Date().toISOString()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API
```bash
# Test auth endpoint
curl -X GET "http://localhost:8000/api/auth/me" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Test conversations
curl -X GET "http://localhost:8000/api/conversations" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Create conversation
curl -X POST "http://localhost:8000/api/conversations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"title": "Test Chat", "model": "llama-3.3-70b-versatile", "provider": "groq"}'
```

## Quick Debug
```bash
# Check data format
mongosh --eval "
use('NEXIQ');
db.users.find().limit(2).pretty();
db.user_sessions.find().limit(2).pretty();
"

# Clean test data
mongosh --eval "
use('NEXIQ');
db.users.deleteMany({email: /test\.user\./});
db.user_sessions.deleteMany({session_token: /test_session/});
"
```

## Checklist
- [ ] User document has user_id field
- [ ] Session user_id matches user's user_id exactly
- [ ] All queries use `{"_id": 0}` projection
- [ ] Backend queries use user_id (not _id)
- [ ] API returns user data (not 401/404)
- [ ] Browser loads dashboard (not login page)

## Success Indicators
- ✅ /api/auth/me returns user data
- ✅ Dashboard loads without redirect
- ✅ CRUD operations work

## Failure Indicators
- ❌ "User not found" errors
- ❌ 401 Unauthorized responses
- ❌ Redirect to login page