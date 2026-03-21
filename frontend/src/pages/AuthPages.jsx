import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, Mail, Lock, User, ArrowRight, Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuthStore } from '../store';
import { toast } from 'sonner';

// ==================== LOGIN PAGE ====================

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  // Quick Google-style signup modal
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleForm, setGoogleForm] = useState({ name: '', email: '', password: '' });
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo account — auto creates if not exists
  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    try {
      await login('demo@NEXIQ.ai', 'demo123456');
      toast.success('Welcome to NEXIQ Demo!');
      navigate('/dashboard');
    } catch (error) {
      // If login fails, try to register the demo account
      try {
        await register('demo@NEXIQ.ai', 'demo123456', 'Demo User');
        toast.success('Welcome to NEXIQ Demo!');
        navigate('/dashboard');
      } catch (regError) {
        toast.error('Demo login failed. Please register manually.');
      }
    } finally {
      setIsDemoLoading(false);
    }
  };

  // Google button → shows quick signup/login modal
  const handleGoogleClick = () => {
    setShowGoogleModal(true);
  };

  const handleGoogleModalSubmit = async (e) => {
    e.preventDefault();
    setIsGoogleSubmitting(true);
    try {
      // Try login first
      await login(googleForm.email, googleForm.password);
      toast.success('Welcome back!');
      setShowGoogleModal(false);
      navigate('/dashboard');
    } catch {
      // If not found, register
      try {
        await register(googleForm.email, googleForm.password, googleForm.name);
        toast.success('Account created! Welcome to NEXIQ!');
        setShowGoogleModal(false);
        navigate('/dashboard');
      } catch (err) {
        toast.error(err.message || 'Authentication failed');
      }
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="login-page">
      {/* Background glow */}
      <div
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.15) 0%, rgba(9, 9, 11, 0) 70%)' }}
      />

      <div className="w-full max-w-md relative animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-2xl">NEXIQ</span>
          </Link>
          <p className="text-muted-foreground mt-2">Welcome back</p>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">

          {/* Demo Login Button */}
          <Button
            variant="secondary"
            className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0"
            onClick={handleDemoLogin}
            disabled={isDemoLoading}
            data-testid="demo-login-btn"
          >
            {isDemoLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Try Demo Account
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or continue with</span>
            </div>
          </div>

          {/* Google Login */}
          <Button
            variant="outline"
            className="w-full h-11"
            onClick={handleGoogleClick}
            data-testid="google-login-btn"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                  data-testid="email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10"
                  required
                  data-testid="password-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full btn-primary h-11"
              disabled={isLoading}
              data-testid="login-submit-btn"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline" data-testid="register-link">
            Sign up
          </Link>
        </p>
      </div>

      {/* Google Quick Auth Modal */}
      {showGoogleModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowGoogleModal(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <h2 className="text-lg font-bold">Sign in with Google</h2>
              </div>
              <button onClick={() => setShowGoogleModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Enter your details to sign in or create an account.</p>
            <form onSubmit={handleGoogleModalSubmit} className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Your name"
                  value={googleForm.name}
                  onChange={e => setGoogleForm({ ...googleForm, name: e.target.value })}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={googleForm.email}
                  onChange={e => setGoogleForm({ ...googleForm, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password (min 6 chars)"
                  value={googleForm.password}
                  onChange={e => setGoogleForm({ ...googleForm, password: e.target.value })}
                  className="pl-10"
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={isGoogleSubmitting}>
                {isGoogleSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


// ==================== REGISTER PAGE ====================

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  // Google quick modal
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleForm, setGoogleForm] = useState({ name: '', email: '', password: '' });
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register(formData.email, formData.password, formData.name);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleModalSubmit = async (e) => {
    e.preventDefault();
    setIsGoogleSubmitting(true);
    try {
      await login(googleForm.email, googleForm.password);
      toast.success('Welcome back!');
      setShowGoogleModal(false);
      navigate('/dashboard');
    } catch {
      try {
        await register(googleForm.email, googleForm.password, googleForm.name);
        toast.success('Account created! Welcome to NEXIQ!');
        setShowGoogleModal(false);
        navigate('/dashboard');
      } catch (err) {
        toast.error(err.message || 'Authentication failed');
      }
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="register-page">
      <div
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.15) 0%, rgba(9, 9, 11, 0) 70%)' }}
      />

      <div className="w-full max-w-md relative animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-2xl">NEXIQ</span>
          </Link>
          <p className="text-muted-foreground mt-2">Create your account</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-6">

          {/* Google Button */}
          <Button
            variant="outline"
            className="w-full h-11"
            onClick={() => setShowGoogleModal(true)}
            data-testid="google-register-btn"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                  required
                  data-testid="name-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                  data-testid="email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10"
                  minLength={6}
                  required
                  data-testid="password-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full btn-primary h-11"
              disabled={isLoading}
              data-testid="register-submit-btn"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline" data-testid="login-link">
            Sign in
          </Link>
        </p>
      </div>

      {/* Google Quick Auth Modal */}
      {showGoogleModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowGoogleModal(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <h2 className="text-lg font-bold">Continue with Google</h2>
              </div>
              <button onClick={() => setShowGoogleModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Enter your details to sign in or create an account.</p>
            <form onSubmit={handleGoogleModalSubmit} className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Your name"
                  value={googleForm.name}
                  onChange={e => setGoogleForm({ ...googleForm, name: e.target.value })}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={googleForm.email}
                  onChange={e => setGoogleForm({ ...googleForm, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password (min 6 chars)"
                  value={googleForm.password}
                  onChange={e => setGoogleForm({ ...googleForm, password: e.target.value })}
                  className="pl-10"
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={isGoogleSubmitting}>
                {isGoogleSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};