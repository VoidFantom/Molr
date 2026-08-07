import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { toggleDynamicTaskCompletion } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import TaskItem from './TaskItem';
import { getCurrentTask } from '../utils/tasks';

export default function BacklogCard({ backlog }) {
  const { currentUser } = useAuth();
  const { subjects, chapters } = useData();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleToggle = async (taskId, isChecked) => {
    // Optimistic UI update
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

  if (loading || !chapter) return <div className="card text-center text-muted text-sm">Loading plan...</div>;

  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = totalTasks === 0 ? 0 : Math.min(100, Math.round((completedCount / totalTasks) * 100));
  
  const currentTask = getCurrentTask(tasks);
  const allCompleted = totalTasks > 0 && completedCount === totalTasks;

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-xs font-semibold text-primary mb-1">
            {subject?.name?.toUpperCase()}
          </div>
          <h3 className="font-semibold text-lg">Chapter {chapter.chapterNumber}: {chapter.name}</h3>
        </div>
        <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
          <BookOpen size={20} />
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
  );
}

