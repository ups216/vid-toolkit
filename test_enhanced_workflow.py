#!/usr/bin/env python3
"""
Enhanced Video-Wallet Workflow Test Script
This script demonstrates the complete workflow with metadata storage:
1. Analyze video for formats
2. Get metadata for tag selection
3. Download video with selected format
4. Save with selected tags and metadata
5. List videos with filtering options
"""

import requests
import json
import time
from typing import List, Optional

# Server configuration
BASE_URL = "http://localhost:6800"

def analyze_video(url: str) -> dict:
    """Step 1: Analyze video to get available formats"""
    print(f"\n🔍 Step 1: Analyzing video URL: {url}")
    
    response = requests.post(f"{BASE_URL}/videopage_analyze", 
                           json={"url": url})
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Found {data['videos_found']} video(s)")
        
        if data['videos_found'] > 0:
            video = data['videos'][0]
            print(f"📺 Title: {video['title']}")
            print(f"👤 Uploader: {video.get('uploader', 'Unknown')}")
            print(f"⏱️ Duration: {video.get('duration', 'Unknown')} seconds")
            print(f"👀 Views: {video.get('view_count', 'Unknown')}")
            
            print(f"\n📋 Available formats:")
            for i, fmt in enumerate(video['formats'][:5]):  # Show first 5 formats
                print(f"  {i+1}. {fmt['quality']} ({fmt['resolution']}) - {fmt['ext']} - Format ID: {fmt['format_id']}")
        
        return data
    else:
        print(f"❌ Error analyzing video: {response.status_code} - {response.text}")
        return {}

def get_metadata_for_selection(url: str) -> dict:
    """Step 2: Get detailed metadata for tag selection"""
    print(f"\n📊 Step 2: Getting metadata for tag selection...")
    
    response = requests.post(f"{BASE_URL}/videopage_metadata", 
                           json={"url": url})
    
    if response.status_code == 200:
        data = response.json()
        metadata = data['metadata']
        
        print(f"✅ Metadata retrieved successfully")
        print(f"📝 Description: {metadata.get('description', 'No description')[:100]}...")
        print(f"📅 Upload Date: {metadata.get('upload_date', 'Unknown')}")
        print(f"🏷️ Available Tags ({len(metadata.get('available_tags', []))}): {metadata.get('available_tags', [])[:10]}")
        print(f"📂 Categories: {metadata.get('categories', [])}")
        print(f"👀 Views: {metadata.get('view_count', 'Unknown')}")
        print(f"👍 Likes: {metadata.get('like_count', 'Unknown')}")
        print(f"👎 Dislikes: {metadata.get('dislike_count', 'Unknown')}")
        print(f"💬 Comments: {metadata.get('comment_count', 'Unknown')}")
        print(f"⭐ Rating: {metadata.get('average_rating', 'Unknown')}")
        print(f"📺 Channel: {metadata.get('uploader', 'Unknown')}")
        
        return data
    else:
        print(f"❌ Error getting metadata: {response.status_code} - {response.text}")
        return {}

def select_tags_from_available(available_tags: List[str], max_select: int = 5) -> List[str]:
    """Helper function to simulate tag selection"""
    if not available_tags:
        return []
    
    # Simulate user selection - take first few tags as an example
    selected = available_tags[:min(max_select, len(available_tags))]
    print(f"🎯 Selected tags: {selected}")
    return selected

def download_video(url: str, format_id: str) -> dict:
    """Step 3: Download video with selected format"""
    print(f"\n⬇️ Step 3: Downloading video with format {format_id}...")
    
    response = requests.post(f"{BASE_URL}/videopage_download", 
                           json={"url": url, "format_id": format_id})
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Download completed: {data['filename']}")
        print(f"📁 File size: {data['file_size']} bytes")
        print(f"🖼️ Thumbnail: {data.get('thumbnail_filename', 'Not available')}")
        print(f"🔗 Merged: {data.get('merged', False)}")
        return data
    else:
        print(f"❌ Error downloading video: {response.status_code} - {response.text}")
        return {}

def save_video_with_metadata(video_url: str, video_file_name: str, metadata: dict, selected_tags: List[str]) -> dict:
    """Step 4: Save video with enhanced metadata"""
    print(f"\n💾 Step 4: Saving video to library with enhanced metadata...")
    
    # Extract category from categories list
    category = None
    if metadata.get('categories'):
        category = metadata['categories'][0]  # Take first category
    
    save_request = {
        "video_url": video_url,
        "video_page_name": metadata.get('title'),
        "video_file_name": video_file_name,
        # Selected tags and metadata
        "selected_tags": selected_tags,
        "description": metadata.get('description'),
        "category": category,
        # Engagement metrics
        "like_count": metadata.get('like_count'),
        "dislike_count": metadata.get('dislike_count'),
        "comment_count": metadata.get('comment_count'),
        "view_count": metadata.get('view_count'),
        "average_rating": metadata.get('average_rating'),
        # Channel info
        "uploader": metadata.get('uploader'),
        "channel_id": metadata.get('channel_id'),
        "channel_url": metadata.get('channel_url'),
        # Additional info
        "upload_date": metadata.get('upload_date'),
        "duration": metadata.get('duration'),
        "age_limit": metadata.get('age_limit')
    }
    
    response = requests.post(f"{BASE_URL}/videopage_save", json=save_request)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Video saved to library with ID: {data['video_id']}")
        print(f"📁 Library filename: {data['library_file_name']}")
        print(f"🖼️ Thumbnail URL: {data.get('thumbnail_url', 'Not available')}")
        print(f"📊 Total videos in library: {data['total_videos_in_library']}")
        return data
    else:
        print(f"❌ Error saving video: {response.status_code} - {response.text}")
        return {}

