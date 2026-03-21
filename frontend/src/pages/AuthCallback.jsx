import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { processOAuthSession, setUser } = useAuthStore();
  const hasProcessed = useRef(false);
  
  useEffect(() => {
    // Use ref to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    
    const processAuth = async () => {
      // Extract session_id from URL hash
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (!sessionIdMatch) {
        navigate('/login');
        return;
      }
      
      const sessionId = sessionIdMatch[1];
      
      try {
        const user = await processOAuthSession(sessionId);
        // Clear the hash and navigate to dashboard with user data
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/dashboard', { state: { user }, replace: true });
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login');
      }
    };
    
    processAuth();
  }, [navigate, processOAuthSession, setUser]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

