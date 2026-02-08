'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Plus, Trash2, Edit2, ArrowLeft, Shield, Eye,
  Settings, AlertCircle, Check, X, Loader2, Globe
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'MANAGER' | 'VIEWER';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  regionAccess: { region: { code: string; name: string } }[];
}

interface Region {
  id: string;
  code: string;
  name: string;
}

const ROLE_CONFIG = {
  ADMIN: { label: 'Admin', color: 'bg-purple-100 text-purple-700', icon: Shield },
  MANAGER: { label: 'Manager', color: 'bg-blue-100 text-blue-700', icon: Settings },
  VIEWER: { label: 'Viewer', color: 'bg-slate-100 text-slate-700', icon: Eye },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'VIEWER' as 'ADMIN' | 'MANAGER' | 'VIEWER',
    isActive: true,
    regionAccess: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch regions
  const fetchRegions = async () => {
    try {
      const response = await fetch('/api/regions');
      const data = await response.json();
      if (data.success) {
        setRegions(data.regions);
      }
    } catch (err) {
      console.error('Failed to fetch regions:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRegions();
  }, []);

  // Open modal for new user
  const openNewUserModal = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      name: '',
      password: '',
      role: 'VIEWER',
      isActive: true,
      regionAccess: [],
    });
    setShowModal(true);
  };

  // Open modal for editing user
  const openEditUserModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name || '',
      password: '',
      role: user.role,
      isActive: user.isActive,
      regionAccess: user.regionAccess.map(ra => ra.region.code),
    });
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const url = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : '/api/admin/users';

      const response = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(editingUser ? 'User updated successfully' : 'User created successfully');
        setShowModal(false);
        fetchUsers();
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (err) {
      setError('Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete user
  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('User deleted successfully');
        fetchUsers();
      } else {
        setError(data.message || 'Failed to delete user');
      }
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  // Toggle region access
  const toggleRegionAccess = (regionCode: string) => {
    setFormData(prev => ({
      ...prev,
      regionAccess: prev.regionAccess.includes(regionCode)
        ? prev.regionAccess.filter(r => r !== regionCode)
        : [...prev.regionAccess, regionCode],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">User Management</h1>
                  <p className="text-slate-300 text-sm">Manage users and permissions</p>
                </div>
              </div>
            </div>

            <button
              onClick={openNewUserModal}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Add User
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <Check className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-700 text-sm">{success}</p>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">All Users</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto" />
              <p className="text-slate-500 mt-4">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No users found</p>
              <p className="text-slate-400 text-sm mt-1">Click "Add User" to create your first user</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">User</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Region Access</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Last Login</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => {
                    const RoleIcon = ROLE_CONFIG[user.role].icon;
                    return (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{user.name || 'No name'}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${ROLE_CONFIG[user.role].color}`}>
                            <RoleIcon className="h-3.5 w-3.5" />
                            {ROLE_CONFIG[user.role].label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.role === 'ADMIN' ? (
                            <span className="text-sm text-slate-500">All Regions</span>
                          ) : user.regionAccess.length === 0 ? (
                            <span className="text-sm text-red-500">No access</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {user.regionAccess.map(ra => (
                                <span key={ra.region.code} className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded">
                                  {ra.region.code}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {user.isActive ? (
                            <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                              <Check className="h-4 w-4" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-sm text-slate-400">
                              <X className="h-4 w-4" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500">
                            {user.lastLoginAt
                              ? new Date(user.lastLoginAt).toLocaleDateString()
                              : 'Never'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditUserModal(user)}
                              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  required
                  disabled={!!editingUser}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password {editingUser && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  required={!editingUser}
                  minLength={8}
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                >
                  <option value="VIEWER">Viewer - Read only access</option>
                  <option value="MANAGER">Manager - Can manage targets</option>
                  <option value="ADMIN">Admin - Full access</option>
                </select>
              </div>

              {/* Region Access (only for non-admin) */}
              {formData.role !== 'ADMIN' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <Globe className="h-4 w-4 inline mr-1" />
                    Region Access
                  </label>
                  <div className="space-y-2 p-3 border border-slate-200 rounded-lg bg-slate-50">
                    {regions.map((region) => (
                      <label key={region.code} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.regionAccess.includes(region.code)}
                          onChange={() => toggleRegionAccess(region.code)}
                          className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                        />
                        <span className="text-sm text-slate-700">{region.name} ({region.code})</span>
                      </label>
                    ))}
                    {regions.length === 0 && (
                      <p className="text-sm text-slate-500">No regions available</p>
                    )}
                  </div>
                </div>
              )}

              {/* Active Status */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                  />
                  <span className="text-sm font-medium text-slate-700">Active</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
