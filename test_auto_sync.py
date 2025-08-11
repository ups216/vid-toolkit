#!/usr/bin/env python3
"""
Test script for auto-sync metadata functionality
"""

import requests
import json

BASE_URL = "http://localhost:6800"

def test_auto_sync_save():
    """Test the new auto-sync save endpoint"""
    print("🧪 Testing Auto-Sync Metadata Save")
    print("=" * 50)
    
    # Example: Save a video with minimal info, let server auto-sync everything
    save_request = {
        "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",  # Example URL
        "video_file_name": "some_downloaded_file.mp4"  # Just the filename
        # No need to provide description, category, tags, etc. - will be auto-synced!
    }
    
    print("📤 Sending auto-sync save request:")
    print(json.dumps(save_request, indent=2))
    
    try:
        response = requests.post(f"{BASE_URL}/videopage_save_auto", json=save_request)
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ Auto-sync save successful!")
            print(f"📺 Video ID: {data['video_id']}")
            print(f"📁 Library filename: {data['library_file_name']}")
            
            synced = data.get('auto_synced_metadata', {})
            print(f"\n🔄 Auto-synced metadata:")
            print(f"  📺 Title: {synced.get('title')}")
            print(f"  📝 Description: {synced.get('description_length')} characters")
            print(f"  📂 Category: {synced.get('category')}")
            print(f"  🏷️ Tags: {synced.get('tags_count')} tags")
            print(f"  👤 Uploader: {synced.get('uploader')}")
            print(f"  👀 Views: {synced.get('view_count')}")
            print(f"  👍 Likes: {synced.get('like_count')}")
            print(f"  📅 Upload Date: {synced.get('upload_date')}")
            
        else:
            print(f"❌ Auto-sync save failed: {response.status_code}")
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Server not running. Please start the server first:")
        print("cd /Users/martinliu/code/video-wallet/src/server && python main.py")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def compare_endpoints():
    """Compare the two save endpoints"""
    print("\n" + "=" * 50)
    print("📊 Comparison: Manual vs Auto-Sync Save")
    print("=" * 50)
    
    print("🔧 Manual Save Endpoint: POST /videopage_save")
    print("  - Requires manual input of metadata")
    print("  - User provides: description, category, selected_tags, etc.")
    print("  - Server fills in missing metadata only")
    print("  - Good for: User customization and tag selection")
    
    print("\n🤖 Auto-Sync Save Endpoint: POST /videopage_save_auto")
    print("  - Automatically syncs ALL metadata from source video")
    print("  - User provides: video_url, video_file_name")
    print("  - Server fetches: title, description, category, tags, metrics")
    print("  - Good for: Quick save with complete metadata")
    
    print("\n💡 Recommended Workflow:")
    print("1. Analyze video: POST /videopage_analyze")
    print("2. Download video: POST /videopage_download") 
    print("3. Auto-sync save: POST /videopage_save_auto")
    print("4. Browse library: GET /videopage_list")

if __name__ == "__main__":
    compare_endpoints()
    
    choice = input("\nRun auto-sync test? (y/n): ").strip().lower()
    if choice == 'y':
        test_auto_sync_save()
    else:
        print("Test skipped. You can now use the auto-sync endpoint!")
