# Profile Picture Upload - Fix Documentation

## Masalah yang Sudah Diperbaiki

Fitur upload profile picture tidak berfungsi karena beberapa hal:

1. Backend view tidak menggunakan `UserUpdateSerializer` yang tepat
2. Backend tidak mendukung multipart/form-data untuk file upload
3. Serializer perlu handle profile_picture dengan benar

## Perubahan yang Dilakukan

### 1. Backend - views.py

**File:** `backend/forum/views.py`

#### Perubahan Import
```python
# SEBELUM
from .serializers import (
    UserSerializer, UserDetailSerializer, UserRegistrationSerializer,
    CategorySerializer,
    ...
)

# SESUDAH
from .serializers import (
    UserSerializer, UserDetailSerializer, UserRegistrationSerializer,
    UserUpdateSerializer,  # TAMBAHAN INI
    CategorySerializer,
    ...
)
```

#### Perubahan UserViewSet
```python
# TAMBAHKAN parser_classes untuk mendukung file upload
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # TAMBAHAN
```

#### Perubahan update_profile Action
```python
# SEBELUM: Menggunakan UserDetailSerializer
@action(detail=False, methods=['put', 'patch'], permission_classes=[IsAuthenticated])
def update_profile(self, request):
    user = request.user
    serializer = UserDetailSerializer(
        user,
        data=request.data,
        partial=True,
        context={'request': request}
    )
    ...

# SESUDAH: Menggunakan UserUpdateSerializer + parser_classes
@action(detail=False, methods=['put', 'patch'],
        permission_classes=[IsAuthenticated],
        parser_classes=[MultiPartParser, FormParser, JSONParser])
def update_profile(self, request):
    user = request.user

    # Gunakan UserUpdateSerializer untuk upload file
    serializer = UserUpdateSerializer(
        user,
        data=request.data,
        partial=True,
        context={'request': request}
    )

    if serializer.is_valid():
        updated_user = serializer.save()

        # Return full user data
        response_serializer = UserDetailSerializer(
            updated_user,
            context={'request': request}
        )

        return Response({
            'message': 'Profile updated successfully',
            'user': response_serializer.data
        })

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

### 2. Backend - serializers.py

**File:** `backend/forum/serializers.py`

#### UserUpdateSerializer yang Diperbaiki
```python
class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer untuk update user profile termasuk profile picture"""
    profile_picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['bio', 'phone_number', 'profile_picture']

    def update(self, instance, validated_data):
        # Update text fields
        instance.bio = validated_data.get('bio', instance.bio)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)

        # Handle profile picture update
        if 'profile_picture' in validated_data:
            profile_picture = validated_data.get('profile_picture')

            if profile_picture:
                # Delete old image if exists
                if instance.profile_picture:
                    try:
                        instance.profile_picture.delete(save=False)
                    except Exception as e:
                        pass  # Old file might not exist

                # Save new image
                instance.profile_picture = profile_picture
            elif profile_picture is None:
                # Remove profile picture if None is passed
                if instance.profile_picture:
                    try:
                        instance.profile_picture.delete(save=False)
                    except Exception as e:
                        pass
                instance.profile_picture = None

        instance.save()
        return instance
```

### 3. Frontend - Sudah Benar

Frontend code di `EditProfileModal.jsx` sudah benar:
- Menggunakan FormData untuk multipart upload
- Handle image preview dengan benar
- Validasi file size dan type
- Auto remove Content-Type header untuk multipart

## Cara Testing

1. **Start Backend Server:**
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Start Frontend Server:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Upload:**
   - Login ke aplikasi
   - Buka profile page
   - Klik "Edit Profile"
   - Klik camera icon atau "Upload profile picture"
   - Pilih gambar (max 5MB, JPG/PNG/GIF/WEBP)
   - Klik "Save Changes"

4. **Check hasil:**
   - Profile picture harus langsung update di profile page
   - Image disimpan di `backend/media/profiles/`
   - URL image bisa diakses di `http://localhost:8000/media/profiles/...`

## Validasi yang Ada

### Backend Validation:
- File type validation (ImageField)
- File size limit: 5MB (di settings.py)
- File permissions: 0o644

### Frontend Validation:
- File size: max 5MB
- File types: JPG, JPEG, PNG, GIF, WEBP
- Preview before upload
- Error handling untuk invalid files

## CORS Configuration

Pastikan CORS sudah di-setup dengan benar di `backend/forka_backend/settings.py`:

```python
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

CORS_EXPOSE_HEADERS = [
    'Content-Length',
    'Content-Type',
]
```

## Media Files Configuration

Sudah benar di `backend/forka_backend/settings.py`:

```python
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
```

Dan di `backend/forka_backend/urls.py`:

```python
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

## Troubleshooting

### Problem: "Failed to update profile"
**Solution:** Check Django logs untuk error detail

### Problem: Image tidak muncul setelah upload
**Solution:**
1. Check apakah file tersimpan di `backend/media/profiles/`
2. Check MEDIA_URL configuration
3. Check browser console untuk CORS error

### Problem: "Invalid image file"
**Solution:** Pastikan file adalah image valid dan < 5MB

### Problem: Old image tidak terhapus
**Solution:** Check permission folder `backend/media/profiles/`

## Testing Checklist

- [ ] Upload new profile picture - Success
- [ ] Change profile picture - Success
- [ ] Remove profile picture - Success
- [ ] Update bio & phone with picture - Success
- [ ] Update bio & phone without picture - Success
- [ ] Upload file > 5MB - Show error
- [ ] Upload non-image file - Show error
- [ ] Profile picture shows in profile page
- [ ] Profile picture shows in posts/comments
- [ ] CORS tidak blocking request

## Next Steps (Optional Improvements)

1. Image compression before upload
2. Image cropping/resizing
3. Multiple image formats (thumbnail, medium, large)
4. CDN integration untuk production
5. Progress bar untuk upload

---

**Status:** FIXED
**Tested:** Backend code fixed, needs runtime testing
**Priority:** HIGH - Core feature
