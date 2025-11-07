// frontend/src/pages/admin/AdminPosts.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Search, Edit, Trash2, Pin, Lock, 
  Unlock, Eye, MessageSquare, TrendingUp 
} from 'lucide-react';
import api from 'src/config/api';
import toast from 'react-hot-toast';

const AdminPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/posts/');
      const postsData = Array.isArray(response.data) 
        ? response.data 
        : response.data.results || [];
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (postId, currentStatus) => {
    try {
      await api.post(`/posts/${postId}/pin/`);
      toast.success(currentStatus ? 'Post unpinned' : 'Post pinned');
      fetchPosts();
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('Failed to update post');
    }
  };

  const handleToggleClose = async (postId, currentStatus) => {
    try {
      await api.post(`/posts/${postId}/close/`);
      toast.success(currentStatus ? 'Post opened' : 'Post closed');
      fetchPosts();
    } catch (error) {
      console.error('Error toggling close:', error);
      toast.error('Failed to update post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/posts/${postId}/`);
      toast.success('Post deleted successfully');
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author?.username?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'pinned' && post.is_pinned) ||
      (filterStatus === 'closed' && post.is_closed) ||
      (filterStatus === 'open' && !post.is_closed);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading posts...</p>
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
            <div className="flex items-center gap-4">
              <Link 
                to="/admin"
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">Post Management</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts by title or author..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="all">All Posts</option>
              <option value="pinned">Pinned Only</option>
              <option value="closed">Closed Only</option>
              <option value="open">Open Only</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 text-sm mb-1">Total Posts</p>
            <p className="text-3xl font-bold text-gray-900">{posts.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 text-sm mb-1">Pinned</p>
            <p className="text-3xl font-bold text-blue-600">
              {posts.filter(p => p.is_pinned).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 text-sm mb-1">Closed</p>
            <p className="text-3xl font-bold text-red-600">
              {posts.filter(p => p.is_closed).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 text-sm mb-1">Open</p>
            <p className="text-3xl font-bold text-green-600">
              {posts.filter(p => !p.is_closed).length}
            </p>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Post
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <Link 
                        to={`/posts/${post.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-primary-600 line-clamp-2"
                      >
                        {post.title}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      @{post.author?.username}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.views_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {post.comments_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {post.likes_count}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {post.is_pinned && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          Pinned
                        </span>
                      )}
                      {post.is_closed ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                          Closed
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          Open
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleTogglePin(post.id, post.is_pinned)}
                        className={`p-2 rounded-lg transition ${
                          post.is_pinned 
                            ? 'text-blue-600 hover:bg-blue-50' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        title={post.is_pinned ? 'Unpin' : 'Pin'}
                      >
                        <Pin className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleToggleClose(post.id, post.is_closed)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title={post.is_closed ? 'Open' : 'Close'}
                      >
                        {post.is_closed ? (
                          <Unlock className="w-5 h-5" />
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </button>
                      <Link
                        to={`/posts/${post.id}`}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition"
                        title="View"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No posts found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPosts;