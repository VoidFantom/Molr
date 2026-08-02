import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { LogOut } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import Sidebar from '../components/Sidebar';
import ThemeDropdown from '../components/ThemeDropdown';
import LogoutModal from '../components/LogoutModal';

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const { userData } = useData();
  
  const [displayName, setDisplayName] = useState(userData?.displayName || currentUser?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
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
            <h1 className="page-title mb-6 hidden md:block">Settings</h1>

            <section className="mb-8">
              <h2 className="section-header text-muted mb-3">Profile</h2>
              <div className="card p-4">
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

            <section className="mb-8">
              <h2 className="section-header text-muted mb-3">Appearance</h2>
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium w-full">
                    <div className="mb-2 text-sm text-muted">Theme</div>
                    <ThemeDropdown />
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="section-header text-muted mb-3">Account</h2>
              <div className="card p-4">
                <label className="label">Email Address</label>
                <input 
                  type="text" 
                  className="input opacity-50 cursor-not-allowed" 
                  value={currentUser?.email || ''} 
                  readOnly
                />
              </div>
            </section>

            <section className="mb-8">
              <h2 className="section-header text-muted mb-3">About</h2>
              <div className="card p-5 text-center">
                <h3 className="font-bold text-lg mb-1">Molr</h3>
                <p className="text-secondary text-muted">Catch up on your backlog, one micro-task at a time.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="section-header text-muted mb-3" style={{ color: '#DC2626' }}>Danger Zone</h2>
              <div className="card p-2 border-red-200" style={{ borderColor: 'rgba(220, 38, 38, 0.2)' }}>
                <button 
                  onClick={() => setIsLogoutModalOpen(true)} 
                  className="flex items-center justify-between p-3 rounded-lg text-danger hover:bg-red-50 transition-colors text-left font-medium w-full"
                  style={{ color: '#DC2626' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
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

      <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} />
    </div>
  );
}
