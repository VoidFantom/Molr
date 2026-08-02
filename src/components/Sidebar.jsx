import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, LogOut, Menu } from 'lucide-react';
import LogoutModal from './LogoutModal';

const VerticalLines = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="6" y1="3" x2="6" y2="21" />
    <line x1="18" y1="3" x2="18" y2="21" />
  </svg>
);

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close sidebar on navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      <div className="app-header">
        <button 
          className="icon-btn" 
          onClick={() => setIsMobileOpen(true)} 
          title="Open sidebar"
        >
          <Menu size={24} />
        </button>
        <h1>Molr</h1>
        <div style={{ width: '40px' }}></div> {/* Spacer for center alignment */}
      </div>

      <div 
        className={`sidebar-backdrop ${isMobileOpen ? 'visible' : ''}`} 
        onClick={() => setIsMobileOpen(false)} 
      />

      <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
        <div className="flex items-center justify-between w-full">
          <button 
            className="icon-btn" 
            onClick={() => setIsMobileOpen(false)} 
            title="Close sidebar"
          >
            <VerticalLines size={24} />
          </button>
          <h1 className="font-bold text-primary text-xl m-0">Molr</h1>
          <div style={{ width: '40px' }}></div>
        </div>
        
        <nav className="flex flex-col gap-2 flex-1 w-full">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button 
                key={item.name}
                onClick={() => navigate(item.path)} 
                className={`icon-btn flex items-center gap-3 w-full justify-start px-3 py-2 ${isActive ? 'text-primary bg-primary-light' : ''}`}
                title={item.name}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
          
          <button 
            onClick={() => {
              setIsMobileOpen(false);
              setIsLogoutModalOpen(true);
            }} 
            className="btn btn-danger flex items-center gap-3 w-full justify-start px-3 py-2 rounded-lg font-medium transition-colors mt-auto"
            title="Log Out"
          >
            <LogOut size={20} />
            <span className="font-medium">Log Out</span>
          </button>
        </nav>
      </aside>

      <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} />
    </>
  );
}
