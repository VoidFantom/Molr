import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

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
          onClick={handleLogout} 
          className="icon-btn flex items-center gap-3 w-auto md:w-full md:justify-start px-3 py-2 text-danger hover:bg-red-50 hidden md:flex md:mt-auto"
          title="Log Out"
        >
          <LogOut size={20} />
          <span className="hidden md:inline font-medium">Log Out</span>
        </button>
      </nav>
    </aside>
  );
}
