import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CosmicBackground } from '@/components/CosmicBackground';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) setIsRecovery(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated.');
      navigate('/');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6">
        <CosmicBackground />
        <div className="relative z-10 text-center">
          <p className="label-micro mb-4">Link invalid or expired</p>
          <button
            onClick={() => navigate('/auth')}
            className="text-sm text-foreground/70 hover:text-accent transition-colors"
          >
            ‹ Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6">
      <CosmicBackground />
      <motion.div
        className="relative z-10 w-full max-w-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="label-micro text-center mb-3">MoonTuner</p>
        <h1 className="font-display font-light text-4xl tracking-[-0.03em] text-foreground text-center mb-10">
          Set a new <span className="italic text-accent">password</span>.
        </h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="relative pt-5">
            <label className="absolute top-0 left-0 label-micro">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full bg-transparent border-0 border-b border-foreground/15 px-0 py-2 text-base text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-accent transition-colors min-h-[44px]"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[52px] py-4 rounded-full bg-foreground text-background hover:bg-accent hover:text-accent-foreground text-sm tracking-[0.2em] uppercase transition-colors disabled:opacity-30"
          >
            {loading ? '…' : 'Update password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
