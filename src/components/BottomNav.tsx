import { motion } from 'framer-motion';
import { Home, Info, BookOpen, GraduationCap, CircleDot, Crown, Library } from 'lucide-react';
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
      className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-safe"
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
    >
      <div className="max-w-xl mx-auto mb-3 rounded-full glass-strong">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path ? location.pathname === item.path : false;

            const inner = (
              <>
                <Icon
                  className={cn(
                    'w-[18px] h-[18px] transition-colors duration-200',
                    isActive ? 'text-accent' : 'text-foreground/55'
                  )}
                  strokeWidth={isActive ? 1.75 : 1.5}
                />
                <span
                  className={cn(
                    'text-[9px] tracking-[0.18em] uppercase font-medium transition-colors duration-200 truncate',
                    isActive ? 'text-accent' : 'text-foreground/40'
                  )}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-[2px] w-6 rounded-full bg-accent shadow-[0_0_10px_hsl(var(--accent))]" />
                )}
              </>
            );

            if (item.external) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex flex-col items-center gap-1 px-2 py-1.5 min-w-0 text-foreground/40 hover:text-foreground/70 transition-colors"
                >
                  {inner}
                </a>
              );
            }

            return (
              <button
                key={item.label}
                onClick={() => item.path && navigate(item.path)}
                className="relative flex flex-col items-center gap-1 px-2 py-1.5 min-w-0 min-h-[44px] focus:outline-none"
              >
                {inner}
              </button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};
