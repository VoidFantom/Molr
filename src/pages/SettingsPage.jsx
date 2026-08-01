import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Moon, Sun, Bell, Download, LogOut } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { userData } = useData();
  const { theme, toggleTheme } = useTheme();
  
  const [displayName, setDisplayName] = useState(userData?.displayName || currentUser?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: displayName
      });
      setMsg('Profile updated!');
    } catch (err) {
      setMsg('Error updating profile.');
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-container page-enter">
      <div className="app-layout">
        <aside className="sidebar">
          <div className="flex items-center gap-4 w-full">
            <button onClick={() => navigate(-1)} className="icon-btn" title="Back">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold flex-1 text-center md:text-left md:mb-0">Settings</h1>
          </div>
        </aside>

        <main className="main-content flex-col gap-6 flex">
          <div className="max-w-xl w-full">
        <section>
          <h2 className="text-sm font-bold text-muted mb-3 uppercase tracking-wider">Profile</h2>
          <div className="card">
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
              <div>
                <label className="label">Display Name</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="input flex-1" 
                    value={displayName} 
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your Name"
                  />
                  <button type="submit" disabled={saving || displayName === (userData?.displayName || currentUser?.displayName)} className="btn btn-primary">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
              {msg && <div className="text-xs font-medium text-success mt-1">{msg}</div>}
            </form>
          </div>
        </section>

        {/* Preferences Section */}
        <section>
          <h2 className="text-sm font-bold text-muted mb-3 uppercase tracking-wider">Preferences</h2>
          <div className="card flex flex-col gap-1 p-2">
            
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={toggleTheme}>
              <div className="flex items-center gap-3 font-medium">
                {theme === 'dark' ? <Moon size={20} className="text-primary" /> : <Sun size={20} className="text-primary" />}
                Dark Mode
              </div>
              <button 
                className={`w-12 h-6 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-gray-300'}`}
                style={{ backgroundColor: theme === 'dark' ? 'var(--primary)' : 'var(--border-color)' }}
              >
                <div 
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : ''}`} 
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-3 font-medium">
                <Bell size={20} className="text-muted" />
                Notifications
              </div>
              <span className="text-xs text-muted font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-color)' }}>Coming Soon</span>
            </div>

          </div>
        </section>

        {/* Data & Account */}
        <section>
          <h2 className="text-sm font-bold text-muted mb-3 uppercase tracking-wider">Account</h2>
          <div className="card flex flex-col gap-1 p-2">
            
            <div className="flex items-center justify-between p-3 rounded-lg opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-3 font-medium">
                <Download size={20} className="text-muted" />
                Export Data
              </div>
              <span className="text-xs text-muted font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-color)' }}>Coming Soon</span>
            </div>

            <button onClick={handleLogout} className="flex items-center justify-between p-3 rounded-lg text-danger hover:bg-red-50 transition-colors text-left font-medium">
              <div className="flex items-center gap-3">
                <LogOut size={20} />
                Log Out
              </div>
            </button>

          </div>
        </section>

          </div>
        </main>
      </div>
    </div>
  );
}
