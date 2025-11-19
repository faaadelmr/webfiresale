// src/app/settings/SettingsClient.tsx
'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { 
  changePasswordAction, 
  deleteSelfAccountAction 
} from '@/actions/userActions';
import Toast from '@/components/Toast';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  provider: string | null;
}

const SettingsClient = ({ user }: { user: User }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Function to set password for OAuth users
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);

    if (newPassword !== confirmNewPassword) {
      setToast({
        visible: true,
        message: 'New passwords do not match',
        type: 'error'
      });
      setIsChangingPassword(false);
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 12) {
      setToast({
        visible: true,
        message: 'New password must be between 8 and 12 characters',
        type: 'error'
      });
      setIsChangingPassword(false);
      return;
    }

    try {
      const result = await changePasswordAction('', newPassword);

      if (result.success) {
        setToast({
          visible: true,
          message: result.message || 'Password set successfully! You can now login with credentials.',
          type: 'success'
        });

        // Reset form
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setToast({
          visible: true,
          message: result.message || 'Failed to set password',
          type: 'error'
        });
      }
    } catch (err) {
      setToast({
        visible: true,
        message: 'Error setting password',
        type: 'error'
      });
      console.error(err);
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'warning' | 'info' });

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);

    if (newPassword !== confirmNewPassword) {
      setToast({
        visible: true,
        message: 'New passwords do not match',
        type: 'error'
      });
      setIsChangingPassword(false);
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 12) {
      setToast({
        visible: true,
        message: 'New password must be between 8 and 12 characters',
        type: 'error'
      });
      setIsChangingPassword(false);
      return;
    }

    try {
      const result = await changePasswordAction(currentPassword, newPassword);

      if (result.success) {
        setToast({
          visible: true,
          message: result.message || 'Password changed successfully!',
          type: 'success'
        });

        // Reset form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setToast({
          visible: true,
          message: result.message || 'Failed to change password',
          type: 'error'
        });
      }
    } catch (err) {
      setToast({
        visible: true,
        message: 'Error changing password',
        type: 'error'
      });
      console.error(err);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (user.role === 'superadmin') {
      setToast({
        visible: true,
        message: 'Superadmin cannot delete their own account via settings',
        type: 'error'
      });
      setShowDeleteConfirm(false);
      return;
    }

    setIsDeletingAccount(true);

    try {
      const result = await deleteSelfAccountAction();

      if (result.success) {
        setToast({
          visible: true,
          message: result.message || 'Account deleted successfully. Logging out...',
          type: 'success'
        });

        // Wait a bit then sign out
        setTimeout(() => {
          signOut({ callbackUrl: '/' });
        }, 2000);
      } else {
        setToast({
          visible: true,
          message: result.message || 'Failed to delete account',
          type: 'error'
        });
      }
    } catch (err) {
      setToast({
        visible: true,
        message: 'Error deleting account',
        type: 'error'
      });
      console.error(err);
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="bg-base-100 shadow-xl rounded-box p-6">
      <div className="tabs tabs-boxed mb-6">
        <a className="tab tab-active">Account Settings</a>
      </div>

      <div className="space-y-8">
        {/* Conditionally show change or set password section based on user provider */}
        {user.provider && user.provider !== 'credentials' ? (
          /* Set Password Section for OAuth users */
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title text-xl">Set Account Password</h2>
              <p className="text-gray-500">Add a password to your account for credential-based login</p>

              <form onSubmit={handleSetPassword} className="space-y-4 mt-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">New Password</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input input-bordered"
                    required
                    minLength={8}
                    maxLength={12}
                  />
                  <label className="label">
                    <span className="label-text-alt">Password must be 8-12 characters</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Confirm New Password</span>
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="form-control mt-6">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Setting Password...
                      </>
                    ) : 'Set Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Change Password Section for credentials users */
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title text-xl">Change Password</h2>
              <p className="text-gray-500">Update your account password</p>

              <form onSubmit={handlePasswordChange} className="space-y-4 mt-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Current Password</span>
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">New Password</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input input-bordered"
                    required
                    minLength={8}
                    maxLength={12}
                  />
                  <label className="label">
                    <span className="label-text-alt">Password must be 8-12 characters</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Confirm New Password</span>
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="form-control mt-6">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Changing Password...
                      </>
                    ) : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Account Section */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title text-xl text-error">Delete Account</h2>
            <p className="text-gray-500">Permanently delete your account and all associated data</p>

            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-4">
                Warning: This action cannot be undone. All your data will be permanently removed.
                {user.role === 'superadmin' && ' Superadmin accounts cannot be deleted from this page.'}
              </p>

              <button
                className="btn btn-error"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={user.role === 'superadmin' || isDeletingAccount}
              >
                {isDeletingAccount ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Deleting...
                  </>
                ) : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Account Deletion</h3>
            <p className="py-4">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </p>
            <div className="modal-action">
              <button 
                className="btn btn-ghost" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeletingAccount}
              >
                Cancel
              </button>
              <button 
                className="btn btn-error" 
                onClick={handleAccountDeletion}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Deleting...
                  </>
                ) : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
      />
    </div>
  );
};

export default SettingsClient;