// frontend/src/components/EditProfileModal.jsx
import { useState, useRef, useEffect } from 'react';
import { X, Camera, Upload, Loader2 } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
// ✅ 1. IMPORT KOMPONEN BARU
import { ProfileImage, ImagePreview } from 'src/components/ImageDisplay';

const EditProfileModal = ({ isOpen, onClose, currentUser, onUpdate }) => {
  const { updateUser } = useAuthStore();
  const [formData, setFormData] = useState({
    bio: currentUser?.bio || '',
    phone_number: currentUser?.phone_number || '',
  });
  const [profileImage, setProfileImage] = useState(null);
  // ✅ 2. HAPUS STATE imagePreview
  // const [imagePreview, setImagePreview] = useState(currentUser?.profile_picture || null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setFormData({
        bio: currentUser.bio || '',
        phone_number: currentUser.phone_number || '',
      });
      // Hapus setImagePreview
      setProfileImage(null);
    }
  }, [isOpen, currentUser]);

  // ✅ 3. UPDATE handleImageChange
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, GIF, WEBP)');
      return;
    }

    setProfileImage(file);
    // Hapus setImagePreview
  };

  // ✅ 4. HAPUS useEffect cleanup
  // useEffect(() => { ... }, [imagePreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('bio', formData.bio || '');
      formDataToSend.append('phone_number', formData.phone_number || '');
      
      if (profileImage) {
        formDataToSend.append('profile_picture', profileImage);
      }

      const response = await api.patch(
        '/users/update_profile/',
        formDataToSend
      );

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

  // ✅ 5. UPDATE handleRemoveImage
  const handleRemoveImage = () => {
    setProfileImage(null);
    // Hapus setImagePreview
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  // ✅ 6. Buat variabel helper untuk UI
  const hasExistingImage = !!currentUser?.profile_picture;
  const hasNewImage = !!profileImage;
  const hasImage = hasExistingImage || hasNewImage;

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
              
              {/* ✅ 7. GANTI LOGIC TAMPILAN GAMBAR */}
              {hasNewImage ? (
                // Jika ada file BARU, tampilkan preview
                <ImagePreview 
                  file={profileImage} 
                  onRemove={handleRemoveImage}
                  className="w-32 h-32 rounded-full"
                />
              ) : (
                // Jika tidak, tampilkan gambar SAAT INI (atau fallback)
                <ProfileImage
                  src={currentUser?.profile_picture}
                  username={currentUser?.username}
                  size="2xl"
                />
              )}
              
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
              {/* ✅ 8. UPDATE LOGIC TOMBOL */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                disabled={loading}
              >
                {hasImage ? 'Change profile picture' : 'Upload profile picture'}
              </button>
              
              {/* Tampilkan tombol Hapus hanya jika ada gambar (baru atau lama) */}
              {hasImage && (
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