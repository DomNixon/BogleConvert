import React, { useState } from 'react';
import { UserProfile } from '../types';

interface SettingsProps {
  user: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateProfile }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user.twoFactorEnabled || false);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleSave = () => {
    setStatusMessage(null);

    // Validation
    if (newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) {
            setStatusMessage({ type: 'error', text: "Passwords do not match."});
            return;
        }
        if (newPassword.length < 6) {
            setStatusMessage({ type: 'error', text: "Password must be at least 6 characters."});
            return;
        }
    }

    // Call update handler
    onUpdateProfile({
        name,
        email,
        twoFactorEnabled
    });

    // Clear passwords after "save"
    setNewPassword('');
    setConfirmPassword('');

    setStatusMessage({ type: 'success', text: "Changes saved successfully."});
    
    // Clear success message after a few seconds
    setTimeout(() => {
        setStatusMessage(null);
    }, 3000);
  };

  const handleToggle2FA = () => {
      setTwoFactorEnabled(!twoFactorEnabled);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-8">
        
        <header className="flex flex-col gap-2">
            <h2 className="text-white text-3xl font-bold font-display tracking-tight">Account Settings</h2>
            <p className="text-muted text-base font-normal leading-normal">Manage your profile, password, and two-factor authentication.</p>
        </header>
        
        {statusMessage && (
            <div className={`p-4 rounded-lg border ${statusMessage.type === 'success' ? 'bg-positive/10 border-positive/20 text-positive' : 'bg-negative/10 border-negative/20 text-negative'}`}>
                {statusMessage.text}
            </div>
        )}

        <div className="rounded-xl border border-outline bg-surface p-6">
            <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] text-white">Profile Information</h3>
            <p className="text-sm text-muted mt-1 mb-6">Update your personal details here.</p>
            <div className="flex flex-wrap items-end gap-4">
                <label className="flex min-w-40 flex-1 flex-col">
                    <p className="text-sm font-medium leading-normal text-white pb-2">Full Name</p>
                    <input 
                        className="form-input h-12 w-full flex-1 resize-none overflow-hidden rounded-lg border border-outline bg-bg-dark p-[15px] text-base font-normal leading-normal text-white placeholder:text-muted focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 transition-all" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </label>
                <label className="flex min-w-40 flex-1 flex-col">
                    <p className="text-sm font-medium leading-normal text-white pb-2">Email Address</p>
                    <input 
                        className="form-input h-12 w-full flex-1 resize-none overflow-hidden rounded-lg border border-outline bg-bg-dark p-[15px] text-base font-normal leading-normal text-white placeholder:text-muted focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 transition-all" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </label>
            </div>
        </div>

        <div className="rounded-xl border border-outline bg-surface p-6">
             <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] text-white">Change Password</h3>
             <p className="text-sm text-muted mt-1 mb-6">For your security, we recommend using a strong, unique password.</p>
             <div className="flex flex-wrap items-end gap-4">
                 <label className="flex min-w-40 flex-1 flex-col">
                    <p className="text-sm font-medium leading-normal text-white pb-2">New Password</p>
                    <input 
                        type="password"
                        placeholder="Enter new password"
                        className="form-input h-12 w-full flex-1 resize-none overflow-hidden rounded-lg border border-outline bg-bg-dark p-[15px] text-base font-normal leading-normal text-white placeholder:text-muted focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 transition-all" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </label>
                 <label className="flex min-w-40 flex-1 flex-col">
                    <p className="text-sm font-medium leading-normal text-white pb-2">Confirm New Password</p>
                    <input 
                        type="password"
                        placeholder="Confirm new password"
                        className="form-input h-12 w-full flex-1 resize-none overflow-hidden rounded-lg border border-outline bg-bg-dark p-[15px] text-base font-normal leading-normal text-white placeholder:text-muted focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 transition-all" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </label>
             </div>
        </div>

        <div className="rounded-xl border border-outline bg-surface p-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] text-white">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted mt-1">Add an extra layer of security to your account.</p>
                </div>
                <button 
                    onClick={handleToggle2FA}
                    className={`flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors border ${
                        twoFactorEnabled 
                        ? 'bg-positive/20 text-positive border-positive/20 hover:bg-positive/30' 
                        : 'bg-primary/20 text-white border-primary/20 hover:bg-primary/30'
                    }`}
                >
                    {twoFactorEnabled ? 'Enabled' : 'Enable 2FA'}
                </button>
            </div>
        </div>

        <div className="flex justify-end gap-4 border-t border-outline pt-6">
             <button 
                onClick={() => {
                    // Reset to initial user state
                    setName(user.name);
                    setEmail(user.email);
                    setNewPassword('');
                    setConfirmPassword('');
                    setTwoFactorEnabled(user.twoFactorEnabled || false);
                    setStatusMessage(null);
                }}
                className="rounded-lg px-6 py-2.5 text-sm font-semibold text-muted hover:bg-white/5 transition-colors"
             >
                 Cancel
             </button>
             <button 
                onClick={handleSave}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
             >
                 Save Changes
             </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;