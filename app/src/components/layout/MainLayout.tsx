import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps { children: React.ReactNode; currentPath: string; onNavigate: (path: string) => void; onLogout: () => void; }

export default function MainLayout({ children, currentPath, onNavigate, onLogout }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout} />
      <Header collapsed={collapsed} currentPath={currentPath} onLogout={onLogout} />
      <main className={`pt-16 transition-all duration-300 ${isMobile ? '' : collapsed ? 'pl-16' : 'pl-64'}`}>
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
