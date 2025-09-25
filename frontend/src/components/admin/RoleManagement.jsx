import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import toast from 'react-hot-toast';

const RoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const { user: currentUser } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, userRolesRes, statsRes] = await Promise.all([
        api.get('/auth/admin/roles/'),
        api.get('/auth/admin/user-roles/'),
        api.get('/auth/admin/role-statistics/')
      ]);

      setRoles(rolesRes.data);
      setUserRoles(userRolesRes.data.user_roles);
      setStatistics(statsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast.error('Please select both user and role');
      return;
    }

    try {
      const response = await api.post('/auth/admin/assign-role/', {
        user_id: selectedUser,
        role_id: selectedRole
      });

      toast.success(response.data.message);
      fetchData();
      setSelectedUser('');
      setSelectedRole('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to assign role');
    }
  };

  const revokeRole = async (userId, roleId) => {
    if (!confirm('Are you sure you want to revoke this role?')) return;

    try {
      const response = await api.delete('/auth/admin/revoke-role/', {
        data: { user_id: userId, role_id: roleId }
      });

      toast.success(response.data.message);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to revoke role');
    }
  };

  const assignDefaultRoles = async () => {
    if (!confirm('Assign Member role to all users without roles?')) return;

    try {
      const response = await api.post('/auth/admin/assign-default-roles/');
      toast.success(response.data.message);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to assign default roles');
    }
  };

  const getRoleBadgeColor = (roleName) => {
    switch (roleName) {
      case 'Admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'Moderator': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Member': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Role Management</h1>
        <p className="text-gray-600">Manage user roles and permissions</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
              <p className="text-2xl font-bold text-blue-600">{statistics.summary?.total_users || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">With Roles</h3>
              <p className="text-2xl font-bold text-green-600">{statistics.summary?.users_with_roles || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Without Roles</h3>
              <p className="text-2xl font-bold text-orange-600">{statistics.summary?.users_without_roles || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Role Assignment */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Assign Role</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select User</option>
              {/* You'll need to fetch users list */}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Role</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={assignRole}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Assign Role
          </button>
        </div>
        
        <div className="mt-4">
          <button
            onClick={assignDefaultRoles}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Assign Member Role to All Users Without Roles
          </button>
        </div>
      </div>

      {/* Current Role Assignments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Role Assignments</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userRoles.map((userRole) => (
                <tr key={`${userRole.user.id}-${userRole.role.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{userRole.user.username}</div>
                      <div className="text-sm text-gray-500">{userRole.user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(userRole.role.name)}`}>
                      {userRole.role.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(userRole.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {userRole.user.id !== currentUser?.id && (
                      <button
                        onClick={() => revokeRole(userRole.user.id, userRole.role.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Revoke
                      </button>
                    )}
                    {userRole.user.id === currentUser?.id && (
                      <span className="text-gray-400">Current User</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {userRoles.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No role assignments found</p>
          </div>
        )}
      </div>

      {/* Role Statistics */}
      {statistics.role_statistics && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Role Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statistics.role_statistics.map((stat) => (
              <div key={stat.name} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(stat.name)}`}>
                    {stat.name}
                  </span>
                  <span className="text-2xl font-bold text-gray-900">{stat.user_count}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {stat.user_count === 1 ? 'user' : 'users'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;