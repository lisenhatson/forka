// frontend/src/components/ImageDisplay.jsx
// ✅ CREATE THIS NEW FILE
// Reusable Image Components with Error Handling & Debug Logging

import { useState } from 'react';
import { ImageOff } from 'lucide-react';

/**
 * ProfileImage Component
 * Displays user profile picture with automatic fallback to avatar
 * 
 * @param {string} src - Image URL from API
 * @param {string} username - Username for fallback avatar
 * @param {string} size - Size: xs, sm, md, lg, xl, 2xl
 * @param {string} className - Additional CSS classes
 * 
 * Usage:
 * <ProfileImage 
 *   src={user.profile_picture} 
 *   username={user.username} 
 *   size="md" 
 * />
 */
export const ProfileImage = ({ src, username, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Size classes mapping
  const sizeClasses = {
    xs: 'w-8 h-8 text-xs',
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
    '2xl': 'w-32 h-32 text-4xl',
  };

  // ✅ Debug: Log image URL
  if (src && !imageError && imageLoading) {
    console.log('🖼️ Loading Profile Image:', src);
  }

  // If image exists and no error, show image
  if (src && !imageError) {
    return (
      <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden ${className}`}>
        {/* Loading placeholder */}
        {imageLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        
        {/* Actual image */}
        <img
          src={src}
          alt={`${username}'s profile`}
          className={`w-full h-full object-cover ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          } transition-opacity duration-300`}
          onLoad={() => {
            setImageLoading(false);
            console.log('✅ Profile image loaded successfully');
          }}
          onError={(e) => {
            console.error('❌ Profile image failed to load:', src);
            console.error('Error event:', e);
            setImageError(true);
            setImageLoading(false);
          }}
        />
      </div>
    );
  }

  // Fallback: Show avatar with initial
  const initial = username?.charAt(0).toUpperCase() || 'U';
  
  return (
    <div
      className={`${sizeClasses[size]} bg-primary-500 rounded-full flex items-center justify-center text-white font-bold ${className}`}
    >
      {initial}
    </div>
  );
};


/**
 * PostImage Component
 * Displays post image with error handling
 * 
 * @param {string} src - Image URL from API
 * @param {string} alt - Alt text for image
 * @param {string} className - Additional CSS classes
 * 
 * Usage:
 * <PostImage 
 *   src={post.image} 
 *   alt={post.title}
 *   className="mb-4" 
 * />
 */
export const PostImage = ({ src, alt = 'Post image', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // ✅ Debug: Log image URL
  if (src && !imageError && imageLoading) {
    console.log('🖼️ Loading Post Image:', src);
  }

  // If no image, don't render anything
  if (!src) {
    return null;
  }

  // If error loading image, show error state
  if (imageError) {
    return (
      <div className={`w-full bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center p-12 ${className}`}>
        <div className="text-center">
          <ImageOff className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">Image failed to load</p>
          <p className="text-xs text-gray-400 mt-1 break-all px-4">{src}</p>
        </div>
      </div>
    );
  }

  // Display image with loading state
  return (
    <div className={`relative ${className}`}>
      {/* Loading placeholder */}
      {imageLoading && (
        <div className="w-full h-64 bg-gray-200 rounded-lg animate-pulse" />
      )}
      
      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        className={`w-full rounded-lg object-cover ${
          imageLoading ? 'hidden' : 'block'
        }`}
        onLoad={() => {
          setImageLoading(false);
          console.log('✅ Post image loaded successfully');
        }}
        onError={(e) => {
          console.error('❌ Post image failed to load:', src);
          console.error('Error event:', e);
          setImageError(true);
          setImageLoading(false);
        }}
      />
    </div>
  );
};


/**
 * ImagePreview Component
 * Preview uploaded image before submission
 * 
 * @param {File} file - File object from input
 * @param {function} onRemove - Callback to remove image
 * @param {string} className - Additional CSS classes
 * 
 * Usage:
 * <ImagePreview 
 *   file={selectedFile} 
 *   onRemove={() => setSelectedFile(null)}
 * />
 */
export const ImagePreview = ({ file, onRemove, className = '' }) => {
  const [preview, setPreview] = useState(null);

  // Create preview URL from file
  if (file && !preview) {
    const reader = new FileReader();
    
    reader.onloadend = () => {
      setPreview(reader.result);
      console.log('✅ Image preview created');
    };
    
    reader.onerror = () => {
      console.error('❌ Failed to create preview');
    };
    
    reader.readAsDataURL(file);
  }

  // Show loading state while creating preview
  if (!preview) {
    return (
      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  // Show preview with remove button
  return (
    <div className={`relative ${className}`}>
      <img
        src={preview}
        alt="Preview"
        className="w-full h-full object-cover rounded-lg"
      />
      
      {/* Remove button */}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-lg z-10"
          aria-label="Remove image"
        >
          ✕
        </button>
      )}
      
      {/* Preview badge */}
      <div className="absolute bottom-2 left-2 px-3 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
        Preview
      </div>
    </div>
  );
};


// Export all components as default
export default {
  ProfileImage,
  PostImage,
  ImagePreview,
};