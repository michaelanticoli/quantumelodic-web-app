import { motion } from 'framer-motion';
import { Home, Sparkles, ExternalLink, Info, GraduationCap, Library, BookOpen, Crown, CircleDot } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  external?: boolean;
  path?: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Info, label: 'About', path: '/about' },
  { icon: BookOpen, label: 'Guide', path: '/guide' },
  { icon: GraduationCap, label: 'Learn', path: '/learn' },
  { icon: CircleDot, label: 'Chart', path: '/explore' },
  { icon: Crown, label: 'Academy', path: '/academy' },
  { icon: Library, label: 'Volumes', href: 'https://agent-69760f0deef6ca7076f--quantumelodic-volumes.netlify.app/#stats', external: true },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 70, damping: 18 }}
    >
      <div
        className="max-w-xl mx-auto rounded-2xl overflow-hidden"
        style={{
          background: 'hsl(228 35% 6% / 0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid hsl(255 25% 22% / 0.7)',
          boxShadow: '0 8px 40px hsl(228 35% 4% / 0.7), 0 0 0 1px hsl(255 25% 30% / 0.1), inset 0 1px 0 hsl(255 25% 40% / 0.08)',
        }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path ? location.pathname === item.path : false;

            if (item.external) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all duration-300 text-muted-foreground/50 hover:text-muted-foreground/80 min-w-0"
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  <span className="text-[9px] tracking-widest uppercase font-medium truncate">{item.label}</span>
                </a>
              );
            }

            return (
              <motion.button
                key={item.label}
                onClick={() => item.path && navigate(item.path)}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all duration-300 relative min-w-0',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground/50 hover:text-muted-foreground/80'
                )}
                whileTap={{ scale: 0.9 }}
              >
                {/* Active background pill */}
                {isActive && (
                  <motion.div
                    layoutId="navActiveBg"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'hsl(43 88% 58% / 0.1)',
                      border: '1px solid hsl(43 88% 58% / 0.2)',
                    }}
                    transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
                  />
                )}

                <div className="relative z-10">
                  <Icon
                    className={cn('w-4 h-4 transition-all duration-300', isActive && 'drop-shadow-[0_0_6px_hsl(43_88%_58%/0.8)]')}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                </div>

                <span
                  className={cn(
                    'text-[9px] tracking-widest uppercase font-medium relative z-10 truncate transition-all duration-300',
                    isActive && 'text-primary'
                  )}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};
