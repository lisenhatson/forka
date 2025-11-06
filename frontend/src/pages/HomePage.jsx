import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Plus, Eye, MessageSquare, TrendingUp, ChevronDown, Menu } from 'lucide-react';
import useAuthStore from 'src/stores/authStore';
import api from 'src/config/api';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // ✨ NEW

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/posts/', {
        params: {
          ordering: filter === 'new' ? '-created_at' : filter === 'top' ? '-views_count' : '-created_at'
        }
      });
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchPosts();
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.get('/posts/', {
        params: { search: searchQuery }
      });
      setPosts(response.data);
    } catch (error) {
      console.error('Error searching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✨ NEW: Show logout confirmation modal
  const handleLogout = () => {
    setShowLogoutModal(true);
    setShowUserMenu(false);
  };

  // ✨ NEW: Confirm logout
  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate('/login');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src="/polibatam-logo.png" 
                alt="Polibatam" 
                className="h-10"
                onError={(e) => e.target.style.display = 'none'}
              />
              <Link to="/home" className="text-2xl font-bold text-gray-800">
                ForKa
              </Link>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/ask')}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-medium"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Ask a question</span>
              </button>

              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition"
                >
                  <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <Link 
                      to={`/profile/${user?.username}`}
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      My Profile
                    </Link>

                   {(user?.role === 'admin' || user?.role === 'moderator') && (
                    <Link 
                      to="/admin"
                      className="block px-4 py-2 text-primary-700 hover:bg-primary-50 font-medium"
                      onClick={() => setShowUserMenu(false)}
                    >
                      🛡️ Admin Panel
                    </Link>
                  )}
                    <Link 
                      to="/settings"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Settings
                    </Link>
                    <hr className="my-2" />
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800 mb-4">MENU</h3>
                <nav className="space-y-1">
                  <Link 
                    to="/home" 
                    className="flex items-center gap-3 px-3 py-2 bg-gray-100 text-primary-600 rounded-lg font-medium"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Solved
                  </Link>
                  <Link 
                    to="/unsolved" 
                    className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Unsolved
                  </Link>
                  <Link 
                    to="/tags" 
                    className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <Menu className="w-5 h-5" />
                    Tags
                  </Link>
                </nav>

                <h3 className="font-semibold text-gray-800 mt-6 mb-4">PERSONAL NAVIGATOR</h3>
                <nav className="space-y-1">
                  <Link 
                    to="/my-questions" 
                    className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    Your questions
                  </Link>
                  <Link 
                    to="/my-answers" 
                    className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    Your answers
                  </Link>
                  <Link 
                    to="/my-likes" 
                    className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    Your likes & votes
                  </Link>
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Feed */}
          <main className="flex-1">
            {/* Filter Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="flex border-b border-gray-200">
                <button 
                  onClick={() => setFilter('new')}
                  className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition ${
                    filter === 'new' 
                      ? 'border-primary-500 text-primary-600' 
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <TrendingUp className="w-5 h-5" />
                  New
                </button>
                <button 
                  onClick={() => setFilter('top')}
                  className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition ${
                    filter === 'top' 
                      ? 'border-primary-500 text-primary-600' 
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <TrendingUp className="w-5 h-5" />
                  Top
                </button>
                <button 
                  onClick={() => setFilter('hot')}
                  className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition ${
                    filter === 'hot' 
                      ? 'border-primary-500 text-primary-600' 
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <TrendingUp className="w-5 h-5" />
                  Hot
                </button>
              </div>
            </div>

            {/* Posts List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-600">No posts found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Link 
                    key={post.id}
                    to={`/posts/${post.id}`}
                    className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-start gap-4">
                      {/* Author Avatar */}
                      <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {post.author?.username?.charAt(0).toUpperCase()}
                      </div>

                      {/* Post Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <span className="font-medium text-gray-900">{post.author?.username}</span>
                          <span>•</span>
                          <span>{formatDate(post.created_at)}</span>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary-600">
                          {post.title}
                        </h3>

                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {post.content}
                        </p>

                        {/* Tags */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {post.category_name || 'General'}
                          </span>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{post.views_count}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            <span>{post.comments_count}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>{post.likes_count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Must-read posts */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary-600" />
                  Must-read posts
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link to="#" className="text-sm text-primary-600 hover:underline">
                      Please read rules before you start working on a platform
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="text-sm text-primary-600 hover:underline">
                      Vision & Strategy of Alemhelp
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Featured links */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800 mb-4">Featured links</h3>
                <ul className="space-y-3">
                  <li>
                    <Link to="#" className="text-sm text-primary-600 hover:underline">
                      Alemhelp source-code on GitHub
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="text-sm text-primary-600 hover:underline">
                      Golang best-practices
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="text-sm text-primary-600 hover:underline">
                      Alem.School dashboard
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ✨ NEW: Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to logout from ForKa?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;