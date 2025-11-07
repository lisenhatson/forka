// frontend/src/components/EditProfileModal.jsx
// ✅ COMPLETE & TESTED VERSION

import { useState, useRef, useEffect } from 'react';
import { X, Camera, Upload, Loader2 } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';

const EditProfileModal = ({ isOpen, onClose, currentUser, onUpdate }) => {
  const { updateUser } = useAuthStore();
  const [formData, setFormData] = useState({
    bio: currentUser?.bio || '',
    phone_number: currentUser?.phone_number || '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(currentUser?.profile_picture || null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // ✅ Reset form when modal opens with new user
  useEffect(() => {
    if (isOpen && currentUser) {
      setFormData({
        bio: currentUser.bio || '',
        phone_number: currentUser.phone_number || '',
      });
      setImagePreview(currentUser.profile_picture || null);
      setProfileImage(null);
    }
  }, [isOpen, currentUser]);

  // ✅ Handle image change with validation
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, GIF, WEBP)');
      return;
    }

    setProfileImage(file);
    
    // Create preview URL
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
  };

  // ✅ Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // ✅ Handle submit with FormData
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append('bio', formData.bio || '');
      formDataToSend.append('phone_number', formData.phone_number || '');
      
      // Only append image if new one is selected
      if (profileImage) {
        formDataToSend.append('profile_picture', profileImage);
      }

      // Send PATCH request
      const response = await api.patch(
        '/users/update_profile/',
        formDataToSend
        // Headers akan auto-set oleh axios interceptor
      );

      // Update user in store & local state
      if (response.data.user) {
        updateUser(response.data.user);
        onUpdate(response.data.user);
      }
      
      toast.success('Profile updated successfully! 🎉');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.detail 
        || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle remove image
  const handleRemoveImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
          disabled={loading}
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Profile Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image load error');
                      e.target.style.display = 'none';
                      // Show default avatar on error
                      e.target.parentElement.innerHTML = `
                        <div class="w-full h-full bg-primary-500 flex items-center justify-center text-white text-4xl font-bold">
                          ${currentUser?.username?.charAt(0).toUpperCase()}
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-primary-500 flex items-center justify-center text-white text-4xl font-bold">
                    {currentUser?.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* Camera Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white hover:bg-primary-600 transition shadow-lg"
                disabled={loading}
              >
                <Camera className="w-5 h-5" />
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={loading}
              />
            </div>
            
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                disabled={loading}
              >
                {imagePreview ? 'Change profile picture' : 'Upload profile picture'}
              </button>
              
              {imagePreview && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-sm text-red-600 hover:text-red-700 font-medium ml-4"
                  disabled={loading}
                >
                  Remove
                </button>
              )}
              
              <p className="text-xs text-gray-500 mt-1">
                Max size: 5MB • JPG, PNG, GIF, WEBP
              </p>
            </div>
          </div>

          {/* Username (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={currentUser?.username}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={currentUser?.email}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows="3"
              maxLength="500"
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="Tell us about yourself..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.bio.length}/500 characters
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="+62 812-3456-7890"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;