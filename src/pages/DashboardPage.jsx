import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import StreakBadge from '../components/StreakBadge';
import BacklogCard from '../components/BacklogCard';
import AddBacklogModal from '../components/AddBacklogModal';
import { Plus, Inbox, Archive, ChevronDown } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';

export default function DashboardPage() {
  const { userData, activeBacklogs, loading } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const visibleBacklogs = activeBacklogs.filter(b => !b.archived);
  const archivedBacklogs = activeBacklogs.filter(b => b.archived);

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
          
          <div className="flex justify-between items-center mb-4 mt-6">
            <h2 className="section-header">Active Catch-ups</h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary px-4 py-2 flex items-center gap-2 rounded-xl focus-visible"
              style={{ fontSize: '14px' }}
              aria-label="Add Backlog"
            >
              <Plus size={18} />
              <span>Add Backlog</span>
            </button>
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
            <>
              {visibleBacklogs.length === 0 && !showArchived ? (
                <div className="text-center p-8 text-muted text-sm">
                  All active backlogs are archived.
                </div>
              ) : (
                <div className="backlog-grid mb-8">
                  {visibleBacklogs.map(backlog => (
                    <BacklogCard key={backlog.id} backlog={backlog} />
                  ))}
                </div>
              )}

              {archivedBacklogs.length > 0 && (
                <div className="mt-12">
                  <button 
                    onClick={() => setShowArchived(!showArchived)}
                    className="flex items-center gap-3 w-full group focus-visible p-2 -ml-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    aria-expanded={showArchived}
                    aria-controls="archived-list"
                  >
                    <Archive size={20} className="text-muted group-hover:text-primary transition-colors" />
                    <h3 className="text-sm font-semibold text-muted group-hover:text-primary transition-colors">
                      Archived ({archivedBacklogs.length})
                    </h3>
                    <div className="flex-1 border-t mx-2" style={{ borderColor: 'var(--border-color)' }}></div>
                    <ChevronDown 
                      size={18} 
                      className="text-muted group-hover:text-primary transition-all" 
                      style={{ transform: showArchived ? 'rotate(180deg)' : 'rotate(0)' }} 
                    />
                  </button>
                  
                  <div 
                    id="archived-list" 
                    className="archived-wrapper mt-4" 
                    style={{ 
                      maxHeight: showArchived ? '2000px' : '0px',
                      opacity: showArchived ? 1 : 0,
                      pointerEvents: showArchived ? 'auto' : 'none'
                    }}
                  >
                    <div className="backlog-grid">
                      {archivedBacklogs.map(backlog => (
                        <BacklogCard key={backlog.id} backlog={backlog} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <AddBacklogModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
