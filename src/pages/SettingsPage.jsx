import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Bell, Download } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import Sidebar from '../components/Sidebar';
import ThemeDropdown from '../components/ThemeDropdown';

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const { userData } = useData();
  
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

  return (
    <div className="app-container page-enter">
      <div className="app-layout">
        <Sidebar />

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
            <div className="flex items-center justify-between p-3 rounded-lg w-full">
              <div className="font-medium w-full">
                <div className="mb-2 text-sm text-muted">Theme</div>
                <ThemeDropdown />
              </div>
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

          </div>
        </section>

          </div>
        </main>
      </div>
    </div>
  );
}
