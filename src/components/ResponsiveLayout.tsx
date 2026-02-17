import { ReactNode } from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { Home, Clock, FolderOpen, Globe } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import AmbientSoundPlayer from './AmbientSoundPlayer';
import UserMenu, { SyncStatus } from './UserMenu';

interface ResponsiveLayoutProps {
  children: ReactNode;
}

export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const { t, language, setLanguage } = useApp();

  const links = [
    { to: '/', icon: Home, label: t('home') },
    { to: '/timeline', icon: Clock, label: t('timeline') },
    { to: '/projects', icon: FolderOpen, label: t('projects') },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-e border-border">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo/Title */}
          <div className="flex items-center justify-center gap-3 h-20 px-4 border-b border-border">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="ساعتي" className="h-14 w-14 object-contain" />
            <h1 className="text-xl font-bold text-primary">{t('appName')}</h1>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {links.map(link => (
              <RouterNavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`
                }
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </RouterNavLink>
            ))}
          </nav>

          {/* Language Toggle */}
          <div className="px-4 py-4 border-t border-border space-y-2">
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Globe className="w-5 h-5" />
              <span>{language === 'ar' ? 'English' : 'عربي'}</span>
            </button>
            <div className="flex items-center justify-between px-4">
              <SyncStatus />
              <UserMenu />
            </div>
          </div>

          {/* Ambient Sound Player */}
          <div className="px-4 pb-4">
            <AmbientSoundPlayer />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ms-64 overflow-auto">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-2">
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="ساعتي" className="h-8 w-8 object-contain" />
              <h1 className="text-lg font-bold text-primary">{t('appName')}</h1>
            </div>
            <div className="flex items-center gap-2">
              <SyncStatus />
              <UserMenu />
            </div>
          </div>
        </header>
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>

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
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors min-w-[64px]"
          >
            <Globe className="w-5 h-5" />
            <span className="text-[11px]">{language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>
        </div>
      </nav>

      {/* Mobile Ambient Sound Player - Floating */}
      <div className="lg:hidden fixed bottom-20 end-4 z-40">
        <AmbientSoundPlayer compact />
      </div>
    </div>
  );
}
