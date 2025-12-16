import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Github, Instagram, Facebook, Calendar, Edit, MessageSquare, ThumbsUp } from 'lucide-react';
import useAuthStore from 'src/stores/authStore';
import api from 'src/config/api';
import EditProfileModal from 'src/components/EditProfileModal';
import { ProfileImage } from 'src/components/ImageDisplay';

const ProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useAuthStore((state) => state.user);
  
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'posts');
  const [showEditModal, setShowEditModal] = useState(false);

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    fetchUserProfile();
    fetchUserPosts();
    if (activeTab === 'comments') fetchUserComments();
    if (activeTab === 'likes') fetchLikedPosts();
  }, [username, activeTab]);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/users/');
      const usersData = Array.isArray(response.data) 
        ? response.data 
        : response.data.results || [];
      
      const user = usersData.find(u => u.username === username);
      
      if (user) {
        const detailResponse = await api.get(`/users/${user.id}/`);
        setProfileUser(detailResponse.data);
      } else {
        setProfileUser(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfileUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await api.get('/posts/');
      const postsData = Array.isArray(response.data) 
        ? response.data 
        : response.data.results || [];
      
      const filtered = postsData.filter(post => post.author?.username === username);
      setUserPosts(filtered);
    } catch (error) {
      console.error('Error fetching user posts:', error);
      setUserPosts([]);
    }
  };

  const fetchUserComments = async () => {
    try {
      const response = await api.get('/comments/');
      const commentsData = Array.isArray(response.data) 
        ? response.data 
        : response.data.results || [];
      
      const filtered = commentsData.filter(comment => comment.author?.username === username);
      setUserComments(filtered);
    } catch (error) {
      console.error('Error fetching user comments:', error);
      setUserComments([]);
    }
  };

  const fetchLikedPosts = async () => {
    try {
      setLikedPosts([]);
    } catch (error) {
      console.error('Error fetching liked posts:', error);
      setLikedPosts([]);
    }
  };

  const handleProfileUpdate = (updatedUser) => {
    setProfileUser(updatedUser);
    if (isOwnProfile) {
      const { updateUser } = useAuthStore.getState();
      updateUser(updatedUser);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">User not found</p>
          <Link to="/home" className="text-primary-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

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
        <div className="flex gap-8">
          {/* Profile Sidebar */}
          <aside className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              {/* Profile Picture */}
              <div className="text-center mb-6">
                <ProfileImage
                  src={profileUser.profile_picture}
                  username={profileUser.username}
                  size="2xl"
                  className="mx-auto mb-4"
                />

                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  @{profileUser.username}
                </h2>
                {profileUser.role && (
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    profileUser.role === 'admin' 
                      ? 'bg-red-100 text-red-700'
                      : profileUser.role === 'moderator'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-primary-100 text-primary-700'
                  }`}>
                    {profileUser.role}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex justify-around mb-6 py-4 border-y border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {profileUser.posts_count || 0}
                  </div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {profileUser.comments_count || 0}
                  </div>
                  <div className="text-sm text-gray-600">Comments</div>
                </div>
              </div>

              {/* Bio */}
              {profileUser.bio && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">About</h3>
                  <p className="text-gray-600 text-sm">{profileUser.bio}</p>
                </div>
              )}

              {/* Info */}
              <div className="space-y-3 mb-6">
                {profileUser.date_joined && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDate(profileUser.date_joined)}</span>
                  </div>
                )}
              </div>

              {/* Social Links */}
              <div className="flex gap-3 mb-6">
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">
                  <Facebook className="w-5 h-5" />
                </a>
              </div>

              {/* Edit Profile Button */}
              {isOwnProfile && (
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-medium flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </aside>

          {/* Main Content - Posts/Comments/Likes */}
          <main className="flex-1">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="flex border-b border-gray-200">
                <button 
                  onClick={() => handleTabChange('posts')}
                  className={`flex-1 px-6 py-3 font-medium border-b-2 transition ${
                    activeTab === 'posts' 
                      ? 'border-primary-500 text-primary-600' 
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Posts ({userPosts.length})
                </button>
                <button 
                  onClick={() => handleTabChange('comments')}
                  className={`flex-1 px-6 py-3 font-medium border-b-2 transition ${
                    activeTab === 'comments' 
                      ? 'border-primary-500 text-primary-600' 
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Comments ({userComments.length})
                </button>
                <button 
                  onClick={() => handleTabChange('likes')}
                  className={`flex-1 px-6 py-3 font-medium border-b-2 transition ${
                    activeTab === 'likes' 
                      ? 'border-primary-500 text-primary-600' 
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Liked ({likedPosts.length})
                </button>
              </div>
            </div>

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {userPosts.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No posts yet</p>
                    {isOwnProfile && (
                      <Link 
                        to="/ask"
                        className="inline-block mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                      >
                        Create your first post
                      </Link>
                    )}
                  </div>
                ) : (
                  userPosts.map((post) => (
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
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {post.category_name || 'General'}
                        </span>
                        {post.is_solved && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                            ✓ Solved
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span>{post.views_count} views</span>
                        <span>{post.comments_count} comments</span>
                        <span>{post.likes_count} likes</span>
                        <span className="ml-auto">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                {userComments.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No comments yet</p>
                  </div>
                ) : (
                  userComments.map((comment) => (
                    <div 
                      key={comment.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                    >
                      <p className="text-gray-700 mb-3">{comment.content}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <Link 
                          to={`/posts/${comment.post}`}
                          className="text-primary-600 hover:underline"
                        >
                          View post →
                        </Link>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            {comment.likes_count}
                          </span>
                          <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Liked Tab */}
            {activeTab === 'likes' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <ThumbsUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Liked posts feature coming soon</p>
                <p className="text-sm text-gray-500 mt-2">
                  This feature requires backend implementation to track liked posts
                </p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentUser={profileUser}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default ProfilePage;