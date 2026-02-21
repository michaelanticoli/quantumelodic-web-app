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
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
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
    } catch (err: any) {
      toast.error(err.message);
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
          className="glass rounded-2xl p-8 border border-border/20 w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-2xl text-gold-gradient tracking-wide text-center mb-6">
            {showReset ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Join the Symphony'}
          </h1>

          {showReset ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground tracking-wide uppercase block mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-card/60 border border-border/30 text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="you@cosmos.io"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-amber-500 text-primary-foreground text-sm tracking-widest uppercase font-medium disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-primary/30"
              >
                {loading ? '...' : 'Send Reset Link'}
              </button>
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                Back to sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground tracking-wide uppercase block mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-card/60 border border-border/30 text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="you@cosmos.io"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground tracking-wide uppercase block mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-card/60 border border-border/30 text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-amber-500 text-primary-foreground text-sm tracking-widest uppercase font-medium disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-primary/30"
              >
                {loading ? '...' : isLogin ? 'Sign In' : 'Create Account'}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-xs text-primary/80 hover:text-primary transition-colors"
                >
                  {isLogin ? 'Create an account' : 'Already have an account?'}
                </button>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setShowReset(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
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
