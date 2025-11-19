// src/app/dashboard/users/UserListClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { Session } from 'next-auth';
import Link from 'next/link';
import { Role } from '@/lib/rbac';
import Toast from '@/components/Toast';
import {
  getAllUsersAction,
  createUserAction,
  changeUserRoleAction,
  softDeleteUserAction,
  restoreUserAction,
  resetPasswordAction
} from '@/actions/userActions';

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  deletedAt: string | null;
  tempPassword: string | null; // New field for temporary password
  createdAt: string;
  updatedAt: string;
  avatar?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
};

const UserListClient = ({ session }: { session: Session }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10); // For pagination
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'warning' | 'info' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer' as Role,
    phone: '',
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
  });

  // Fetch users using server action
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await getAllUsersAction();
        if (result.success) {
          setUsers(result.users);
        } else {
          setError(result.message || 'Failed to load users');
        }
      } catch (err) {
        setError('Error loading users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search term, role, and status
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

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const openCreateModal = () => {
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'customer',
      phone: '',
      firstName: '',
      lastName: '',
      gender: '',
      dateOfBirth: '',
    });
    setIsModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsModalOpen(false);
  };

  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser({
      ...newUser,
      [name]: value
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const userData = {
        ...newUser,
        dateOfBirth: newUser.dateOfBirth ? newUser.dateOfBirth : undefined,
      };

      const result = await createUserAction(userData);

      if (result.success) {
        setToast({
          visible: true,
          message: result.message || 'User created successfully!',
          type: 'success'
        });

        // Refresh the user list
        const refreshResult = await getAllUsersAction();
        if (refreshResult.success) {
          setUsers(refreshResult.users);
        }
        closeCreateModal();
      } else {
        setToast({
          visible: true,
          message: result.message || 'Failed to create user',
          type: 'error'
        });
      }
    } catch (err) {
      setToast({
        visible: true,
        message: 'Error creating user',
        type: 'error'
      });
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-base-100 shadow-xl rounded-box p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="form-control flex-1">
            <input
              type="text"
              placeholder="Search users..."
              className="input input-bordered"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
            />
          </div>

          <div className="form-control w-full md:w-auto">
            <select
              className="select select-bordered w-full md:w-auto"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1); // Reset to first page when filtering
              }}
            >
              <option value="all">All Roles</option>
              <option value="superadmin">Superadmin</option>
              <option value="admin">Admin</option>
              <option value="customer">Customer</option>
            </select>
          </div>

          <div className="form-control w-full md:w-auto">
            <select
              className="select select-bordered w-full md:w-auto"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1); // Reset to first page when filtering
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/dashboard" className="btn btn-outline">
            Back to Dashboard
          </Link>
          <button
            className="btn btn-primary"
            onClick={openCreateModal}
          >
            Add User
          </button>
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
              <th>Temp Password</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  No users found
                </td>
              </tr>
            ) : (
              currentUsers.map(user => (
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
                        onChange={(e) => changeUserRole(user.id, e.target.value as Role)}
                        className="select select-sm select-bordered"
                        disabled={isCreating}
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                    )}
                  </td>
                  <td>
                    {user.tempPassword ? (
                      <span className="font-mono bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                        {user.tempPassword}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">None</span>
                    )}
                  </td>
                  <td>
                    {user.isActive && !user.deletedAt ? (
                      <span className="badge badge-success">Active</span>
                    ) : user.deletedAt ? (
                      <div className="flex flex-col">
                        <span className="badge badge-error">Soft Deleted</span>
                        {(() => {
                          const deletedDate = new Date(user.deletedAt);
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

                      {user.isActive && !user.deletedAt ? (
                        <>
                          <button
                            className="btn btn-xs btn-outline btn-warning"
                            onClick={() => resetUserPassword(user.id)}
                            disabled={user.id === session.user.id || isCreating}
                            title={user.id === session.user.id ? 'Cannot reset your own password' : 'Reset Password'}
                          >
                            Reset Pass
                          </button>
                          <button
                            className="btn btn-xs btn-outline btn-error"
                            onClick={() => softDeleteUser(user.id)}
                            disabled={user.id === session.user.id || isCreating}
                            title={user.id === session.user.id ? 'Cannot delete yourself' : 'Soft Delete'}
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-xs btn-outline btn-success"
                          onClick={() => restoreUser(user.id)}
                          disabled={isCreating}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="join">
            <button
              className={`join-item btn ${currentPage === 1 ? 'btn-disabled' : ''}`}
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1 || isCreating}
            >
              «
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`join-item btn ${currentPage === page ? 'btn-active' : ''}`}
                onClick={() => paginate(page)}
                disabled={isCreating}
              >
                {page}
              </button>
            ))}

            <button
              className={`join-item btn ${currentPage === totalPages ? 'btn-disabled' : ''}`}
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages || isCreating}
            >
              »
            </button>
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

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Create New User</h3>

            <form onSubmit={handleCreateUser} className="py-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Name *</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={newUser.name}
                  onChange={handleNewUserChange}
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email *</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleNewUserChange}
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Password *</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleNewUserChange}
                  className="input input-bordered"
                  required
                  minLength={8}
                />
                <label className="label">
                  <span className="label-text-alt">Password must be at least 8 characters</span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Role</span>
                </label>
                <select
                  name="role"
                  value={newUser.role}
                  onChange={handleNewUserChange}
                  className="select select-bordered"
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">First Name</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={newUser.firstName}
                    onChange={handleNewUserChange}
                    className="input input-bordered"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Last Name</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={newUser.lastName}
                    onChange={handleNewUserChange}
                    className="input input-bordered"
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Phone</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={newUser.phone}
                  onChange={handleNewUserChange}
                  className="input input-bordered"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Gender</span>
                  </label>
                  <select
                    name="gender"
                    value={newUser.gender}
                    onChange={handleNewUserChange}
                    className="select select-bordered"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Date of Birth</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={newUser.dateOfBirth}
                    onChange={handleNewUserChange}
                    className="input input-bordered"
                  />
                </div>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={closeCreateModal}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Creating...
                    </>
                  ) : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Functions for actions using server actions
  async function changeUserRole(userId: string, newRole: Role) {
    if (!session?.user?.id) return;

    // Prevent self-role change to non-superadmin
    if (userId === session.user.id && newRole !== 'superadmin') {
      setToast({
        visible: true,
        message: 'You cannot change your own role to a non-superadmin role',
        type: 'error'
      });
      return;
    }

    setIsCreating(true);
    try {
      const result = await changeUserRoleAction(userId, newRole);

      if (result.success) {
        // Refresh the user list
        const refreshResult = await getAllUsersAction();
        if (refreshResult.success) {
          setUsers(refreshResult.users);
          setToast({
            visible: true,
            message: result.message || 'User role updated successfully',
            type: 'success'
          });
        }
      } else {
        setToast({
          visible: true,
          message: result.message || 'Failed to update user role',
          type: 'error'
        });
      }
    } catch (err) {
      setToast({
        visible: true,
        message: 'Error updating user role',
        type: 'error'
      });
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  }

  async function softDeleteUser(userId: string) {
    if (!session?.user?.id) return;

    if (userId === session.user.id) {
      setToast({
        visible: true,
        message: 'You cannot delete your own account',
        type: 'error'
      });
      return;
    }

    if (!confirm('Are you sure you want to soft delete this user?')) {
      return;
    }

    setIsCreating(true);
    try {
      const result = await softDeleteUserAction(userId);

      if (result.success) {
        // Refresh the user list
        const refreshResult = await getAllUsersAction();
        if (refreshResult.success) {
          setUsers(refreshResult.users);
          setToast({
            visible: true,
            message: result.message || 'User soft deleted successfully',
            type: 'success'
          });
        }
      } else {
        setToast({
          visible: true,
          message: result.message || 'Failed to soft delete user',
          type: 'error'
        });
      }
    } catch (err) {
      setToast({
        visible: true,
        message: 'Error soft deleting user',
        type: 'error'
      });
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  }

  async function restoreUser(userId: string) {
    setIsCreating(true);
    try {
      const result = await restoreUserAction(userId);

      if (result.success) {
        // Refresh the user list
        const refreshResult = await getAllUsersAction();
        if (refreshResult.success) {
          setUsers(refreshResult.users);
          setToast({
            visible: true,
            message: result.message || 'User restored successfully',
            type: 'success'
          });
        }
      } else {
        setToast({
          visible: true,
          message: result.message || 'Failed to restore user',
          type: 'error'
        });
      }
    } catch (err) {
      setToast({
        visible: true,
        message: 'Error restoring user',
        type: 'error'
      });
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  }

  async function resetUserPassword(userId: string) {
    if (!session?.user?.id) return;

    if (userId === session.user.id) {
      setToast({
        visible: true,
        message: 'You cannot reset your own password from here',
        type: 'error'
      });
      return;
    }

    if (!confirm('Are you sure you want to reset this user\'s password? A new password will be generated.')) {
      return;
    }

    setIsCreating(true);
    try {
      const result = await resetPasswordAction(userId);

      if (result.success) {
        // Update the user list to show the new temporary password
        const refreshResult = await getAllUsersAction();
        if (refreshResult.success) {
          setUsers(refreshResult.users);
          setToast({
            visible: true,
            message: result.message || 'Password reset successfully! Temporary password has been generated.',
            type: 'success'
          });
        }
      } else {
        setToast({
          visible: true,
          message: result.message || 'Failed to reset password',
          type: 'error'
        });
      }
    } catch (err) {
      setToast({
        visible: true,
        message: 'Error resetting password',
        type: 'error'
      });
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  }
};

export default UserListClient;