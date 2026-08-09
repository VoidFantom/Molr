import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Trash2, ChevronDown } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, deleteUser } from 'firebase/auth';
import { deleteAccountData } from '../services/db';
import Sidebar from '../components/Sidebar';
import ThemeDropdown from '../components/ThemeDropdown';
import LogoutModal from '../components/LogoutModal';
import ReauthModal from '../components/ReauthModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

function FontDropdown() {
  const { fontScale, setFontScale } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = [
    { id: 'small', label: 'Small' },
    { id: 'default', label: 'Medium (default)' },
    { id: 'large', label: 'Large' }
  ];

  const activeOption = options.find(o => o.id === fontScale) || options[1];

  return (
    <div className="relative w-full mt-2" ref={dropdownRef}>
      <button 
        type="button"
        className="w-full flex items-center justify-between p-3 rounded-lg border border-transparent menu-item-hover focus-visible"
        style={{ backgroundColor: isOpen ? 'var(--bg-color)' : 'transparent', color: 'var(--text-main)' }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Font Size"
      >
        <div className="font-medium">
          {activeOption.label}
        </div>
        <ChevronDown size={20} className="text-muted" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-full rounded-xl shadow-lg border z-50 overflow-hidden dropdown-anim" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)' }}>
          {options.map((opt) => (
            <button
              key={opt.id}
              className="w-full flex items-center p-3 text-left font-medium menu-item-hover focus-visible"
              style={{ backgroundColor: fontScale === opt.id ? 'var(--bg-color)' : 'transparent' }}
              onClick={() => {
                setFontScale(opt.id);
                setIsOpen(false);
              }}
              aria-label={`Set font size to ${opt.label}`}
            >
              <span style={{ color: fontScale === opt.id ? 'var(--primary)' : 'var(--text-main)' }}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const { userData } = useData();
  const { 
    reduceMotion, toggleReduceMotion,
    fontScale, setFontScale,
    highContrast, toggleHighContrast 
  } = useTheme();
  
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
              </div>
            </section>
            
            <section className="mb-4">
              <h2 className="section-header text-muted mb-3">Accessibility</h2>
              <div className="card p-4 flex flex-col gap-4">
                
                <div className="flex items-center justify-between">
                  <div className="font-medium w-full">
                    <div className="text-sm">Font Size</div>
                    <div className="text-xs text-muted font-normal mt-0.5">Scale the interface text size.</div>
                    <FontDropdown />
                  </div>
                </div>

                <div className="border-t my-1" style={{ borderColor: 'var(--border-color)' }}></div>
                
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    <div className="text-sm">High Contrast</div>
                    <div className="text-xs text-muted font-normal mt-0.5">Increase legibility with stronger colors.</div>
                  </div>
                  <button 
                    onClick={toggleHighContrast}
                    className={`toggle-switch ${highContrast ? 'on' : ''} focus-visible`}
                    aria-label="Toggle High Contrast"
                    role="switch"
                    aria-checked={highContrast}
                  >
                    <div className="toggle-thumb"></div>
                  </button>
                </div>

                <div className="border-t my-1" style={{ borderColor: 'var(--border-color)' }}></div>
                
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    <div className="text-sm">Reduce Motion</div>
                    <div className="text-xs text-muted font-normal mt-0.5">Disable non-essential animations.</div>
                  </div>
                  <button 
                    onClick={toggleReduceMotion}
                    className={`toggle-switch ${reduceMotion ? 'on' : ''} focus-visible`}
                    aria-label="Toggle Reduce Motion"
                    role="switch"
                    aria-checked={reduceMotion}
                  >
                    <div className="toggle-thumb"></div>
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
