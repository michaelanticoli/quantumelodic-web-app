import { useState } from 'react';
import { motion } from 'framer-motion';
import { CosmicBackground } from '@/components/CosmicBackground';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);

  // If already logged in, redirect
  if (user) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!');
        navigate('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success('Check your email to confirm your account.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Enter your email address first');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Password reset link sent to your email.');
      setShowReset(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <title>Sign In - QuantumMelodic</title>
      <CosmicBackground />

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pb-32">
        <motion.button
          className="fixed top-6 left-6 text-muted-foreground hover:text-foreground transition-colors text-sm tracking-wide z-20"
          onClick={() => navigate('/')}
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          ‹ Back
        </motion.button>

        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="label-micro text-center mb-3">MoonTuner</p>
          <h1 className="font-display font-light text-4xl md:text-5xl tracking-[-0.03em] text-foreground text-center mb-10">
            {showReset ? 'Reset password' : isLogin ? 'Welcome back.' : <>Join the <span className="italic text-accent">symphony</span>.</>}
          </h1>

          {showReset ? (
            <form onSubmit={handleResetPassword} className="space-y-8">
              <div className="relative pt-5">
                <label className="absolute top-0 left-0 label-micro">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-transparent border-0 border-b border-foreground/15 px-0 py-2 text-base text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-accent transition-colors min-h-[44px]"
                  placeholder="you@cosmos.io"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[52px] py-4 rounded-full bg-foreground text-background hover:bg-accent hover:text-accent-foreground text-sm tracking-[0.2em] uppercase transition-colors disabled:opacity-30"
              >
                {loading ? '…' : 'Send reset link'}
              </button>
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="w-full label-micro text-foreground/50 hover:text-foreground transition-colors"
              >
                Back to sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="relative pt-5">
                <label className="absolute top-0 left-0 label-micro">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-transparent border-0 border-b border-foreground/15 px-0 py-2 text-base text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-accent transition-colors min-h-[44px]"
                  placeholder="you@cosmos.io"
                />
              </div>
              <div className="relative pt-5">
                <label className="absolute top-0 left-0 label-micro">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  className="w-full bg-transparent border-0 border-b border-foreground/15 px-0 py-2 text-base text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-accent transition-colors min-h-[44px]"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[52px] py-4 rounded-full bg-foreground text-background hover:bg-accent hover:text-accent-foreground text-sm tracking-[0.2em] uppercase transition-colors disabled:opacity-30"
              >
                {loading ? '…' : isLogin ? 'Sign in' : 'Create account'}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-xs text-foreground/60 hover:text-accent transition-colors"
                >
                  {isLogin ? 'Create an account' : 'Have an account? Sign in'}
                </button>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setShowReset(true)}
                    className="text-xs text-foreground/50 hover:text-foreground transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            </form>
          )}
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Auth;
