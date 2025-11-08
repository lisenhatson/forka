#!/usr/bin/env python3
"""
Test script untuk memverifikasi profile picture upload functionality
Run this after starting Django server: python manage.py runserver
"""

import requests
import json
from pathlib import Path

BASE_URL = "http://localhost:8000/api"

def test_profile_upload():
    """Test profile picture upload endpoint"""

    print("=" * 60)
    print("TESTING PROFILE PICTURE UPLOAD")
    print("=" * 60)

    # 1. Login first to get token
    print("\n1. Login...")
    login_data = {
        "username": "test_user",  # Change to your test username
        "password": "test_pass"   # Change to your test password
    }

    try:
        login_response = requests.post(
            f"{BASE_URL}/token/",
            json=login_data
        )

        if login_response.status_code == 200:
            token = login_response.json()['access']
            print("   ✓ Login successful")
            print(f"   Token: {token[:20]}...")
        else:
            print("   ✗ Login failed")
            print(f"   Response: {login_response.text}")
            return

    except Exception as e:
        print(f"   ✗ Error: {e}")
        print("\n   Make sure Django server is running:")
        print("   cd backend && python manage.py runserver")
        return

    # 2. Test update profile endpoint
    print("\n2. Testing update profile endpoint...")

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Test with text only (no image)
    print("\n   a) Test update bio (no image)...")
    data = {
        "bio": "Updated bio from test script",
        "phone_number": "+62 812-3456-7890"
    }

    try:
        response = requests.patch(
            f"{BASE_URL}/users/update_profile/",
            json=data,
            headers=headers
        )

        if response.status_code == 200:
            print("      ✓ Bio update successful")
            print(f"      Response: {response.json()['message']}")
        else:
            print("      ✗ Bio update failed")
            print(f"      Status: {response.status_code}")
            print(f"      Response: {response.text}")

    except Exception as e:
        print(f"      ✗ Error: {e}")

    # 3. Test with image upload (if test image exists)
    print("\n   b) Test update with profile picture...")

    # Check if test image exists
    test_image_path = Path("test_profile.jpg")

    if test_image_path.exists():
        try:
            with open(test_image_path, 'rb') as img:
                files = {
                    'profile_picture': ('test_profile.jpg', img, 'image/jpeg')
                }
                data = {
                    'bio': 'Updated with image',
                    'phone_number': '+62 812-3456-7890'
                }

                response = requests.patch(
                    f"{BASE_URL}/users/update_profile/",
                    files=files,
                    data=data,
                    headers=headers
                )

                if response.status_code == 200:
                    print("      ✓ Image upload successful")
                    result = response.json()
                    print(f"      Message: {result['message']}")
                    if 'user' in result and 'profile_picture' in result['user']:
                        print(f"      Image URL: {result['user']['profile_picture']}")
                else:
                    print("      ✗ Image upload failed")
                    print(f"      Status: {response.status_code}")
                    print(f"      Response: {response.text}")

        except Exception as e:
            print(f"      ✗ Error: {e}")
    else:
        print("      ⚠ Skipped: test_profile.jpg not found")
        print("      Create a test image: test_profile.jpg in backend/ folder")

    # 4. Check endpoint configuration
    print("\n3. Checking endpoint configuration...")

    try:
        # Get user info to verify serializer works
        response = requests.get(
            f"{BASE_URL}/users/me/",
            headers=headers
        )

        if response.status_code == 200:
            user_data = response.json()
            print("   ✓ User info endpoint working")
            print(f"   Username: {user_data.get('username')}")
            print(f"   Profile Picture: {user_data.get('profile_picture', 'None')}")
        else:
            print("   ✗ User info endpoint failed")

    except Exception as e:
        print(f"   ✗ Error: {e}")

    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)

    print("\nNext steps:")
    print("1. Try uploading from frontend UI")
    print("2. Check backend/media/profiles/ for uploaded files")
    print("3. Verify image URLs are accessible")

if __name__ == "__main__":
    test_profile_upload()
