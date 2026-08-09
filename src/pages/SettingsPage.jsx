import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Trash2 } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, deleteUser } from 'firebase/auth';
import { deleteAccountData } from '../services/db';
import Sidebar from '../components/Sidebar';
import ThemeDropdown from '../components/ThemeDropdown';
import LogoutModal from '../components/LogoutModal';
import ReauthModal from '../components/ReauthModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const { userData } = useData();
  const { reduceMotion, toggleReduceMotion } = useTheme();
  
  const [displayName, setDisplayName] = useState(userData?.displayName || currentUser?.displayName || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
  const [isReauthModalOpen, setIsReauthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'password' or 'delete'

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const isPasswordProvider = currentUser?.providerData?.some(p => p.providerId === 'password');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ text: '', type: '' });
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: displayName
      });
      setProfileMsg({ text: 'Profile updated!', type: 'success' });
    } catch (err) {
      setProfileMsg({ text: 'Error updating profile.', type: 'error' });
    }
    setSavingProfile(false);
  };

  const attemptUpdatePassword = async () => {
    setSavingPassword(true);
    setPasswordMsg({ text: '', type: '' });
    try {
      await updatePassword(currentUser, newPassword);
      setPasswordMsg({ text: 'Password updated successfully!', type: 'success' });
      setNewPassword('');
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setPendingAction('password');
        setIsReauthModalOpen(true);
      } else {
        setPasswordMsg({ text: err.message || 'Error updating password.', type: 'error' });
      }
    }
    setSavingPassword(false);
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    await attemptUpdatePassword();
  };

  const attemptDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteAccountData(currentUser.uid);
      await deleteUser(currentUser);
      // Auth state changes to null, app redirects automatically
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setPendingAction('delete');
        setIsReauthModalOpen(true);
      } else {
        console.error("Error deleting account:", err);
      }
      setIsDeletingAccount(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleReauthSuccess = async () => {
    setIsReauthModalOpen(false);
    if (pendingAction === 'password') {
      await attemptUpdatePassword();
    } else if (pendingAction === 'delete') {
      setIsDeleteModalOpen(true); // Open the actual confirmation modal now that we're re-authed
    }
    setPendingAction(null);
  };

  const handleDeleteClick = () => {
    // If we trigger this, we'll assume they need re-auth for safety (or we can just try)
    // Actually, delete account requires recent login. Let's just pop the confirm modal first.
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="app-container page-enter">
      <div className="app-layout">
        <Sidebar />

        <main className="main-content flex-col gap-4 flex">
          <div className="max-w-xl w-full pb-10">
            <h1 className="page-title mb-4 hidden md:block">Settings</h1>

            <section className="mb-4">
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
                      <button type="submit" disabled={savingProfile || displayName === (userData?.displayName || currentUser?.displayName)} className="btn btn-primary">
                        {savingProfile ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                  {profileMsg.text && (
                    <div className={`text-xs font-medium mt-1 ${profileMsg.type === 'error' ? 'text-danger' : 'text-success'}`}>
                      {profileMsg.text}
                    </div>
                  )}
                </form>
              </div>
            </section>

            <section className="mb-4">
              <h2 className="section-header text-muted mb-3">Appearance</h2>
              <div className="card p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium w-full">
                    <div className="mb-2 text-sm text-muted">Theme</div>
                    <ThemeDropdown />
                  </div>
                </div>
                
                <div className="border-t border-color my-1"></div>
                
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    <div className="text-sm">Reduce Motion</div>
                    <div className="text-xs text-muted font-normal mt-0.5">Disable non-essential animations.</div>
                  </div>
                  <button 
                    onClick={toggleReduceMotion}
                    className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
                    style={{ backgroundColor: reduceMotion ? 'var(--primary)' : 'var(--border-color)' }}
                  >
                    <div 
                      className="absolute top-1 left-1 bg-white rounded-full h-4 w-4 transition-transform"
                      style={{ transform: reduceMotion ? 'translateX(20px)' : 'translateX(0)' }}
                    ></div>
                  </button>
                </div>
              </div>
            </section>

            <section className="mb-4">
              <h2 className="section-header text-muted mb-3">Account</h2>
              <div className="card p-4 flex flex-col gap-4">
                <div>
                  <label className="label">Email Address</label>
                  <input 
                    type="text" 
                    className="input opacity-50 cursor-not-allowed" 
                    value={currentUser?.email || ''} 
                    readOnly
                  />
                </div>
                
                {isPasswordProvider && (
                  <div>
                    <label className="label">Change Password</label>
                    <form onSubmit={handleSavePassword} className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input 
                          type="password" 
                          className="input flex-1" 
                          value={newPassword} 
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="New Password"
                        />
                        <button type="submit" disabled={savingPassword || !newPassword} className="btn btn-primary">
                          {savingPassword ? 'Updating...' : 'Update'}
                        </button>
                      </div>
                      {passwordMsg.text && (
                        <div className={`text-xs font-medium mt-1 ${passwordMsg.type === 'error' ? 'text-danger' : 'text-success'}`}>
                          {passwordMsg.text}
                        </div>
                      )}
                    </form>
                  </div>
                )}
              </div>
            </section>

            <section className="mb-4">
              <h2 className="section-header text-muted mb-3">About</h2>
              <div className="card p-5 text-center">
                <h3 className="font-bold text-lg mb-1">Molr</h3>
                <p className="text-secondary text-muted">Catch up on your backlog, one micro-task at a time.</p>
              </div>
            </section>

            <section className="mb-4">
              <h2 className="section-header text-muted mb-3" style={{ color: 'var(--danger)' }}>Danger Zone</h2>
              <div className="card p-2 flex flex-col gap-2" style={{ borderColor: 'var(--danger-light)' }}>
                <button 
                  onClick={() => setIsLogoutModalOpen(true)} 
                  className="btn btn-danger flex items-center justify-between p-3 rounded-lg transition-colors text-left font-medium w-full"
                >
                  <div className="flex items-center gap-3">
                    <LogOut size={20} />
                    Log Out
                  </div>
                </button>
                
                <button 
                  onClick={handleDeleteClick} 
                  className="btn flex items-center justify-between p-3 rounded-lg transition-colors text-left font-medium w-full hover:bg-red-50 dark:hover:bg-red-900/20"
                  style={{ color: 'var(--danger)' }}
                >
                  <div className="flex items-center gap-3">
                    <Trash2 size={20} />
                    Delete Account
                  </div>
                </button>
              </div>
            </section>

          </div>
        </main>
      </div>

      <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} />
      
      <ReauthModal 
        isOpen={isReauthModalOpen} 
        onClose={() => {
          setIsReauthModalOpen(false);
          setPendingAction(null);
        }}
        onAuthenticated={handleReauthSuccess}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={attemptDeleteAccount}
        isDeleting={isDeletingAccount}
        title="Delete Account"
        message="Are you completely sure? This will permanently delete your account, all your active backlogs, and all your progress. This action cannot be undone."
      />
    </div>
  );
}
