
import requests
import sys
import time
import uuid
import os
from datetime import datetime

class VideoEditorAPITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {}
        
        if not files and method != 'GET':
            headers['Content-Type'] = 'application/json'
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.text:
                    try:
                        print(f"Response: {response.json()}")
                    except:
                        print(f"Response: {response.text}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    try:
                        print(f"Error: {response.json()}")
                    except:
                        print(f"Error: {response.text}")

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "api",
            200
        )
        return success

    def test_create_status_check(self, client_name):
        """Test creating a status check"""
        success, response = self.run_test(
            "Create Status Check",
            "POST",
            "api/status",
            200,
            data={"client_name": client_name}
        )
        return success, response

    def test_get_status_checks(self):
        """Test getting all status checks"""
        success, response = self.run_test(
            "Get Status Checks",
            "GET",
            "api/status",
            200
        )
        return success, response
        
    def test_upload_video(self, file_path):
        """Test uploading a video file"""
        if not os.path.exists(file_path):
            print(f"❌ Test file not found: {file_path}")
            return False, {}
            
        with open(file_path, 'rb') as f:
            files = {'file': (os.path.basename(file_path), f, 'video/mp4')}
            success, response = self.run_test(
                "Upload Video",
                "POST",
                "api/media/upload",
                200,
                files=files
            )
        return success, response
        
    def test_get_media(self):
        """Test getting all media items"""
        success, response = self.run_test(
            "Get Media Items",
            "GET",
            "api/media",
            200
        )
        return success, response

def main():
    # Get the backend URL from environment variable
    backend_url = "https://2db12a04-3cea-4bee-8ddb-879a7f5c9f0b.preview.emergentagent.com"
    
    # Setup tester
    tester = VideoEditorAPITester(backend_url)
    
    # Generate a unique client name for testing
    client_name = f"test_client_{uuid.uuid4().hex[:8]}"
    
    # Run tests
    root_success = tester.test_root_endpoint()
    if not root_success:
        print("❌ Root endpoint test failed, stopping tests")
        return 1
    
    create_success, create_response = tester.test_create_status_check(client_name)
    if not create_success:
        print("❌ Create status check test failed, stopping tests")
        return 1
    
    # Wait a moment to ensure the status check is saved
    time.sleep(1)
    
    get_success, get_response = tester.test_get_status_checks()
    if not get_success:
        print("❌ Get status checks test failed")
        return 1
    
    # Verify the created status check is in the list
    if get_response:
        found = any(check.get('client_name') == client_name for check in get_response)
        if found:
            print(f"✅ Successfully found created status check with client_name: {client_name}")
        else:
            print(f"❌ Could not find created status check with client_name: {client_name}")
            tester.tests_passed -= 1
    
    # Test media endpoints
    # Create a small test video file
    test_video_path = "/tmp/test_video.mp4"
    try:
        # Check if we have a test video file, if not create a dummy one
        if not os.path.exists(test_video_path):
            print("Creating test video file...")
            os.system(f"dd if=/dev/urandom of={test_video_path} bs=1M count=1")
        
        # Test video upload
        upload_success, upload_response = tester.test_upload_video(test_video_path)
        if not upload_success:
            print("❌ Video upload test failed")
        
        # Test getting media items
        media_success, media_response = tester.test_get_media()
        if not media_success:
            print("❌ Get media items test failed")
        
    except Exception as e:
        print(f"❌ Error during media tests: {str(e)}")
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
