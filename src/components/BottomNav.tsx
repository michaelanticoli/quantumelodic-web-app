import { motion } from 'framer-motion';
import { Home, CircleDot, ExternalLink, Info, GraduationCap, Library, BookOpen } from 'lucide-react';
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
  { icon: GraduationCap, label: 'Learn', path: '/learn' },
  { icon: BookOpen, label: 'Guide', path: '/guide' },
  { icon: CircleDot, label: 'Chart', path: '/explore' },
  { icon: Library, label: 'Volumes', href: 'https://agent-69760f0deef6ca7076f--quantumelodic-volumes.netlify.app/#stats', external: true },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
              const isActive = item.path ? location.pathname === item.path : false;
              
              if (item.external) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex flex-col items-center gap-1.5 px-5 py-2 rounded-xl transition-all duration-500",
                      "text-muted-foreground/60 hover:text-muted-foreground hover:text-primary/80"
                    )}
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                    <span className="text-[10px] tracking-widest uppercase">{item.label}</span>
                  </a>
                );
              }
              
              return (
                <button
                  key={item.label}
                  onClick={() => item.path && navigate(item.path)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 px-5 py-2 rounded-xl transition-all duration-500",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground/60 hover:text-muted-foreground hover:text-primary/80"
                  )}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                    {isActive && (
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
