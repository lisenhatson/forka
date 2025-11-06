import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Eye, 
  MessageSquare, 
  TrendingUp, 
  ThumbsUp, 
  Send, 
  Edit,  // ✅ TAMBAH INI
  Trash2  // ✅ TAMBAH INI
} from 'lucide-react';
import useAuthStore from 'src/stores/authStore';
import api from 'src/config/api';


const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await api.get(`/posts/${id}/`);
      setPost(response.data);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
  try {
    const response = await api.get('/comments/', {
      params: { post: id, top_level: true }
    });
    
    // ✅ Gunakan pattern yang sama
    const commentsData = Array.isArray(response.data) 
      ? response.data 
      : response.data.results || [];
    
    setComments(commentsData);
  } catch (error) {
    console.error('Error fetching comments:', error);
    setComments([]); // ✅ Set empty array on error
  }
};

  const handleLikePost = async () => {
    try {
      await api.post(`/posts/${id}/like/`);
      fetchPost(); // Refresh post data
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/comments/', {
        post: parseInt(id),
        content: commentText
      });
      setCommentText('');
      fetchComments(); // Refresh comments
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await api.delete(`/posts/${id}/`);
      navigate('/home');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Post not found</p>
          <Link to="/home" className="text-primary-600 hover:underline mt-4 inline-block">
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
          {/* Main Post */}
          <main className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
              {/* Author Info */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {post.author?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link 
                      to={`/profile/${post.author?.username}`}
                      className="font-semibold text-gray-900 hover:text-primary-600"
                    >
                      @{post.author?.username}
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Post Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {post.title}
              </h1>

              {/* Post Content */}
              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Category Tags */}
              <div className="flex items-center gap-2 mb-6">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {post.category_name || 'General'}
                </span>
              </div>

              {/* Post Stats */}
              <div className="flex items-center gap-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 text-gray-600">
                  <Eye className="w-5 h-5" />
                  <span>{post.views_count}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MessageSquare className="w-5 h-5" />
                  <span>{post.comments_count}</span>
                </div>
                <button 
                  onClick={handleLikePost}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>{post.likes_count}</span>
                </button>
              </div>
            </div>

            {/* Edit/Delete Actions (for owner or admin/moderator) */}
            {(user?.id === post.author?.id || user?.role === 'admin' || user?.role === 'moderator') && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate(`/posts/${post.id}/edit`)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleDeletePost}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}

            {/* Comments Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Suggestions ({comments.length})
              </h2>

              {/* Comment Form */}
              <form onSubmit={handleSubmitComment} className="mb-8">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Type here your wise suggestion"
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition resize-none"
                />
                <div className="flex justify-end gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => setCommentText('')}
                    className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!commentText.trim() || submitting}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Posting...' : 'Suggest'}
                  </button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-6">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No comments yet. Be the first to comment!</p>
                ) : (
                  comments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} postId={id} />
                  ))
                )}
              </div>
            </div>
          </main>

          {/* Sidebar - Author Profile */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center mb-4">
                <div className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">
                  {post.author?.username?.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  @{post.author?.username}
                </h3>
              </div>

              <div className="flex justify-center gap-8 mb-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary-600">
                    {post.likes_count}
                  </div>
                  <div className="text-sm text-gray-600">Likes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-600">
                    {post.comments_count}
                  </div>
                  <div className="text-sm text-gray-600">Comments</div>
                </div>
              </div>

              <Link
                to={`/profile/${post.author?.username}`}
                className="block w-full py-2 text-center bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-medium"
              >
                View Profile
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

// Comment Item Component
const CommentItem = ({ comment, postId }) => {
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);

  const fetchReplies = async () => {
    try {
      const response = await api.get(`/comments/${comment.id}/replies/`);
      setReplies(response.data);
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const handleLike = async () => {
    try {
      await api.post(`/comments/${comment.id}/like/`);
      // Refresh comment data
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      await api.post('/comments/', {
        post: parseInt(postId),
        content: replyText,
        parent: comment.id
      });
      setReplyText('');
      setShowReplyForm(false);
      fetchReplies();
      setShowReplies(true);
    } catch (error) {
      console.error('Error replying:', error);
    }
  };

  const handleToggleReplies = () => {
    if (!showReplies && replies.length === 0) {
      fetchReplies();
    }
    setShowReplies(!showReplies);
  };

  return (
    <div className="border-l-2 border-gray-200 pl-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
          {comment.author?.username?.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-gray-900">@{comment.author?.username}</span>
            <span className="text-sm text-gray-500">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          
          <p className="text-gray-700 mb-3">{comment.content}</p>
          
          <div className="flex items-center gap-4 text-sm">
            <button 
              onClick={handleLike}
              className="flex items-center gap-1 text-gray-600 hover:text-primary-600"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{comment.likes_count}</span>
            </button>
            
            <button 
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-primary-600 hover:text-primary-700"
            >
              Reply
            </button>

            {comment.replies_count > 0 && (
              <button 
                onClick={handleToggleReplies}
                className="text-gray-600 hover:text-gray-800"
              >
                {showReplies ? 'Hide' : 'Show'} {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <form onSubmit={handleReply} className="mt-4">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply..."
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="px-4 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600"
                >
                  Reply
                </button>
              </div>
            </form>
          )}

          {/* Replies */}
          {showReplies && replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {replies.map((reply) => (
                <div key={reply.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {reply.author?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">@{reply.author?.username}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(reply.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;