import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Code, Zap, Brain, MessageSquare, Terminal, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';

const LandingPage = () => {
  const navigate = useNavigate();
  const featuresRef = useRef(null);
  
  const features = [
    {
      icon: Brain,
      title: 'Multi-Model Intelligence',
      description: 'Switch between GPT-5.2 and Claude Sonnet 4.5 based on your needs. Each model brings unique strengths.',
      gradient: 'from-violet-500 to-purple-500'
    },
    {
      icon: Code,
      title: 'Code-First Responses',
      description: 'Technical questions get working code before explanations. Syntax highlighting for 100+ languages.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Zap,
      title: 'Real-Time Streaming',
      description: 'Watch responses appear token by token. No waiting for complete generations.',
      gradient: 'from-amber-500 to-orange-500'
    },
    {
      icon: MessageSquare,
      title: 'Persistent Memory',
      description: 'Your conversations are saved and organized. Pick up where you left off anytime.',
      gradient: 'from-emerald-500 to-green-500'
    },
    {
      icon: Terminal,
      title: 'Developer Focused',
      description: 'Built by developers, for developers. No fluff, no filler - just direct, actionable answers.',
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      icon: Sparkles,
      title: 'Premium Experience',
      description: 'Beautiful dark interface, keyboard shortcuts, and thoughtful UX at every turn.',
      gradient: 'from-indigo-500 to-violet-500'
    }
  ];
  
  return (
    <div className="min-h-screen bg-background" data-testid="landing-page">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-heading font-semibold text-lg">NEXIQ</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
              >
                Features
              </Button>
              <Button 
                variant="ghost"
                onClick={() => navigate('/login')}
                data-testid="login-btn"
              >
                Log in
              </Button>
              <Button 
                className="btn-primary"
                onClick={() => navigate('/register')}
                data-testid="get-started-btn"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background glow */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.15) 0%, rgba(9, 9, 11, 0) 70%)'
          }}
        />
        
        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Powered by GPT-5.2 & Claude 4.5</span>
            </div>
            
            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold leading-none tracking-tight mb-6 animate-fade-in">
              <span className="text-gradient">The AI Assistant</span>
              <br />
              <span className="text-foreground">Developers Deserve</span>
            </h1>
            
            {/* Subheading */}
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in animate-delay-100">
              Sharp, technically fluent, and direct. No filler, no hedging - just answers that respect your intelligence and time.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in animate-delay-200">
              <Button 
                size="lg"
                className="btn-primary text-lg px-8 h-12"
                onClick={() => navigate('/register')}
                data-testid="hero-cta-btn"
              >
                Start Building
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="text-lg px-8 h-12"
                onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
              >
                See Features
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-md mx-auto mt-16 animate-fade-in animate-delay-300">
              {[
                { value: '100+', label: 'Languages' },
                { value: '<50ms', label: 'Latency' },
                { value: '2', label: 'Top Models' }
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-heading font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section ref={featuresRef} className="py-20 bg-muted/30" data-testid="features-section">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold mb-4">Built for Builders</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every feature designed with developers in mind. No bloat, no distractions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group p-6 bg-card border border-border/50 rounded-lg hover:border-primary/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-heading font-bold mb-4">Ready to level up?</h2>
            <p className="text-muted-foreground mb-8">
              Join developers who demand more from their AI assistant.
            </p>
            <Button 
              size="lg"
              className="btn-primary text-lg px-8 h-12"
              onClick={() => navigate('/register')}
            >
              Get Started Free
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-heading font-medium">NEXIQ</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with React, FastAPI, and MongoDB. Powered by OpenAI & Anthropic.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

