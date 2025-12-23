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
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
    >
      <div className="mx-4 mb-4">
        <div className="glass-strong rounded-2xl px-2 py-3">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className={cn(
                    "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300",
                    item.active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {item.active && (
                      <motion.div
                        className="absolute -bottom-1 left-1/2 w-1 h-1 bg-primary rounded-full"
                        layoutId="activeIndicator"
                        style={{ x: '-50%' }}
                      />
                    )}
                  </div>
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active indicator line */}
          <div className="mt-2 flex justify-center">
            <div className="w-32 h-1 bg-muted rounded-full" />
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
