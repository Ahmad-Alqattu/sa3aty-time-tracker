import { ReactNode } from 'react';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { Home, Clock, FolderOpen, Globe } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import AmbientSoundPlayer from './AmbientSoundPlayer';
import UserMenu, { SyncStatus } from './UserMenu';
import { Button } from '@/components/ui/button';

interface ResponsiveLayoutProps {
  children: ReactNode;
}

export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const { t, language, setLanguage } = useApp();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const links = [
    { to: '/', icon: Home, label: t('home') },
    { to: '/timeline', icon: Clock, label: t('timeline') },
    { to: '/projects', icon: FolderOpen, label: t('projects') },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Unified Header - Both Mobile and Desktop */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="ساعتي" className="h-8 w-8 object-contain" />
            <h1 className="text-lg font-bold text-primary">{t('appName')}</h1>
          </div>

          {/* Desktop Navigation - Center */}
          <nav className="hidden lg:flex items-center gap-1">
            {links.map(link => (
              <RouterNavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`
                }
              >
                <link.icon className="w-4 h-4" />
                <span className="text-sm">{link.label}</span>
              </RouterNavLink>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-1">
            {/* Language toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="h-9 w-9"
              title={language === 'ar' ? 'English' : 'عربي'}
            >
              <Globe className="w-5 h-5" />
            </Button>
            
            <SyncStatus />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto pb-24 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Desktop: Fixed top sounds on non-home pages */}
      {!isHomePage && (
        <div className="hidden lg:block">
          <AmbientSoundPlayer mode="fixed-top" />
        </div>
      )}

      {/* Mobile: Floating sounds on non-home pages */}
      {!isHomePage && (
        <div className="lg:hidden">
          <AmbientSoundPlayer mode="floating" />
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border safe-area-bottom">
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
        </div>
      </nav>
    </div>
  );
}
