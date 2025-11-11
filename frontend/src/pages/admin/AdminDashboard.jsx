import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, MessageSquare, FolderOpen, TrendingUp, 
  AlertCircle, CheckCircle, XCircle, Activity 
} from 'lucide-react';
import useAuthStore from 'src/stores/authStore';
import api from 'src/config/api';
import toast from 'react-hot-toast';
// ✅ 1. IMPORT KOMPONEN BARU
import { ProfileImage } from 'src/components/ImageDisplay';

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalCategories: 0,
    recentUsers: [],
    recentPosts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setError(null);
      
      const [usersRes, postsRes, categoriesRes] = await Promise.all([
        api.get('/users/').catch(() => ({ data: [] })),
        api.get('/posts/').catch(() => ({ data: [] })),
        api.get('/categories/').catch(() => ({ data: [] })),
      ]);

      const usersData = Array.isArray(usersRes.data) 
        ? usersRes.data 
        : usersRes.data.results || [];
      
      const postsData = Array.isArray(postsRes.data) 
        ? postsRes.data 
        : postsRes.data.results || [];
      
      const categoriesData = Array.isArray(categoriesRes.data) 
        ? categoriesRes.data 
        : categoriesRes.data.results || [];

      setStats({
        totalUsers: usersData.length,
        totalPosts: postsData.length,
        totalComments: postsData.reduce((acc, post) => acc + (post.comments_count || 0), 0),
        totalCategories: categoriesData.length,
        recentUsers: usersData.slice(0, 5),
        recentPosts: postsData.slice(0, 5),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">{error}</p>
          <button 
            onClick={fetchStats}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img 
                src="/polibatam-logo.png" 
                alt="Polibatam" 
                className="h-10"
                onError={(e) => e.target.style.display = 'none'}
              />
              <h1 className="text-2xl font-bold text-gray-800">ForKa Admin</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Welcome, {user?.username}</span>
              <Link 
                to="/home"
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
              >
                Back to Forum
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<Users className="w-8 h-8" />}
            color="blue"
            link="/admin/users"
          />
          <StatCard
            title="Total Posts"
            value={stats.totalPosts}
            icon={<MessageSquare className="w-8 h-8" />}
            color="green"
            link="/admin/posts"
          />
          <StatCard
            title="Total Comments"
            value={stats.totalComments}
            icon={<TrendingUp className="w-8 h-8" />}
            color="purple"
          />
          <StatCard
            title="Categories"
            value={stats.totalCategories}
            icon={<FolderOpen className="w-8 h-8" />}
            color="orange"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
              <Link 
                to="/admin/users"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            {stats.recentUsers.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No users yet</p>
            ) : (
              <div className="space-y-3">
                {stats.recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                    <div className="flex items-center gap-3">
                      
                      {/* ✅ 2. GANTI AVATAR USER */}
                      <ProfileImage
                        src={user.profile_picture}
                        username={user.username}
                        size="sm"
                      />
                      
                      <div>
                        <p className="font-medium text-gray-900">{user.username}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {user.role || 'user'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Posts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
              <Link 
                to="/admin/posts"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            {stats.recentPosts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No posts yet</p>
            ) : (
              <div className="space-y-3">
                {stats.recentPosts.map((post) => (
                  <div key={post.id} className="p-3 hover:bg-gray-50 rounded-lg transition">
                    <Link 
                      to={`/posts/${post.id}`}
                      className="font-medium text-gray-900 hover:text-primary-600 line-clamp-1"
                    >
                      {post.title}
                    </Link>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>by @{post.author?.username}</span>
                      <span>•</span>
                      <span>{post.views_count || 0} views</span>
                      <span>•</span>
                      <span>{post.comments_count || 0} comments</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/admin/users"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
            >
              <Users className="w-6 h-6 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">Manage Users</p>
                <p className="text-sm text-gray-500">Add, edit, or remove users</p>
              </div>
            </Link>

            <Link
              to="/admin/posts"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
            >
              <MessageSquare className="w-6 h-6 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">Manage Posts</p>
                <p className="text-sm text-gray-500">Pin, close, or delete posts</p>
              </div>
            </Link>

            <button
              onClick={fetchStats}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-left"
            >
              <Activity className="w-6 h-6 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">Refresh Data</p>
                <p className="text-sm text-gray-500">Update dashboard statistics</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color, link }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  const Card = (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${colorClasses[color]} text-white p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return link ? <Link to={link}>{Card}</Link> : Card;
};

export default AdminDashboard;