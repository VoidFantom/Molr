import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Check, X } from 'lucide-react';

export default function TaskItem({ task, isChecked, onToggle }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});

  const handleQuizSelect = (qIndex, optionIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [qIndex]: optionIndex
    }));
  };

  return (
    <div className={`checkbox-container p-3 rounded-lg ${isChecked ? 'checked' : ''} flex-col gap-3`} style={{ alignItems: 'stretch' }}>
      
      {/* Main Task Row */}
      <div className="flex items-start gap-3">
        <input 
          type="checkbox" 
          className="checkbox-input"
          checked={isChecked}
          onChange={(e) => onToggle(task.id, e.target.checked)}
        />
        <div className="flex-1 mt-1">
          <div className={`text-sm ${isChecked ? 'line-through text-muted' : 'font-medium'}`}>
            {task.title}
          </div>
          <div className="text-xs text-muted mt-1 font-medium">~{task.estMinutes} mins</div>
        </div>
        {task.note && (
          <a 
            href={task.note.downloadURL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-outline text-xs p-1 px-2 flex items-center gap-1 font-medium mt-1"
            style={{ padding: '0.375rem 0.625rem', borderRadius: '0.375rem' }}
          >
            Notes <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Quiz Section */}
      {task.quiz && task.quiz.length > 0 && (
        <div className="mt-2 p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
          <div className="text-xs font-semibold text-primary mb-3 uppercase tracking-wider">Quick Check</div>
          <div className="flex flex-col gap-4">
            {task.quiz.map((q, qIndex) => {
              const selectedOpt = selectedAnswers[qIndex];
              const isAnswered = selectedOpt !== undefined;
              
              return (
                <div key={qIndex} className="flex flex-col gap-2">
                  <div className="text-sm font-medium">{q.question}</div>
                  <div className="flex flex-col gap-1.5">
                    {q.options.map((opt, oIndex) => {
                      let btnStyle = "btn-outline";
                      let styleObj = { padding: '0.5rem 0.75rem', justifyContent: 'space-between', textAlign: 'left', fontWeight: '500', fontSize: '0.875rem' };
                      
                      if (isAnswered) {
                        if (oIndex === q.correctAnswerIndex) {
                          btnStyle = "btn-primary";
                          styleObj.backgroundColor = 'var(--success)';
                          styleObj.borderColor = 'var(--success)';
                          styleObj.boxShadow = 'none';
                        } else if (oIndex === selectedOpt) {
                          btnStyle = "btn-danger solid";
                          styleObj.boxShadow = 'none';
                        } else {
                          styleObj.opacity = 0.5;
                        }
                      }
                      
                      return (
                        <button 
                          key={oIndex}
                          disabled={isAnswered}
                          onClick={() => handleQuizSelect(qIndex, oIndex)}
                          className={`btn ${btnStyle} w-full flex items-center`}
                          style={styleObj}
                        >
                          <span style={{ flex: 1, textAlign: 'left' }}>{opt}</span>
                          {isAnswered && oIndex === q.correctAnswerIndex && <Check size={16} />}
                          {isAnswered && oIndex === selectedOpt && oIndex !== q.correctAnswerIndex && <X size={16} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Answer Key Section */}
      {task.answerKey && (
        <div className="mt-2">
          <button 
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
            onClick={() => setShowAnswer(!showAnswer)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {showAnswer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showAnswer ? "Hide Answer" : "Check Your Work"}
          </button>
          
          {showAnswer && (
            <div className="mt-3 p-3 rounded-lg text-sm text-muted whitespace-pre-wrap border" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
              {task.answerKey}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
