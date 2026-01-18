import { motion } from 'framer-motion';
import { Home, CircleDot, Music, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', active: false },
  { icon: CircleDot, label: 'Chart', active: true },
  { icon: Music, label: 'Music', active: false },
  { icon: User, label: 'Profile', active: false },
];

export const BottomNav = () => {
  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 80, damping: 20 }}
    >
      <div className="mx-6 mb-6">
        <div className="glass rounded-2xl px-3 py-4 border-border/20">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className={cn(
                    "flex flex-col items-center gap-1.5 px-5 py-2 rounded-xl transition-all duration-500",
                    item.active
                      ? "text-primary"
                      : "text-muted-foreground/60 hover:text-muted-foreground"
                  )}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                    {item.active && (
                      <motion.div
                        className="absolute -bottom-2 left-1/2 w-4 h-px bg-primary/60"
                        layoutId="activeIndicator"
                        style={{ x: '-50%' }}
                      />
                    )}
                  </div>
                  <span className="text-[10px] tracking-widest uppercase">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