def list_videos_with_filters(search: Optional[str] = None, tag: Optional[str] = None, 
                           category: Optional[str] = None, sort_by: str = "saved_at") -> dict:
    """Step 5: List videos with advanced filtering"""
    print(f"\n📚 Step 5: Listing videos with filters...")
    
    params = {"sort_by": sort_by, "order": "desc"}
    if search:
        params["search"] = search
    if tag:
        params["tag"] = tag
    if category:
        params["category"] = category
    
    response = requests.get(f"{BASE_URL}/videopage_list", params=params)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Library loaded: {data['total_videos']} total videos, {data['filtered_videos']} after filters")
        
        print(f"\n📋 Available filters:")
        filters = data.get('available_filters', {})
        print(f"  🏷️ Tags: {filters.get('tags', [])[:10]}")
        print(f"  📂 Categories: {filters.get('categories', [])}")
        print(f"  👤 Uploaders: {filters.get('uploaders', [])[:5]}")
        
        print(f"\n📺 Videos in library:")
        for i, video in enumerate(data['videos'][:3]):  # Show first 3 videos
            print(f"  {i+1}. {video['video_page_name']}")
            print(f"     👤 {video.get('uploader', 'Unknown')} | 👀 {video.get('view_count', 'Unknown')} views")
            print(f"     🏷️ Tags: {video.get('selected_tags', [])[:5]}")
            print(f"     📂 Category: {video.get('category', 'None')}")
            print(f"     📅 Saved: {video.get('saved_at', 'Unknown')}")
            print(f"     🔗 URL: {BASE_URL}{video.get('video_direct_url', '')}")
            if video.get('thumbnail_url'):
                print(f"     🖼️ Thumbnail: {BASE_URL}{video['thumbnail_url']}")
            print()
        
        return data
    else:
        print(f"❌ Error listing videos: {response.status_code} - {response.text}")
        return {}

def test_complete_workflow():
    """Test the complete enhanced workflow"""
    print("🚀 Starting Enhanced Video-Wallet Workflow Test")
    print("=" * 60)
    
    # Test with a sample URL (you can change this)
    test_url = input("Enter a video URL to test (or press Enter for default): ").strip()
    if not test_url:
        test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Rick Roll as example
    
    try:
        # Step 1: Analyze video
        analyze_result = analyze_video(test_url)
        if not analyze_result.get('videos'):
            print("❌ No videos found, stopping test")
            return
        
        video_info = analyze_result['videos'][0]
        
        # Step 2: Get metadata for tag selection
        metadata_result = get_metadata_for_selection(test_url)
        if not metadata_result.get('metadata'):
            print("❌ No metadata found, stopping test")
            return
        
        metadata = metadata_result['metadata']
        
        # Simulate tag selection
        available_tags = metadata.get('available_tags', [])
        selected_tags = select_tags_from_available(available_tags)
        
        # Step 3: Download video (use best quality format)
        if video_info.get('formats'):
            best_format = video_info['formats'][0]  # First format is highest quality
            download_result = download_video(test_url, best_format['format_id'])
            
            if download_result.get('filename'):
                # Step 4: Save with metadata
                save_result = save_video_with_metadata(
                    test_url, 
                    download_result['filename'], 
                    metadata, 
                    selected_tags
                )
                
                if save_result.get('video_id'):
                    # Step 5: List videos with different filters
                    print("\n" + "=" * 40)
                    list_videos_with_filters()  # All videos
                    
                    if selected_tags:
                        print("\n" + "-" * 40)
                        list_videos_with_filters(tag=selected_tags[0])  # Filter by first tag
                    
                    if metadata.get('uploader'):
                        print("\n" + "-" * 40)
                        list_videos_with_filters(search=metadata['uploader'])  # Search by uploader
        
        print("\n✅ Complete workflow test finished successfully!")
        
    except Exception as e:
        print(f"❌ Error during workflow test: {str(e)}")

def demonstrate_api_endpoints():
    """Demonstrate all available API endpoints"""
    print("\n📖 Available API Endpoints:")
    print("=" * 50)
    
    endpoints = [
        ("POST /videopage_analyze", "Analyze video URL to get available formats"),
        ("POST /videopage_metadata", "Get detailed metadata for tag selection"),
        ("POST /videopage_download", "Download video with selected format"),
        ("POST /videopage_save", "Save video with enhanced metadata"),
        ("GET /videopage_list", "List videos with search and filter options"),
        ("GET /videopage_file/{video_id}", "Serve video file by ID"),
        ("GET /video_library/{filename}", "Serve video/thumbnail files directly"),
    ]
    
    for endpoint, description in endpoints:
        print(f"  {endpoint:<35} - {description}")
    
    print("\n🔍 Query Parameters for /videopage_list:")
    params = [
        ("search", "Search in title, description, tags"),
        ("tag", "Filter by specific tag"),
        ("category", "Filter by category"),
        ("uploader", "Filter by channel/uploader"),
        ("sort_by", "Sort by: saved_at, title, view_count, like_count, duration"),
        ("order", "Order: asc, desc")
    ]
    
    for param, description in params:
        print(f"  {param:<12} - {description}")

if __name__ == "__main__":
    demonstrate_api_endpoints()
    
    print("\n" + "=" * 60)
    choice = input("Run complete workflow test? (y/n): ").strip().lower()
    if choice == 'y':
        test_complete_workflow()
    else:
        print("Test skipped. You can run individual API calls using the endpoints above.")
