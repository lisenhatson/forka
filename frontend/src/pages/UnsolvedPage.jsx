// src/pages/UnsolvedPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import api from '../config/api';

const UnsolvedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnsolvedPosts();
  }, []);

  const fetchUnsolvedPosts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/posts/', {
        params: {
          // Filter posts yang belum ada comment/answer
          ordering: '-created_at'
        }
      });
      
      // Filter posts dengan 0 comments
      const unsolved = response.data.filter(post => post.comments_count === 0);
      setPosts(unsolved);
    } catch (error) {
      console.error('Error fetching unsolved posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/home')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <Link to="/home" className="text-2xl font-bold text-gray-800">
                ForKa
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Unsolved Questions ({posts.length})
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-600">No unsolved questions found! 🎉</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link 
                key={post.id}
                to={`/posts/${post.id}`}
                className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary-600">
                  {post.title}
                </h3>
                <p className="text-gray-600 mb-3 line-clamp-2">
                  {post.content}
                </p>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <span>by @{post.author?.username}</span>
                  <span>{post.views_count} views</span>
                  <span className="ml-auto">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnsolvedPage;