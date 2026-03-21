import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      
      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
      
      logout: async () => {
        try {
          await fetch(`${API}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
          });
        } catch (e) {
          console.error('Logout error:', e);
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
      },
      
      checkAuth: async () => {
        // CRITICAL: If returning from OAuth callback, skip the /me check
        if (window.location.hash?.includes('session_id=')) {
          set({ isLoading: false });
          return;
        }
        
        try {
          const res = await fetch(`${API}/auth/me`, {
            credentials: 'include'
          });
          
          if (res.ok) {
            const user = await res.json();
            set({ user, isAuthenticated: true, isLoading: false });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch (e) {
          console.error('Auth check error:', e);
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
      
      login: async (email, password) => {
        const res = await fetch(`${API}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password })
        });
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.detail || 'Login failed');
        }
        
        const user = await res.json();
        set({ user, isAuthenticated: true, isLoading: false });
        return user;
      },
      
      register: async (email, password, name) => {
        const res = await fetch(`${API}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password, name })
        });
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.detail || 'Registration failed');
        }
        
        const user = await res.json();
        set({ user, isAuthenticated: true, isLoading: false });
        return user;
      },
      
      processOAuthSession: async (sessionId) => {
        const res = await fetch(`${API}/auth/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ session_id: sessionId })
        });
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.detail || 'OAuth session processing failed');
        }
        
        const user = await res.json();
        set({ user, isAuthenticated: true, isLoading: false });
        return user;
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
);

// Chat Store
export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  isStreaming: false,
  selectedModel: 'gpt-5.2',
  selectedProvider: 'openai',
  tokenUsage: { total_tokens: 0, conversations_count: 0, messages_count: 0 },
  
  setSelectedModel: (model, provider) => set({ selectedModel: model, selectedProvider: provider }),
  
  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const res = await fetch(`${API}/conversations`, {
        credentials: 'include'
      });
      if (res.ok) {
        const conversations = await res.json();
        set({ conversations, isLoadingConversations: false });
      }
    } catch (e) {
      console.error('Fetch conversations error:', e);
      set({ isLoadingConversations: false });
    }
  },
  
  createConversation: async () => {
    const { selectedModel, selectedProvider } = get();
    try {
      const res = await fetch(`${API}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: 'New Chat',
          model: selectedModel,
          provider: selectedProvider
        })
      });
      
      if (res.ok) {
        const conversation = await res.json();
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          currentConversation: conversation,
          messages: []
        }));
        return conversation;
      }
    } catch (e) {
      console.error('Create conversation error:', e);
    }
    return null;
  },
  
  selectConversation: async (conversation) => {
    set({ currentConversation: conversation, isLoadingMessages: true, messages: [] });
    
    try {
      const res = await fetch(`${API}/conversations/${conversation.conversation_id}/messages`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const messages = await res.json();
        set({ messages, isLoadingMessages: false });
      }
    } catch (e) {
      console.error('Fetch messages error:', e);
      set({ isLoadingMessages: false });
    }
  },
  
  deleteConversation: async (conversationId) => {
    try {
      const res = await fetch(`${API}/conversations/${conversationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (res.ok) {
        set((state) => ({
          conversations: state.conversations.filter(c => c.conversation_id !== conversationId),
          currentConversation: state.currentConversation?.conversation_id === conversationId ? null : state.currentConversation,
          messages: state.currentConversation?.conversation_id === conversationId ? [] : state.messages
        }));
      }
    } catch (e) {
      console.error('Delete conversation error:', e);
    }
  },
  
  sendMessage: async (content) => {
    const { currentConversation, selectedModel, selectedProvider } = get();
    if (!currentConversation) return;
    
    // Add user message optimistically
    const userMessage = {
      message_id: `temp_${Date.now()}`,
      conversation_id: currentConversation.conversation_id,
      role: 'user',
      content,
      created_at: new Date().toISOString()
    };
    
    set((state) => ({
      messages: [...state.messages, userMessage],
      isStreaming: true
    }));
    
    try {
      const res = await fetch(
        `${API}/conversations/${currentConversation.conversation_id}/messages/stream`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            content,
            model: selectedModel,
            provider: selectedProvider
          })
        }
      );
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiMessage = {
        message_id: '',
        conversation_id: currentConversation.conversation_id,
        role: 'assistant',
        content: '',
        model: selectedModel,
        provider: selectedProvider,
        created_at: new Date().toISOString()
      };
      
      let addedAiMessage = false;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'start') {
                aiMessage.message_id = data.message_id;
                addedAiMessage = true;
                set((state) => ({
                  messages: [...state.messages, aiMessage]
                }));
              } else if (data.type === 'chunk') {
                aiMessage.content += data.content;
                set((state) => ({
                  messages: state.messages.map(m => 
                    m.message_id === aiMessage.message_id
                      ? { ...m, content: aiMessage.content }
                      : m
                  )
                }));
              } else if (data.type === 'end') {
                aiMessage.tokens_used = data.tokens_used;
              } else if (data.type === 'error') {
                console.error('Stream error:', data.message);
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
      
      // Update conversation in list
      get().fetchConversations();
      
    } catch (e) {
      console.error('Send message error:', e);
    }
    
    set({ isStreaming: false });
  },
  
  fetchTokenUsage: async () => {
    try {
      const res = await fetch(`${API}/usage`, {
        credentials: 'include'
      });
      if (res.ok) {
        const tokenUsage = await res.json();
        set({ tokenUsage });
      }
    } catch (e) {
      console.error('Fetch usage error:', e);
    }
  },
  
  clearCurrentConversation: () => set({ currentConversation: null, messages: [] })
}));

// Theme Store
export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.toggle('light', newTheme === 'light');
        return { theme: newTheme };
      }),
      initTheme: () => {
        const stored = localStorage.getItem('theme-storage');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.state?.theme === 'light') {
            document.documentElement.classList.add('light');
          }
        }
      }
    }),
    { name: 'theme-storage' }
  )
);

