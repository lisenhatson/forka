import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ImagePlus, AlertCircle } from 'lucide-react';
import useAuthStore from 'src/stores/authStore';
import api from 'src/config/api';

const CreatePostPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
  try {
    const response = await api.get('/categories/');
    
    // ✅ Gunakan pattern yang sama seperti HomePage.jsx
    const categoriesData = Array.isArray(response.data) 
      ? response.data 
      : response.data.results || [];
    
    setCategories(categoriesData);
  } catch (error) {
    console.error('Error fetching categories:', error);
    setCategories([]); // ✅ Set empty array on error
  }
};

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  // ✅ Hanya validasi title saja, content optional
  if (!formData.title.trim()) {
    setError('Title is required');
    return;
  }

  setLoading(true);
  setError('');

  try {
    const response = await api.post('/posts/', {
      title: formData.title,
      content: formData.content, // ✅ Bisa kosong
      category: formData.category || null
    });

    // Redirect to the created post
    navigate(`/posts/${response.data.id}`);
  } catch (error) {
    console.error('Error creating post:', error);
    setError(error.response?.data?.detail || 'Failed to create post');
  } finally {
    setLoading(false);
  }
};

  const handleSaveDraft = () => {
    // Save to localStorage as draft
    localStorage.setItem('post_draft', JSON.stringify(formData));
    alert('Draft saved!');
  };

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('post_draft');
    if (draft) {
      const shouldLoad = window.confirm('You have a saved draft. Do you want to load it?');
      if (shouldLoad) {
        setFormData(JSON.parse(draft));
      }
    }
  }, []);

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
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveDraft}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
              >
                Save as draft
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Form */}
          <main className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Ask a Question</h1>

              {/* Error Alert */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose categories
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  >
                    <option value="">Select a category (optional)</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type catching attention title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., How to patch KDE on FreeBSD?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type your question
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    rows="12"
                    placeholder="Describe your question in detail..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition resize-none"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Be specific and imagine you're asking a question to another person
                  </p>
                </div>

                {/* Image Upload (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add image (optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition cursor-pointer">
                    <ImagePlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                  </div>
                </div>
              </form>
            </div>
          </main>

          {/* Sidebar - Tips */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Must-read posts */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Must-read posts</h3>
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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

              {/* Writing Tips */}
              <div className="bg-primary-50 rounded-lg border border-primary-200 p-6">
                <h3 className="font-semibold text-primary-900 mb-4">Writing Tips</h3>
                <ul className="space-y-2 text-sm text-primary-800">
                  <li>• Be specific with your title</li>
                  <li>• Provide context and details</li>
                  <li>• Include what you've tried</li>
                  <li>• Use proper formatting</li>
                  <li>• Check for similar questions</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CreatePostPage;