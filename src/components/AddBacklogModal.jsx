import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { X } from 'lucide-react';
import { getTodayStr } from '../services/db';

export default function AddBacklogModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const { subjects, chapters } = useData();
  
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [targetDate, setTargetDate] = useState(getTodayStr());
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const filteredChapters = chapters.filter(c => c.subjectId === subjectId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subjectId || !chapterId || !targetDate) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `backlogs/${currentUser.uid}/items`), {
        subjectId,
        chapterId,
        startDate: getTodayStr(),
        targetDate,
        completedTaskIds: [],
        status: 'active',
        createdAt: serverTimestamp()
      });
      
      setSubjectId('');
      setChapterId('');
      setTargetDate(getTodayStr());
      onClose();
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Add Catch-Up Target</h2>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} className="text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">Select Subject</label>
            <select 
              className="input"
              value={subjectId} 
              onChange={e => { setSubjectId(e.target.value); setChapterId(''); }}
              required
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="label">Select Chapter</label>
            <select 
              className="input"
              value={chapterId} 
              onChange={e => setChapterId(e.target.value)}
              disabled={!subjectId}
              required
            >
              <option value="">-- Choose Chapter --</option>
              {filteredChapters.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Target Catch-up Date</label>
            <input 
              type="date" 
              className="input"
              value={targetDate} 
              min={getTodayStr()}
              onChange={e => setTargetDate(e.target.value)}
              required
            />
            <p className="text-xs text-muted mt-2 font-medium">
              We'll calculate your daily tasks to meet this date!
            </p>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary mt-6 w-full"
            disabled={isSubmitting || !subjectId || !chapterId || !targetDate}
          >
            {isSubmitting ? 'Adding...' : 'Create Catch-up Plan'}
          </button>
        </form>
      </div>
    </div>
  );
}
