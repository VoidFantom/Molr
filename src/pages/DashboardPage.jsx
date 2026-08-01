import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import StreakBadge from '../components/StreakBadge';
import BacklogCard from '../components/BacklogCard';
import AddBacklogModal from '../components/AddBacklogModal';
import { Plus, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { logout } = useAuth();
  const { userData, activeBacklogs, loading } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  if (loading || !userData) {
    return <div className="app-container flex items-center justify-center h-screen"><div className="text-muted font-medium">Loading...</div></div>;
  }

  return (
    <div className="app-container page-enter">
      <div className="app-layout">
        <aside className="sidebar">
          <h1 className="text-xl font-bold md:mb-8">Molr</h1>
          <nav className="flex md:flex-col gap-2">
            <button onClick={() => navigate('/settings')} className="icon-btn flex items-center gap-2" title="Settings">
              <Settings size={20} />
              <span className="hidden md:inline font-medium">Settings</span>
            </button>
          </nav>
        </aside>

        <main className="main-content">
        <StreakBadge currentStreak={userData.currentStreak || 0} />
        
        <div className="flex justify-between items-end mb-4 mt-8">
          <h2 className="text-lg font-semibold">Active Catch-ups</h2>
        </div>

        {activeBacklogs.length === 0 ? (
          <div className="text-center p-8 bg-surface rounded-xl border border-gray-100 mt-4 shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="font-semibold text-lg mb-2">You're all clear!</h3>
            <p className="text-sm text-muted mb-6">No active plans. Add one to start catching up.</p>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary px-6 mx-auto flex items-center justify-center">
              <Plus size={18} className="mr-1" /> Add Backlog
            </button>
          </div>
        ) : (
          <div className="backlog-grid">
            {activeBacklogs.map(backlog => (
              <BacklogCard key={backlog.id} backlog={backlog} />
            ))}
          </div>
        )}
      </main>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all z-40 btn-primary"
      >
        <Plus size={28} />
      </button>

      <AddBacklogModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
