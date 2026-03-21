import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export const ChatInput = ({ onSend, disabled, placeholder = "Message NEXIQ..." }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [message]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="relative" data-testid="chat-input-form">
      <div className="glass rounded-xl p-2">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              "flex-1 bg-transparent border-0 resize-none focus:outline-none focus:ring-0",
              "placeholder:text-muted-foreground/50 text-foreground",
              "min-h-[44px] max-h-[200px] py-3 px-2",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            data-testid="chat-input"
          />
          
          <div className="flex items-center gap-1 pb-1">
            <Button
              type="submit"
              size="icon"
              disabled={!message.trim() || disabled}
              className={cn(
                "h-10 w-10 rounded-lg transition-all",
                message.trim() && !disabled
                  ? "btn-primary"
                  : "bg-muted text-muted-foreground hover:bg-muted"
              )}
              data-testid="send-message-btn"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground text-center mt-2">
        NEXIQ can make mistakes. Consider checking important information.
      </p>
    </form>
  );
};

