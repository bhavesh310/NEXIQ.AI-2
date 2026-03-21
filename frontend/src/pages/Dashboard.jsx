import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Settings, User, Coins, Brain } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Sidebar } from '../components/chat/Sidebar';
import { ChatInput } from '../components/chat/ChatInput';
import { MessageBubble, TypingIndicator } from '../components/chat/MessageBubble';
import { ModelSelector } from '../components/chat/ModelSelector';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuthStore, useChatStore } from '../store';
import { cn } from '../lib/utils';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { user, isAuthenticated, isLoading: authLoading, checkAuth, logout } = useAuthStore();
  const {
    conversations,
    currentConversation,
    messages,
    isLoadingMessages,
    isStreaming,
    tokenUsage,
    fetchConversations,
    createConversation,
    sendMessage,
    fetchTokenUsage,
    clearCurrentConversation
  } = useChatStore();

  // Check auth on mount
  useEffect(() => {
    if (location.state?.user) return;
    checkAuth();
  }, [checkAuth, location.state]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !location.state?.user) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate, location.state]);

  // Fetch conversations on auth
  useEffect(() => {
    if (isAuthenticated || location.state?.user) {
      fetchConversations();
      fetchTokenUsage();
    }
  }, [isAuthenticated, fetchConversations, fetchTokenUsage, location.state]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = async () => {
    const conv = await createConversation();
    if (conv) setSidebarOpen(false);
  };

  const handleSendMessage = async (content) => {
    if (!currentConversation) {
      const conv = await createConversation();
      if (conv) setTimeout(() => sendMessage(content), 100);
    } else {
      sendMessage(content);
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate('/');
  };

  const currentUser = location.state?.user || user;

  if (authLoading && !location.state?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background" data-testid="dashboard">

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:relative inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar onNewChat={handleNewChat} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="toggle-sidebar-btn"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <ModelSelector />
          </div>

          <div className="flex items-center gap-2">
            {/* Token Usage */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 text-sm">
              <Coins className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">{tokenUsage.total_tokens.toLocaleString()} tokens</span>
            </div>

            <ThemeToggle />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" data-testid="user-menu-btn">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={currentUser?.picture} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {currentUser?.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{currentUser?.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{currentUser?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setShowProfile(true)}
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => setShowLogoutConfirm(true)}
                  data-testid="logout-btn"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1">
            <div className="max-w-3xl mx-auto px-4 py-6">
              {!currentConversation ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <Brain className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-2xl font-heading font-bold mb-2">Welcome to NEXIQ</h1>
                  <p className="text-muted-foreground max-w-md mb-8">
                    Your premium AI assistant for developers. Sharp, technically fluent, and direct.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 w-full max-w-lg">
                    {[
                      { title: 'Debug my code', desc: 'Find and fix issues fast' },
                      { title: 'Explain a concept', desc: 'Technical deep dives' },
                      { title: 'Write documentation', desc: 'READMEs, API docs, etc.' },
                      { title: 'Interview prep', desc: 'DSA and system design' }
                    ].map(item => (
                      <button
                        key={item.title}
                        onClick={() => handleSendMessage(item.title)}
                        className="p-4 text-left rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-muted/50 transition-colors group"
                      >
                        <p className="font-medium group-hover:text-primary transition-colors">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {isLoadingMessages ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <MessageBubble
                        key={message.message_id}
                        message={message}
                        isUser={message.role === 'user'}
                      />
                    ))
                  )}

                  {isStreaming && messages[messages.length - 1]?.role === 'user' && (
                    <TypingIndicator />
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border bg-background/80 backdrop-blur-sm p-4">
            <div className="max-w-3xl mx-auto">
              <ChatInput
                onSend={handleSendMessage}
                disabled={isStreaming}
                placeholder={currentConversation ? "Message NEXIQ..." : "Start a new conversation..."}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ==================== Profile Modal ==================== */}
      {showProfile && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowProfile(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Profile</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-muted/50">
              <Avatar className="w-16 h-16">
                <AvatarImage src={currentUser?.picture} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {currentUser?.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{currentUser?.name}</p>
                <p className="text-muted-foreground text-sm">{currentUser?.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">Total Tokens Used</span>
                <span className="font-semibold text-primary">{tokenUsage.total_tokens.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">Conversations</span>
                <span className="font-semibold">{tokenUsage.conversations_count}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">Messages Sent</span>
                <span className="font-semibold">{tokenUsage.messages_count}</span>
              </div>
            </div>

            <Button className="mt-6 w-full" onClick={() => setShowProfile(false)}>
              Close
            </Button>
          </div>
        </div>
      )}

      {/* ==================== Settings Modal ==================== */}
      {showSettings && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">Toggle light / dark mode</p>
                </div>
                <ThemeToggle />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                <div>
                  <p className="font-medium">AI Model</p>
                  <p className="text-sm text-muted-foreground">Llama 3.3 70B via Groq</p>
                </div>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">Free</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                <div>
                  <p className="font-medium">Account</p>
                  <p className="text-sm text-muted-foreground truncate max-w-[200px]">{currentUser?.email}</p>
                </div>
                <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full font-medium">Active</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                <div>
                  <p className="font-medium">Backend</p>
                  <p className="text-sm text-muted-foreground">localhost:8000</p>
                </div>
                <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full font-medium">Connected</span>
              </div>
            </div>

            <Button className="mt-6 w-full" onClick={() => setShowSettings(false)}>
              Close
            </Button>
          </div>
        </div>
      )}

      {/* ==================== Logout Confirm Modal ==================== */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Log Out</h2>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-muted-foreground mb-6">
              Are you sure you want to log out of NEXIQ?
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleLogout}
              >
                Log Out
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;