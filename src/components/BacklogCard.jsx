import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ensureDailySnapshot, toggleTaskCompletion } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import TaskItem from './TaskItem';

export default function BacklogCard({ backlog }) {
  const { currentUser } = useAuth();
  const { subjects, chapters } = useData();
  const [tasks, setTasks] = useState([]);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  const subject = subjects.find(s => s.id === backlog.subjectId);
  const chapter = chapters.find(c => c.id === backlog.chapterId);
  
  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch chapter tasks
        const q = query(
          collection(db, `chapters/${backlog.chapterId}/tasks`), 
          orderBy('order')
        );
        const snap = await getDocs(q);
        const chapterTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // 2. Fetch notes for these tasks
        const notesQ = query(collection(db, 'notes'), where('chapterId', '==', backlog.chapterId));
        const notesSnap = await getDocs(notesQ);
        const notes = notesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        const tasksWithNotes = chapterTasks.map((t, index) => {
          const note = notes.find(n => n.taskId === t.id);
          
          // INJECT DUMMY DATA FOR TESTING
          if (index === 0 && !t.quiz) {
            t.quiz = [
              {
                question: "What is the primary unit of force in the SI system?",
                options: ["Joule", "Newton", "Watt", "Pascal"],
                correctAnswerIndex: 1
              },
              {
                question: "Which law is also known as the Law of Inertia?",
                options: ["First Law", "Second Law", "Third Law", "Law of Gravitation"],
                correctAnswerIndex: 0
              }
            ];
          }
          if (index === 1 && !t.answerKey) {
            t.answerKey = "Step 1: Identify the given values (m = 5kg, a = 9.8m/s²).\nStep 2: Use the formula F = ma.\nStep 3: F = 5 * 9.8 = 49 N.\n\nFinal Answer: 49 Newtons.";
          }
          
          return { ...t, note };
        });
        
        setTasks(tasksWithNotes);

        // 3. Ensure daily snapshot exists
        const dailySnap = await ensureDailySnapshot(currentUser.uid, backlog.id, backlog, chapterTasks);
        setSnapshot(dailySnap);
      } catch (err) {
        console.error("Error loading chapter plan", err);
      }
      setLoading(false);
    }
    
    if (backlog && currentUser) {
      loadData();
    }
  }, [backlog, currentUser]);

  const handleToggle = async (taskId, isChecked) => {
    // Optimistic UI update could go here, but for simplicity we rely on next snapshot fetch or force re-fetch
    // Wait, the toggleTaskCompletion updates the snapshot and backlog docs, 
    // DataContext will give us the new backlog doc, but snapshot is local to this component.
    // Let's update local state optimistically.
    
    const newCompleted = [...(backlog.completedTaskIds || [])];
    if (isChecked) {
      newCompleted.push(taskId);
    } else {
      const idx = newCompleted.indexOf(taskId);
      if (idx > -1) newCompleted.splice(idx, 1);
    }

    if (snapshot && isChecked) {
      const allDone = snapshot.taskIds.every(id => newCompleted.includes(id));
      if (allDone && !snapshot.allCompleted) {
        setSnapshot({ ...snapshot, allCompleted: true });
      }
    } else if (snapshot && !isChecked && snapshot.allCompleted) {
      setSnapshot({ ...snapshot, allCompleted: false });
    }

    await toggleTaskCompletion(
      currentUser.uid, 
      backlog.id, 
      taskId, 
      isChecked, 
      backlog.completedTaskIds || [], 
      snapshot,
      currentUser
    );
  };

  if (loading || !chapter) return <div className="card text-center text-muted text-sm">Loading plan...</div>;

  const totalTasks = chapter.taskCount || tasks.length;
  const completedCount = (backlog.completedTaskIds || []).length;
  const progressPercent = totalTasks === 0 ? 100 : Math.min(100, Math.round((completedCount / totalTasks) * 100));
  
  const todaysTasks = snapshot?.taskIds.map(id => tasks.find(t => t.id === id)).filter(Boolean) || [];

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-xs font-semibold text-primary mb-1">
            {subject?.name?.toUpperCase()}
          </div>
          <h3 className="font-semibold text-lg">{chapter.name}</h3>
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
          <span>Today's Targets</span>
          {snapshot?.allCompleted && (
            <span className="text-xs flex items-center gap-1 font-medium" style={{ color: 'var(--success)' }}>
              <CheckCircle size={14} fill="var(--success)" color="white" /> All Done!
            </span>
          )}
        </h4>
        
        {todaysTasks.length === 0 ? (
          <div className="text-sm text-muted p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-color)' }}>
            No tasks for today. You're all caught up!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {todaysTasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                isChecked={(backlog.completedTaskIds || []).includes(task.id)}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
