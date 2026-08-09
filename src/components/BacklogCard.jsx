import React, { useEffect, useState, useRef } from 'react';
import { BookOpen, CheckCircle, MoreVertical, Trash2, Eye, Archive } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { toggleDynamicTaskCompletion, deleteBacklog, archiveBacklog } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import TaskItem from './TaskItem';
import { getCurrentTask } from '../utils/tasks';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function BacklogCard({ backlog }) {
  const { currentUser } = useAuth();
  const { subjects, chapters } = useData();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const menuRef = useRef(null);

  const subject = subjects.find(s => s.id === backlog.subjectId);
  const chapter = chapters.find(c => c.id === backlog.chapterId);
  
  useEffect(() => {
    if (!currentUser || !backlog) return;

    const q = query(
      collection(db, `backlogs/${currentUser.uid}/items/${backlog.id}/tasks`), 
      orderBy('dayNumber')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const loadedTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTasks(loadedTasks);
      setLoading(false);
    }, (err) => {
      console.error("Error loading tasks", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [backlog, currentUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = async (taskId, isChecked) => {
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, completed: isChecked } : t);
    setTasks(newTasks);
    
    await toggleDynamicTaskCompletion(
      currentUser.uid, 
      backlog.id, 
      taskId, 
      isChecked, 
      newTasks
    );
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteBacklog(currentUser.uid, backlog.id);
    } catch (err) {
      console.error("Error deleting backlog", err);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading || !chapter) return <div className="card text-center text-muted text-sm">Loading plan...</div>;

  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = totalTasks === 0 ? 0 : Math.min(100, Math.round((completedCount / totalTasks) * 100));
  
  const currentTask = getCurrentTask(tasks);
  const allCompleted = totalTasks > 0 && completedCount === totalTasks;

  return (
    <>
      <div 
        className={`card backlog-card ${backlog.archived ? 'archived-card' : ''}`} 
        style={{ 
          position: 'relative',
          opacity: isExiting ? 0 : '',
          transform: isExiting ? 'scale(0.95)' : '',
          transition: 'opacity 0.2s ease, transform 0.2s ease, filter 0.3s ease, box-shadow 0.2s ease'
        }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-xs font-semibold text-primary mb-1">
              {subject?.name?.toUpperCase()}
            </div>
            <h3 className="font-semibold text-lg pr-8">Chapter {chapter.chapterNumber}: {chapter.name}</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
              <BookOpen size={20} />
            </div>
            
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-1.5 rounded-lg transition-colors focus-visible kebab-button ${isMenuOpen ? 'bg-black/5 dark:bg-white/5 kebab-open' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                aria-label="Options"
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
                style={{
                  color: isMenuOpen ? 'var(--primary)' : 'var(--text-muted)'
                }}
              >
                <MoreVertical 
                  size={20} 
                  style={{ 
                    transform: isMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)' 
                  }} 
                />
              </button>
              
              {isMenuOpen && (
                <div 
                  className="absolute right-0 mt-1 w-48 rounded-lg shadow-lg py-1 z-10 border dropdown-anim"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)' }}
                  role="menu"
                >
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      console.log("View Details clicked for:", backlog.id);
                    }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5 focus-visible stagger-item stagger-delay-1"
                    style={{ color: 'var(--text-main)' }}
                    role="menuitem"
                  >
                    <Eye size={16} className="text-muted" />
                    View Details
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsExiting(true);
                      setTimeout(async () => {
                        try {
                          await archiveBacklog(currentUser.uid, backlog.id, !backlog.archived);
                        } catch (e) {
                          console.error("Error toggling archive status", e);
                          setIsExiting(false);
                        }
                      }, 200);
                    }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5 focus-visible stagger-item stagger-delay-2"
                    style={{ color: 'var(--text-main)' }}
                    role="menuitem"
                  >
                    <Archive size={16} className="text-muted" />
                    {backlog.archived ? "Unarchive Backlog" : "Archive Backlog"}
                  </button>

                  <div className="border-t my-1 mx-2 stagger-item stagger-delay-3" style={{ borderColor: 'var(--border-color)' }}></div>
                  
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsDeleteModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 focus-visible group stagger-item stagger-delay-4"
                    style={{ color: 'var(--danger)' }}
                    role="menuitem"
                  >
                    <Trash2 size={16} className="transition-colors group-hover:text-red-600 dark:group-hover:text-red-400" />
                    Delete Backlog
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted mb-2 font-medium">
            <span>Overall Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="progress-bg">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
            <span>Catch-up Plan</span>
            {allCompleted && (
              <span className="text-xs flex items-center gap-1 font-medium" style={{ color: 'var(--success)' }}>
                <CheckCircle size={14} fill="var(--success)" color="white" /> All Done!
              </span>
            )}
          </h4>
          
          {totalTasks === 0 ? (
            <div className="text-sm text-muted p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-color)' }}>
              No tasks found.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {tasks.map(task => {
                const isCurrent = currentTask && currentTask.id === task.id;
                
                return (
                  <div key={task.id} style={{
                    border: isCurrent ? '1px solid var(--primary)' : '1px solid transparent',
                    borderRadius: 'var(--radius)',
                    padding: isCurrent ? '4px' : '0',
                    transition: 'border-color 0.2s ease, padding 0.2s ease'
                  }}>
                    {isCurrent && (
                      <div className="text-xs text-primary font-semibold px-2 pt-1 pb-2">
                        Current Task
                      </div>
                    )}
                    <TaskItem 
                      task={task} 
                      isChecked={task.completed}
                      onToggle={handleToggle}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        title="Delete Backlog"
        message="Delete this backlog? This will remove all its tasks and progress. This can't be undone."
      />
    </>
  );
}
