import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, FolderOpen, TrendingUp, 
  AlertCircle, CheckCircle, Shield 
} from 'lucide-react';
import useAuthStore from 'src/stores/authStore';
import api from 'src/config/api';

const ModeratorDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalComments: 0,
    totalCategories: 0,
    pinnedPosts: 0,
    closedPosts: 0,
    recentPosts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [postsRes, categoriesRes] = await Promise.all([
        api.get('/posts/'),
        api.get('/categories/'),
      ]);

      const postsData = Array.isArray(postsRes.data) 
        ? postsRes.data 
        : postsRes.data.results || [];

      setStats({
        totalPosts: postsData.length,
        totalComments: postsData.reduce((acc, post) => acc + (post.comments_count || 0), 0),
        totalCategories: categoriesRes.data.length,
        pinnedPosts: postsData.filter(p => p.is_pinned).length,
        closedPosts: postsData.filter(p => p.is_closed).length,
        recentPosts: postsData.slice(0, 5),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Moderator Panel</h1>
                <p className="text-xs text-gray-500">Content Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">
                  {user?.username}
                </span>
              </div>
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
        {/* Info Banner */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-purple-900 mb-1">Moderator Access</h3>
              <p className="text-sm text-purple-700">
                As a moderator, you can manage posts and comments, but cannot manage users or system settings.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            title="Pinned Posts"
            value={stats.pinnedPosts}
            icon={<CheckCircle className="w-8 h-8" />}
            color="blue"
          />
          <StatCard
            title="Closed Posts"
            value={stats.closedPosts}
            icon={<AlertCircle className="w-8 h-8" />}
            color="orange"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Posts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
              <Link 
                to="/admin/posts"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Manage All
              </Link>
            </div>
            <div className="space-y-3">
              {stats.recentPosts.map((post) => (
                <div key={post.id} className="p-3 hover:bg-gray-50 rounded-lg transition">
                  <div className="flex items-start justify-between mb-2">
                    <Link 
                      to={`/posts/${post.id}`}
                      className="font-medium text-gray-900 hover:text-primary-600 line-clamp-1 flex-1"
                    >
                      {post.title}
                    </Link>
                    <div className="flex items-center gap-2 ml-2">
                      {post.is_pinned && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          Pinned
                        </span>
                      )}
                      {post.is_closed && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                          Closed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>by @{post.author?.username}</span>
                    <span>•</span>
                    <span>{post.views_count} views</span>
                    <span>•</span>
                    <span>{post.comments_count} comments</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Moderation Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
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

              <Link
                to="/admin/categories"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
              >
                <FolderOpen className="w-6 h-6 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">View Categories</p>
                  <p className="text-sm text-gray-500">Browse forum categories</p>
                </div>
              </Link>

              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-60">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-600">Manage Users</p>
                    <p className="text-sm text-gray-500">Admin access required</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Guidelines */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Moderation Guidelines</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">✓ Do</h3>
              <ul className="space-y-1 text-sm text-green-800">
                <li>• Pin important announcements</li>
                <li>• Close resolved discussions</li>
                <li>• Remove spam or inappropriate content</li>
                <li>• Be fair and consistent</li>
              </ul>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-2">✗ Don't</h3>
              <ul className="space-y-1 text-sm text-red-800">
                <li>• Delete posts without valid reason</li>
                <li>• Abuse moderation powers</li>
                <li>• Ignore community reports</li>
                <li>• Make unilateral decisions on major issues</li>
              </ul>
            </div>
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

export default ModeratorDashboard;