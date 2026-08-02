import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, LogOut } from 'lucide-react';
import LogoutModal from './LogoutModal';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <h1 className="text-xl font-bold md:mb-8 text-center md:text-left w-full md:w-auto">Molr</h1>
      
      <nav className="flex md:flex-col gap-2 flex-1 w-full justify-end md:justify-start">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button 
              key={item.name}
              onClick={() => navigate(item.path)} 
              className={`icon-btn flex items-center gap-3 w-auto md:w-full md:justify-start px-3 py-2 ${isActive ? 'text-primary bg-primary-light' : ''}`}
              title={item.name}
            >
              <item.icon size={20} />
              <span className="hidden md:inline font-medium">{item.name}</span>
            </button>
          );
        })}
        
        <button 
          onClick={() => setIsLogoutModalOpen(true)} 
          className="btn btn-danger flex items-center gap-3 w-auto md:w-full md:justify-start px-3 py-2 rounded-lg font-medium transition-colors hidden md:flex md:mt-auto"
          title="Log Out"
        >
          <LogOut size={20} />
          <span className="hidden md:inline">Log Out</span>
        </button>
      </nav>
      
      <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} />
    </aside>
  );
}
