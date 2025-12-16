import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Square, SquareCheckBig, Clock, TrendingUp, Flame, Search, Bell, Plus, Eye, MessageSquare, ChevronDown, Bookmark, ThumbsUp, Tag, List } from 'lucide-react';
import useAuthStore from 'src/stores/authStore';
import api from 'src/config/api';
import { ProfileImage } from 'src/components/ImageDisplay';

const HomePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userStats, setUserStats] = useState({
    myPosts: 0,
    myComments: 0,
    myLikes: 0,
    drafts: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('new');
  const [solvedFilter, setSolvedFilter] = useState(searchParams.get('solved') || 'all'); // all, solved, unsolved
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const solved = searchParams.get('solved');
    if (solved) setSolvedFilter(solved);
  }, [searchParams]);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
    fetchUserStats();
  }, [filter, solvedFilter, selectedCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = {
        ordering: filter === 'new' ? '-created_at' : 
                  filter === 'top' ? '-views_count' : 
                  filter === 'hot' ? '-created_at' : '-created_at'
      };
      
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      
      const response = await api.get('/posts/', { params });
      
      let postsData = Array.isArray(response.data) 
        ? response.data 
        : response.data.results || [];
      
      // Filter by solved status
      if (solvedFilter === 'solved') {
        postsData = postsData.filter(post => post.is_solved === true);
      } else if (solvedFilter === 'unsolved') {
        postsData = postsData.filter(post => post.is_solved === false || post.is_solved === null);
      }
      // 'all' = no filter
      
      // For "hot" filter: posts from last 7 days with high views
      if (filter === 'hot') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        postsData = postsData
          .filter(post => new Date(post.created_at) >= sevenDaysAgo)
          .sort((a, b) => b.views_count - a.views_count);
      }
      
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories/');
      const categoriesData = Array.isArray(response.data) 
        ? response.data 
        : response.data.results || [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchUserStats = async () => {
    try {
      const postsResponse = await api.get('/posts/', {
        params: { author: user?.id }
      });
      const userPosts = Array.isArray(postsResponse.data) 
        ? postsResponse.data 
        : postsResponse.data.results || [];

      const commentsResponse = await api.get('/comments/');
      const allComments = Array.isArray(commentsResponse.data) 
        ? commentsResponse.data 
        : commentsResponse.data.results || [];
      const userComments = allComments.filter(c => c.author?.id === user?.id);

      const drafts = JSON.parse(localStorage.getItem('post_draft') || 'null');
      
      setUserStats({
        myPosts: userPosts.length,
        myComments: userComments.length,
        myLikes: 0,
        drafts: drafts ? 1 : 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
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

  const handleLogout = () => {
    setShowLogoutModal(true);
    setShowUserMenu(false);
  };

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

  const handleContinueDraft = () => {
    const draft = localStorage.getItem('post_draft');
    if (draft) {
      navigate('/ask');
    }
  };

  const handleClearDraft = () => {
    if (window.confirm('Are you sure you want to delete your draft?')) {
      localStorage.removeItem('post_draft');
      fetchUserStats();
    }
  };

  const handleSolvedFilterChange = (newFilter) => {
    setSolvedFilter(newFilter);
    setSearchParams({ solved: newFilter });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
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

              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition"
                >
                  <ProfileImage
                    src={user?.profile_picture}
                    username={user?.username}
                    size="sm"
                  />
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

                    {user?.role === 'admin' && (
                      <Link 
                        to="/admin"
                        className="block px-4 py-2 text-primary-700 hover:bg-primary-50 font-medium"
                        onClick={() => setShowUserMenu(false)}
                      >
                        🛡️ Admin Panel
                      </Link>
                    )}
                    
                    {user?.role === 'moderator' && (
                      <Link 
                        to="/moderator"
                        className="block px-4 py-2 text-purple-700 hover:bg-purple-50 font-medium"
                        onClick={() => setShowUserMenu(false)}
                      >
                        🛡️ Moderator Panel
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Main Menu */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800 mb-4">MENU</h3>
                <nav className="space-y-1">
                  <button
                    onClick={() => handleSolvedFilterChange('all')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                      solvedFilter === 'all'
                        ? 'bg-primary-100 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <List className="w-5 h-5" />
                    All
                  </button>
                  <button
                    onClick={() => handleSolvedFilterChange('solved')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                      solvedFilter === 'solved'
                        ? 'bg-green-100 text-green-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <SquareCheckBig className="w-5 h-5" />
                    Solved
                  </button>
                  <button
                    onClick={() => handleSolvedFilterChange('unsolved')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                      solvedFilter === 'unsolved'
                        ? 'bg-orange-100 text-orange-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Square className="w-5 h-5" />
                    Unsolved
                  </button>
                </nav>

                {/* Personal Navigator */}
                <h3 className="font-semibold text-gray-800 mt-6 mb-4">PERSONAL NAVIGATOR</h3>
                <nav className="space-y-1">
                  <Link 
                    to={`/profile/${user?.username}?tab=posts`}
                    className="flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg group"
                  >
                    <span className="text-sm">Your questions</span>
                    <span className="text-xs bg-gray-200 group-hover:bg-primary-100 group-hover:text-primary-700 px-2 py-0.5 rounded-full">
                      {userStats.myPosts}
                    </span>
                  </Link>
                  <Link 
                    to={`/profile/${user?.username}?tab=comments`}
                    className="flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg group"
                  >
                    <span className="text-sm">Your answers</span>
                    <span className="text-xs bg-gray-200 group-hover:bg-primary-100 group-hover:text-primary-700 px-2 py-0.5 rounded-full">
                      {userStats.myComments}
                    </span>
                  </Link>
                  <Link 
                    to={`/profile/${user?.username}?tab=likes`}
                    className="flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg group"
                  >
                    <span className="text-sm">Your likes & votes</span>
                    <span className="text-xs bg-gray-200 group-hover:bg-primary-100 group-hover:text-primary-700 px-2 py-0.5 rounded-full">
                      {userStats.myLikes}
                    </span>
                  </Link>
                  
                  {/* Draft Section */}
                  {userStats.drafts > 0 && (
                    <>
                      <hr className="my-2" />
                      <div className="px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-orange-900">
                            Draft saved
                          </span>
                          <Bookmark className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleContinueDraft}
                            className="flex-1 text-xs px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
                          >
                            Continue
                          </button>
                          <button
                            onClick={handleClearDraft}
                            className="flex-1 text-xs px-2 py-1 bg-white text-orange-700 border border-orange-200 rounded hover:bg-orange-50 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Feed */}
          <main className="flex-1">
            {/* Active Filters Banner */}
            {(selectedCategory || solvedFilter !== 'all') && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-wrap">
                    {solvedFilter !== 'all' && (
                      <span className="flex items-center gap-2 px-3 py-1 bg-white border border-primary-200 rounded-full text-sm text-primary-900 font-medium">
                        {solvedFilter === 'solved' ? (
                          <>
                            <SquareCheckBig className="w-4 h-4" />
                            Solved Only
                          </>
                        ) : (
                          <>
                            <Square className="w-4 h-4" />
                            Unsolved Only
                          </>
                        )}
                      </span>
                    )}
                    {selectedCategory && (
                      <span className="flex items-center gap-2 px-3 py-1 bg-white border border-primary-200 rounded-full text-sm text-primary-900 font-medium">
                        <Tag className="w-4 h-4" />
                        {categories.find(c => c.id === selectedCategory)?.name}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSolvedFilter('all');
                      setSelectedCategory(null);
                      setSearchParams({});
                    }}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}

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
                  <Clock className="w-5 h-5" />
                  New
                </button>
                <button 
                  onClick={() => setFilter('top')}
                  className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition ${
                    filter === 'top' 
                      ? 'border-primary-500 text-primary-600' 
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                  title="Most viewed of all time"
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
                  title="Trending in the last 7 days"
                >
                  <Flame className="w-5 h-5" />
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
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-2">No posts found</p>
                <p className="text-gray-500 text-sm">
                  {solvedFilter === 'solved' && 'No solved posts yet.'}
                  {solvedFilter === 'unsolved' && 'No unsolved posts yet.'}
                  {selectedCategory && 'Try selecting a different category.'}
                </p>
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
                      <ProfileImage
                        src={post.author?.profile_picture}
                        username={post.author?.username}
                        size="md"
                        className="flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <span className="font-medium text-gray-900">{post.author?.username}</span>
                          <span>•</span>
                          <span>{formatDate(post.created_at)}</span>
                          {post.is_solved && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-green-600 font-medium">
                                <SquareCheckBig className="w-4 h-4" />
                                Solved
                              </span>
                            </>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary-600">
                          {post.title}
                        </h3>

                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {post.content}
                        </p>

                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {post.category_name || 'General'}
                          </span>
                        </div>

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
                            <ThumbsUp className="w-4 h-4" />
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary-600" />
                    Categories
                  </h3>
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No categories yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-3 py-1 rounded-full text-sm transition ${
                          selectedCategory === category.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 hover:bg-primary-50 text-gray-700 hover:text-primary-700'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-primary-50 rounded-lg border border-primary-200 p-4">
                <h3 className="font-semibold text-primary-900 mb-4">Must Read</h3>
                <ul className="space-y-3">
                  <li>
                    <Link to="#" className="text-sm text-primary-700 hover:text-primary-900 hover:underline">
                      📌 Forum Guidelines & Rules
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="text-sm text-primary-700 hover:text-primary-900 hover:underline">
                      💡 How to Ask Good Questions
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="text-sm text-primary-700 hover:text-primary-900 hover:underline">
                      ⭐ Best Answers of the Month
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Logout Modal */}
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