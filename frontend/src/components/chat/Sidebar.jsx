import React from 'react';
import { MessageSquarePlus, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../lib/utils';
import { useChatStore } from '../../store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';

export const Sidebar = ({ onNewChat }) => {
  const { 
    conversations, 
    currentConversation, 
    selectConversation, 
    deleteConversation,
    isLoadingConversations 
  } = useChatStore();
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) return 'Today';
    if (diff < 172800000) return 'Yesterday';
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
    return date.toLocaleDateString();
  };
  
  // Group conversations by date
  const groupedConversations = conversations.reduce((acc, conv) => {
    const dateGroup = formatDate(conv.updated_at);
    if (!acc[dateGroup]) acc[dateGroup] = [];
    acc[dateGroup].push(conv);
    return acc;
  }, {});
  
  return (
    <div className="h-full flex flex-col bg-muted/30 border-r border-border" data-testid="sidebar">
      {/* Header */}
      <div className="p-4 border-b border-border relative z-10">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onNewChat();
          }}
          className="w-full btn-primary justify-start gap-2 relative z-20"
          data-testid="new-chat-btn"
        >
          <MessageSquarePlus className="w-4 h-4" />
          New Chat
        </Button>
      </div>
      
      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoadingConversations ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            Object.entries(groupedConversations).map(([date, convs]) => (
              <div key={date} className="mb-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold px-3 py-2">
                  {date}
                </p>
                <div className="space-y-1">
                  {convs.map(conv => (
                    <div
                      key={conv.conversation_id}
                      className={cn(
                        "group flex items-center gap-2 rounded-md transition-colors",
                        currentConversation?.conversation_id === conv.conversation_id
                          ? "bg-muted"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <button
                        onClick={() => selectConversation(conv)}
                        className="flex-1 sidebar-item text-left truncate"
                        data-testid={`conversation-${conv.conversation_id}`}
                      >
                        <MessageSquare className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{conv.title}</span>
                      </button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                            data-testid={`delete-conversation-${conv.conversation_id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{conv.title}" and all its messages. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteConversation(conv.conversation_id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              data-testid="confirm-delete-btn"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

