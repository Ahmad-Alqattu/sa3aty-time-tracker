import { useApp } from '@/contexts/AppContext';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { Home, Clock, FolderOpen, Globe } from 'lucide-react';

export default function Navigation() {
  const { t, language, setLanguage } = useApp();

  const links = [
    { to: '/', icon: Home, label: t('home') },
    { to: '/timeline', icon: Clock, label: t('timeline') },
    { to: '/projects', icon: FolderOpen, label: t('projects') },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {links.map(link => (
          <RouterNavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[64px] ${
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <link.icon className="w-5 h-5" />
            <span className="text-[11px]">{link.label}</span>
          </RouterNavLink>
        ))}
        <button
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors min-w-[64px]"
        >
          <Globe className="w-5 h-5" />
          <span className="text-[11px]">{language === 'ar' ? 'EN' : 'عربي'}</span>
        </button>
      </div>
    </nav>
  );
}
