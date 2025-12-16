'use client';

import { useState } from 'react';
import { User } from '@/types/user';
import { Session } from 'next-auth';
import { Role } from '@/lib/rbac';
import {
  changeUserRoleAction,
  softDeleteUserAction,
  restoreUserAction,
  resetPasswordAction
} from '@/actions/userActions';

interface UsersTableProps {
  users: User[];
  session: Session;
  onRefresh: () => void;
}

export default function UsersTable({ users, session, onRefresh }: UsersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive && !user.deletedAt) ||
      (statusFilter === 'inactive' && (!user.isActive || user.deletedAt));

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRoleChange = async (userId: string, newRole: Role) => {
    if (!session?.user?.id) return;

    // Prevent self-role change to non-superadmin
    if (userId === session.user.id && newRole !== 'superadmin') {
      alert('You cannot change your own role to a non-superadmin role');
      return;
    }

    setIsUpdating(true);
    try {
      const result = await changeUserRoleAction(userId, newRole);
      if (result.success) {
        onRefresh();
      } else {
        alert(result.message || 'Failed to update user role');
      }
    } catch (err) {
      console.error('Error updating user role:', err);
      alert('Error updating user role');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSoftDelete = async (userId: string) => {
    if (!session?.user?.id) return;

    if (userId === session.user.id) {
      alert('You cannot delete your own account');
      return;
    }

    if (!confirm('Are you sure you want to soft delete this user?')) {
      return;
    }

    setIsUpdating(true);
    try {
      const result = await softDeleteUserAction(userId);
      if (result.success) {
        onRefresh();
      } else {
        alert(result.message || 'Failed to soft delete user');
      }
    } catch (err) {
      console.error('Error soft deleting user:', err);
      alert('Error soft deleting user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRestore = async (userId: string) => {
    setIsUpdating(true);
    try {
      const result = await restoreUserAction(userId);
      if (result.success) {
        onRefresh();
      } else {
        alert(result.message || 'Failed to restore user');
      }
    } catch (err) {
      console.error('Error restoring user:', err);
      alert('Error restoring user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!session?.user?.id) return;

    if (userId === session.user.id) {
      alert('You cannot reset your own password from here');
      return;
    }

    if (!confirm('Are you sure you want to reset this user\'s password? A new password will be generated.')) {
      return;
    }

    setIsUpdating(true);
    try {
      const result = await resetPasswordAction(userId);
      if (result.success && result.newPassword) {
        alert(`Password reset successfully! New password: ${result.newPassword}`);
      } else {
        alert(result.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      alert('Error resetting password');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-base-100 rounded-box p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
          <div className="form-control">
            <input
              type="text"
              placeholder="Search users..."
              className="input input-bordered w-full md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="select select-bordered w-full md:w-[180px]"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="superadmin">Superadmin</option>
            <option value="admin">Admin</option>
            <option value="customer">Customer</option>
          </select>

          <select
            className="select select-bordered w-full md:w-[180px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className={user.id === session.user.id ? 'bg-base-300' : ''}>
                  <td>
                    {user.avatar ? (
                      <div className="avatar">
                        <div className="w-10 rounded-full">
                          <img src={user.avatar} alt={user.name || user.email} />
                        </div>
                      </div>
                    ) : (
                      <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-10">
                          <span className="text-xs">
                            {user.name ? user.name.charAt(0) : user.email.charAt(0)}
                          </span>
                        </div>
                      </div>
                    )}
                  </td>
                  <td>{user.name || user.email.split('@')[0]}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.id === session.user.id ? (
                      <span className="badge badge-primary">{user.role}</span>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                        className="select select-sm select-bordered"
                        disabled={isUpdating}
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                    )}
                  </td>
                  <td>
                    {user.isActive && !user.deletedAt ? (
                      <span className="badge badge-success">Active</span>
                    ) : user.deletedAt ? (
                      <div className="flex flex-col">
                        <span className="badge badge-error">Soft Deleted</span>
                        {(() => {
                          const deletedDate = new Date(user.deletedAt!);
                          const timeDiff = Math.abs(new Date().getTime() - deletedDate.getTime());
                          const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                          const daysLeft = 30 - diffDays;

                          if (daysLeft > 0) {
                            return <span className="text-xs mt-1 text-gray-500">Will be deleted in {daysLeft} days</span>;
                          } else {
                            return <span className="text-xs mt-1 text-red-500">Will be permanently deleted soon</span>;
                          }
                        })()}
                      </div>
                    ) : (
                      <span className="badge badge-warning">Inactive</span>
                    )}
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`/admin/users/${user.id}/edit`}
                        className={`btn btn-xs ${user.id === session.user.id ? 'btn-disabled' : 'btn-outline'}`}
                        title={user.id === session.user.id ? 'Cannot edit yourself' : 'Edit User'}
                      >
                        Edit
                      </a>

                      {user.isActive && !user.deletedAt ? (
                        <>
                          <button
                            className="btn btn-xs btn-outline btn-warning"
                            onClick={() => handleResetPassword(user.id)}
                            disabled={user.id === session.user.id || isUpdating}
                            title={user.id === session.user.id ? 'Cannot reset your own password' : 'Reset Password'}
                          >
                            Reset Pass
                          </button>
                          <button
                            className="btn btn-xs btn-outline btn-error"
                            onClick={() => handleSoftDelete(user.id)}
                            disabled={user.id === session.user.id || isUpdating}
                            title={user.id === session.user.id ? 'Cannot delete yourself' : 'Soft Delete'}
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-xs btn-outline btn-success"
                          onClick={() => handleRestore(user.id)}
                          disabled={isUpdating}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}