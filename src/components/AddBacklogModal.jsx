import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { SUBJECTS } from '../data/curriculum';
import { X, ArrowLeft, Check } from 'lucide-react';
import { getTodayStr } from '../services/db';
import { differenceInDays, addDays, format, parseISO, startOfDay } from 'date-fns';

export default function AddBacklogModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  
  const todayDate = startOfDay(new Date());
  const minDateStr = format(addDays(todayDate, 1), 'yyyy-MM-dd');
  const maxDateStr = format(addDays(todayDate, 30), 'yyyy-MM-dd');
  
  const [targetDate, setTargetDate] = useState(minDateStr);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectedSubject = SUBJECTS.find(s => s.id === subjectId);
  const chapters = selectedSubject ? selectedSubject.chapters : [];

  const daysSelected = targetDate ? differenceInDays(parseISO(targetDate), todayDate) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subjectId || !chapterId || !targetDate) return;
    
    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      const backlogRef = doc(collection(db, `backlogs/${currentUser.uid}/items`));
      const backlogId = backlogRef.id;

      batch.set(backlogRef, {
        subjectId,
        chapterId,
        startDate: getTodayStr(),
        targetDate,
        status: 'active',
        createdAt: serverTimestamp()
      });

      let daysAvailable = differenceInDays(parseISO(targetDate), todayDate);
      if (daysAvailable < 1) daysAvailable = 1;
      if (daysAvailable > 30) daysAvailable = 30;

      const chapterName = chapters.find(c => c.id === chapterId)?.name || 'Chapter';

      for (let i = 0; i < daysAvailable; i++) {
        const taskRef = doc(collection(db, `backlogs/${currentUser.uid}/items/${backlogId}/tasks`));
        batch.set(taskRef, {
          dayNumber: i + 1,
          title: `Day ${i + 1} of ${chapterName}`,
          completed: false,
          chapterId: chapterId,
          openedCheatSheetAt: null,
        });
      }
      
      await batch.commit();

      setSubjectId('');
      setChapterId('');
      setTargetDate(minDateStr);
      onClose();
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  };

  const resetFlow = () => {
    setSubjectId('');
    setChapterId('');
    setTargetDate(minDateStr);
  };

  return (
    <div className="modal-overlay" onClick={() => { resetFlow(); onClose(); }}>
      <style>
        {`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        `}
      </style>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            {subjectId && (
              <button 
                onClick={() => { setSubjectId(''); setChapterId(''); }} 
                className="icon-btn p-1"
                type="button"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h2 className="text-xl font-semibold">
                {!subjectId ? "Select Subject" : selectedSubject.name}
              </h2>
              {subjectId && (
                <div className="text-xs text-muted font-medium mt-1">Step 2 of 2</div>
              )}
            </div>
          </div>
          <button 
            onClick={() => { resetFlow(); onClose(); }} 
            className="icon-btn p-1"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div>
          {!subjectId ? (
            /* STEP 1: SUBJECTS */
            <div>
              <p className="text-sm text-muted mb-4 font-medium">Choose a subject to see available chapters.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {SUBJECTS.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => setSubjectId(s.id)}
                    className="card"
                    style={{ margin: 0, cursor: 'pointer', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                  >
                    <h3 className="font-semibold text-lg">{s.name}</h3>
                    <div className="text-xs text-muted font-medium">{s.chapters.length} chapters</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* STEP 2: CHAPTERS & FORM */
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label className="label mb-3">Select Chapter</label>
                <div className="flex flex-col gap-2 hide-scrollbar" style={{ maxHeight: '45vh', overflowY: 'auto', padding: '4px', margin: '-4px' }}>
                  {chapters.map(c => {
                    const isSelected = chapterId === c.id;
                    return (
                      <div 
                        key={c.id}
                        onClick={() => setChapterId(c.id)}
                        className="card"
                        style={{ 
                          margin: 0, 
                          cursor: 'pointer', 
                          padding: '1rem 1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderColor: isSelected ? 'var(--primary)' : 'var(--border-color)',
                          backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface)'
                        }}
                      >
                        <span className={`font-medium ${isSelected ? 'text-primary' : ''}`}>Chapter {c.chapterNumber}: {c.name}</span>
                        {isSelected && <Check size={18} className="text-primary" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {chapterId && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  <label className="label">Target Catch-up Date</label>
                  <input 
                    type="date" 
                    className="input"
                    value={targetDate} 
                    min={minDateStr}
                    onChange={e => setTargetDate(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted mt-2 font-medium">
                    We'll calculate your daily tasks to meet this date!
                  </p>
                  
                  {daysSelected > 15 && (
                    <div className="mt-4 text-sm font-medium" style={{ color: 'var(--warning-text, #d97706)' }}>
                      That's a relaxed pace — this chapter may take a while at this rate.
                    </div>
                  )}
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary w-full mt-4"
                    disabled={isSubmitting || !subjectId || !chapterId || !targetDate}
                  >
                    {isSubmitting ? 'Adding...' : 'Create Catch-up Plan'}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

