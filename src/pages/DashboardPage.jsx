import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import StreakBadge from '../components/StreakBadge';
import BacklogCard from '../components/BacklogCard';
import AddBacklogModal from '../components/AddBacklogModal';
import { Plus, Inbox } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';

export default function DashboardPage() {
  const { userData, activeBacklogs, loading } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading || !userData) {
    return (
      <div className="app-container flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="app-container page-enter">
      <div className="app-layout">
        <Sidebar />

        <main className="main-content">
        <StreakBadge currentStreak={userData.currentStreak || 0} />
        
        <div className="flex justify-between items-end mb-4 mt-8">
          <h2 className="text-lg font-semibold">Active Catch-ups</h2>
        </div>

        {activeBacklogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
            <div className="p-4 rounded-full mb-4" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Inbox size={48} />
            </div>
            <h3 className="font-semibold text-xl mb-2">No chapters yet</h3>
            <p className="text-sm text-muted mb-6">Content is on its way — check back soon!</p>
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
