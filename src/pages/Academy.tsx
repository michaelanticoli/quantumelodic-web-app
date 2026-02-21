import { useState } from 'react';
import { motion } from 'framer-motion';
import { CosmicBackground } from '@/components/CosmicBackground';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { useAuth, ACADEMY_PRODUCT_ID } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lock, Crown, Loader2, Settings } from 'lucide-react';

const ACADEMY_PRICE_ID = 'price_1T341pApODHiQWcAAJuwsML9';

const Academy = () => {
  const navigate = useNavigate();
  const { user, session, subscription, checkingSubscription, refreshSubscription } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const isSubscribed = subscription.subscribed;

  const handleSubscribe = async () => {
    if (!user || !session) {
      navigate('/auth');
      return;
    }

    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to start checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!session) return;
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: any) {
      toast.error(err.message || 'Failed to open portal');
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <title>Academy of Astro-Musicology - QuantumMelodic</title>
      <meta name="description" content="Unlock the Academy of Astro-Musicology — immersive courses on planetary harmonics, zodiacal modes, and cosmic composition." />
      <CosmicBackground />

      <main className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header
          className="px-6 pt-6 pb-4 flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.button
            className="text-muted-foreground hover:text-foreground transition-colors text-sm tracking-wide"
            onClick={() => navigate('/')}
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            ‹ Back
          </motion.button>
          <h1 className="font-display text-lg text-gold-gradient tracking-wide">
            Academy
          </h1>
          <div className="w-12 flex justify-end">
            {isSubscribed && (
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Manage subscription"
              >
                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
              </button>
            )}
          </div>
        </motion.header>

        {checkingSubscription ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : isSubscribed ? (
          /* Full academy iframe for subscribers */
          <motion.div
            className="flex-1 px-4 pb-28"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="glass rounded-2xl border border-primary/20 h-full overflow-hidden">
              <iframe
                title="Academy of Astro-Musicology"
                src="https://academy-of-astro-musicology.netlify.app/"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="w-full h-full min-h-[75vh] border-0"
              />
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Crown className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground tracking-wide">
                Active subscription
                {subscription.subscription_end && (
                  <> · Renews {new Date(subscription.subscription_end).toLocaleDateString()}</>
                )}
              </span>
              <button
                onClick={refreshSubscription}
                className="text-xs text-primary/60 hover:text-primary ml-2 underline"
              >
                Refresh
              </button>
            </div>
          </motion.div>
        ) : (
          /* Paywall for non-subscribers */
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-28">
            <motion.div
              className="glass rounded-2xl p-8 border border-primary/20 max-w-md w-full text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-7 h-7 text-primary" />
              </div>

              <h2 className="font-display text-2xl text-foreground mb-2 tracking-wide">
                Academy of Astro-Musicology
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Immersive courses on planetary harmonics, zodiacal modes, and cosmic composition. 
                Unlock the full curriculum and deepen your practice.
              </p>

              <div className="glass rounded-xl p-4 border border-border/20 mb-6">
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-3xl font-display text-gold-gradient">$19.99</span>
                  <span className="text-muted-foreground text-xs">/month</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1.5 text-left">
                  <li className="flex items-center gap-2"><span className="text-primary">✦</span> Full academy curriculum access</li>
                  <li className="flex items-center gap-2"><span className="text-primary">✦</span> Planetary harmonics deep-dives</li>
                  <li className="flex items-center gap-2"><span className="text-primary">✦</span> Zodiacal mode masterclasses</li>
                  <li className="flex items-center gap-2"><span className="text-primary">✦</span> Compositional exercises & rituals</li>
                  <li className="flex items-center gap-2"><span className="text-primary">✦</span> Cancel anytime</li>
                </ul>
              </div>

              <button
                onClick={handleSubscribe}
                disabled={checkoutLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-amber-500 text-primary-foreground text-sm tracking-widest uppercase font-medium disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2"
              >
                {checkoutLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    {user ? 'Subscribe Now' : 'Sign In to Subscribe'}
                  </>
                )}
              </button>

              {!user && (
                <p className="text-xs text-muted-foreground mt-3">
                  Already subscribed?{' '}
                  <button onClick={() => navigate('/auth')} className="text-primary underline">
                    Sign in
                  </button>
                </p>
              )}
            </motion.div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Academy;
