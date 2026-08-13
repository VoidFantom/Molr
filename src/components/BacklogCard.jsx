import React, { useEffect, useState, useRef } from 'react';
import { BookOpen, CheckCircle, MoreVertical, Trash2, Eye, Archive, FileText } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { toggleDynamicTaskCompletion, deleteBacklog, archiveBacklog } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import TaskItem from './TaskItem';
import { getCurrentTask } from '../utils/tasks';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import PdfViewer from './PdfViewer';

export default function BacklogCard({ backlog }) {
  const { currentUser } = useAuth();
  const { subjects, chapters } = useData();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  
  const [isKebabHovered, setIsKebabHovered] = useState(false);
  const [isKebabActive, setIsKebabActive] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
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
            {chapter?.pdfKey && (
              <button 
                type="button"
                onClick={() => setIsPdfOpen(true)}
                className="btn btn-outline text-xs flex items-center gap-1.5 font-medium"
                style={{ padding: '0.375rem 0.625rem', borderRadius: '0.5rem' }}
                title="View Cheat Sheet"
              >
                <FileText size={14} className="text-primary" />
                <span>View Cheat Sheet</span>
              </button>
            )}
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
              <BookOpen size={20} />
            </div>
            
            <div className="relative" ref={menuRef} style={{ position: 'relative' }}>
              <button 
                onMouseEnter={() => setIsKebabHovered(true)}
                onMouseLeave={() => { setIsKebabHovered(false); setIsKebabActive(false); }}
                onMouseDown={() => setIsKebabActive(true)}
                onMouseUp={() => setIsKebabActive(false)}
                onTouchStart={() => setIsKebabActive(true)}
                onTouchEnd={() => setIsKebabActive(false)}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`flex items-center justify-center focus-visible`}
                aria-label="Options"
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  color: isMenuOpen ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: (isKebabHovered || isMenuOpen) ? '0 0 6px color-mix(in srgb, var(--primary) 50%, transparent)' : 'none',
                  backgroundColor: (isKebabHovered || isMenuOpen) ? 'var(--primary-light)' : 'transparent',
                  borderRadius: '6px',
                  padding: '4px',
                  transform: isKebabActive ? 'scale(0.94)' : 'scale(1)',
                  transition: 'box-shadow 150ms ease-out, background-color 150ms ease-out, transform 150ms ease-out, color 150ms ease-out'
                }}
              >
                <MoreVertical 
                  size={20} 
                  style={{ 
                    transform: isMenuOpen ? 'rotate(90deg)' : (isKebabHovered ? 'scale(1.1)' : 'rotate(0deg) scale(1)'),
                    transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)' 
                  }} 
                />
              </button>
              
              {isMenuOpen && (
                <div 
                  className="mt-1 w-48 rounded-lg shadow-lg py-1 z-10 dropdown-anim"
                  style={{ 
                    backgroundColor: 'var(--surface)', 
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    position: 'absolute',
                    right: 0
                  }}
                  role="menu"
                >
                  <button
                    onMouseEnter={() => setHoveredItem('details')}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => {
                      setIsMenuOpen(false);
                      console.log("View Details clicked for:", backlog.id);
                    }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors focus-visible stagger-item stagger-delay-1"
                    style={{ 
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-main)',
                      backgroundColor: hoveredItem === 'details' ? 'var(--primary-light)' : 'transparent'
                    }}
                    role="menuitem"
                  >
                    <Eye size={16} className="text-muted" />
                    View Details
                  </button>
                  
                  <button
                    onMouseEnter={() => setHoveredItem('archive')}
                    onMouseLeave={() => setHoveredItem(null)}
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
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors focus-visible stagger-item stagger-delay-2"
                    style={{ 
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-main)',
                      backgroundColor: hoveredItem === 'archive' ? 'var(--primary-light)' : 'transparent'
                    }}
                    role="menuitem"
                  >
                    <Archive size={16} className="text-muted" />
                    {backlog.archived ? "Unarchive Backlog" : "Archive Backlog"}
                  </button>

                  <div className="border-t my-1 mx-2 stagger-item stagger-delay-3" style={{ borderColor: 'var(--border-color)' }}></div>
                  
                  <button
                    onMouseEnter={() => setHoveredItem('delete')}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsDeleteModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors focus-visible stagger-item stagger-delay-4"
                    style={{ 
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--danger)',
                      backgroundColor: hoveredItem === 'delete' ? 'var(--primary-light)' : 'transparent'
                    }}
                    role="menuitem"
                  >
                    <Trash2 size={16} style={{ color: hoveredItem === 'delete' ? 'var(--danger)' : 'currentColor' }} className="transition-colors" />
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

      {isPdfOpen && chapter?.pdfKey && (
        <PdfViewer 
          pdfKey={chapter.pdfKey} 
          title={`Cheat Sheet — Chapter ${chapter.chapterNumber}: ${chapter.name}`}
          onClose={() => setIsPdfOpen(false)}
        />
      )}
    </>
  );
}
