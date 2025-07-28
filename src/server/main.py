from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import shutil
from pathlib import Path
import uuid
import subprocess
import json
from datetime import datetime
from typing import Optional, List, Dict
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Video Toolkit API", version="1.0.0")

# Pydantic models
class VideoPageRequest(BaseModel):
    url: str

class VideoDownloadRequest(BaseModel):
    url: str
    format_id: str

class VideoSaveRequest(BaseModel):
    video_url: str
    video_page_name: Optional[str] = None
    video_file_name: str
    # Additional metadata from analysis
    selected_tags: Optional[List[str]] = []
    description: Optional[str] = None
    category: Optional[str] = None
    # Engagement metrics
    like_count: Optional[int] = None
    dislike_count: Optional[int] = None
    comment_count: Optional[int] = None
    view_count: Optional[int] = None
    average_rating: Optional[float] = None
    # Channel info
    uploader: Optional[str] = None
    channel_id: Optional[str] = None
    channel_url: Optional[str] = None
    # Additional info
    upload_date: Optional[str] = None
    duration: Optional[float] = None
    age_limit: Optional[int] = None

class VideoFormat(BaseModel):
    format_id: str
    ext: str
    resolution: Optional[str]
    filesize: Optional[int]
    tbr: Optional[float]
    vbr: Optional[float]
    abr: Optional[float]
    format_note: Optional[str]
    quality: Optional[str]

class VideoInfo(BaseModel):
    id: str
    title: str
    url: str
    duration: Optional[float]
    thumbnail: Optional[str]
    uploader: Optional[str]
    view_count: Optional[int]
    formats: List[VideoFormat]
    # Additional metadata
    upload_date: Optional[str]
    description: Optional[str]
    tags: Optional[List[str]]
    categories: Optional[List[str]]
    like_count: Optional[int]
    dislike_count: Optional[int]
    comment_count: Optional[int]
    channel_id: Optional[str]
    channel_url: Optional[str]
    average_rating: Optional[float]
    age_limit: Optional[int]
    webpage_url_basename: Optional[str]
    extractor: Optional[str]

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow any origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
UPLOADS_DIR = Path("uploads")
UPLOADS_DIR.mkdir(exist_ok=True)

OUTPUTS_DIR = Path("outputs")
OUTPUTS_DIR.mkdir(exist_ok=True)

DOWNLOAD_TMP_DIR = Path("download_tmp")
DOWNLOAD_TMP_DIR.mkdir(parents=True, exist_ok=True)

VIDEO_LIBRARY_DIR = Path("video_library")
VIDEO_LIBRARY_DIR.mkdir(parents=True, exist_ok=True)

VIDEO_LIBRARY_DATA_FILE = VIDEO_LIBRARY_DIR / "data.json"

# Cookies file path
COOKIES_FILE = Path("cookies.txt")

@app.get("/")
async def root():
    return {"message": "Video Toolkit API is running"}

@app.post("/videopage_analyze")
async def analyze_video_page(request: VideoPageRequest):
    """Analyze a webpage URL to extract downloadable video information using yt-dlp"""
    try:
        logger.info(f"Analyzing video URL: {request.url}")
        
        # Run yt-dlp to extract video information
        cmd = [
            "yt-dlp",
            "--dump-json",
            "--no-download",
            # Use cookies from browser (more convenient) or file-based cookies
            "--cookies-from-browser", "chrome",
            "--extractor-args", "youtubetab:skip=authcheck",
            "--no-playlist",  # Only download single video, not playlist
            "--retries", "3",
            "--fragment-retries", "3",
            "--retry-sleep", "5",
            # Alternative: "--cookies", str(COOKIES_FILE),
            request.url
        ]
        
        logger.info(f"Running command: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        logger.info(f"yt-dlp return code: {result.returncode}")
        
        if result.returncode != 0:
            logger.error(f"yt-dlp stderr: {result.stderr}")
            
            # Check for specific YouTube errors
            if "Too Many Requests" in result.stderr or "429" in result.stderr:
                raise HTTPException(
                    status_code=429, 
                    detail="YouTube rate limit exceeded. Please wait a few minutes before trying again."
                )
            elif "Sign in to confirm your age" in result.stderr:
                raise HTTPException(
                    status_code=403,
                    detail="This video requires age verification. Please sign into YouTube in your browser first."
                )
            elif "Video unavailable" in result.stderr or "Private video" in result.stderr:
                raise HTTPException(
                    status_code=404,
                    detail="Video is unavailable or private."
                )
            elif "This live event will begin" in result.stderr:
                raise HTTPException(
                    status_code=400,
                    detail="This is a scheduled live stream that hasn't started yet."
                )
            else:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Failed to analyze URL: {result.stderr}"
                )
        
        # Parse the JSON output
        videos = []
        for line in result.stdout.strip().split('\n'):
            if line.strip():
                try:
                    video_data = json.loads(line)
                    
                    # Extract and filter formats
                    formats = []
                    if 'formats' in video_data:
                        for fmt in video_data['formats']:
                            # Filter for video formats with reasonable quality
                            if fmt.get('vcodec') != 'none' and fmt.get('height'):
                                height = fmt.get('height', 0)
                                if height >= 360:  # Only include 360p and above
                                    quality_map = {
                                        range(360, 480): "360p",
                                        range(480, 720): "480p", 
                                        range(720, 1080): "720p",
                                        range(1080, 1440): "1080p",
                                        range(1440, 2160): "1440p",
                                        range(2160, 4320): "4K"
                                    }
                                    quality = "Unknown"
                                    for height_range, quality_label in quality_map.items():
                                        if height in height_range:
                                            quality = quality_label
                                            break
                                    
                                    video_format = VideoFormat(
                                        format_id=fmt.get('format_id', ''),
                                        ext=fmt.get('ext', ''),
                                        resolution=fmt.get('resolution', f"{fmt.get('width', 'unknown')}x{fmt.get('height', 'unknown')}"),
                                        filesize=fmt.get('filesize'),
                                        tbr=fmt.get('tbr'),
                                        vbr=fmt.get('vbr'),
                                        abr=fmt.get('abr'),
                                        format_note=fmt.get('format_note', ''),
                                        quality=quality
                                    )
                                    formats.append(video_format)
                    
                    # Sort formats by quality (height) descending
                    formats.sort(key=lambda x: int(x.resolution.split('x')[1]) if 'x' in x.resolution and x.resolution.split('x')[1].isdigit() else 0, reverse=True)
                    
                    video_info = VideoInfo(
                        id=video_data.get('id', ''),
                        title=video_data.get('title', 'Unknown'),
                        url=video_data.get('webpage_url', video_data.get('url', '')),
                        duration=video_data.get('duration'),
                        thumbnail=video_data.get('thumbnail'),
                        uploader=video_data.get('uploader'),
                        view_count=video_data.get('view_count'),
                        formats=formats,
                        # Additional metadata
                        upload_date=video_data.get('upload_date'),
                        description=video_data.get('description'),
                        tags=video_data.get('tags'),
                        categories=video_data.get('categories'),
                        like_count=video_data.get('like_count'),
                        dislike_count=video_data.get('dislike_count'),
                        comment_count=video_data.get('comment_count'),
                        channel_id=video_data.get('channel_id'),
                        channel_url=video_data.get('channel_url'),
                        average_rating=video_data.get('average_rating'),
                        age_limit=video_data.get('age_limit'),
                        webpage_url_basename=video_data.get('webpage_url_basename'),
                        extractor=video_data.get('extractor')
                    )
                    videos.append(video_info)
                except json.JSONDecodeError:
                    continue
        
        return {
            "message": "Video page analysis completed",
            "url": request.url,
            "videos_found": len(videos),
            "videos": videos
        }
        
    except subprocess.TimeoutExpired:
        logger.error("Request timeout - URL analysis took too long")
        raise HTTPException(status_code=408, detail="Request timeout - URL analysis took too long")
    except Exception as e:
        logger.error(f"Error in analyze_video_page: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/videopage_metadata")
async def get_video_metadata_for_selection(request: VideoPageRequest):
    """Get detailed video metadata for user selection before downloading"""
    try:
        logger.info(f"Getting metadata for URL: {request.url}")
        
        # Run yt-dlp to extract video information
        cmd = [
            "yt-dlp",
            "--dump-json",
            "--no-download",
            "--cookies-from-browser", "chrome",
            "--extractor-args", "youtubetab:skip=authcheck",
            "--no-playlist",  # Only download single video, not playlist
            "--retries", "3",
            "--fragment-retries", "3",
            "--retry-sleep", "5",
            request.url
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode != 0:
            logger.error(f"yt-dlp stderr: {result.stderr}")
            
            # Check for specific YouTube errors
            if "Too Many Requests" in result.stderr or "429" in result.stderr:
                raise HTTPException(
                    status_code=429, 
                    detail="YouTube rate limit exceeded. Please wait a few minutes before trying again."
                )
            elif "Sign in to confirm your age" in result.stderr:
                raise HTTPException(
                    status_code=403,
                    detail="This video requires age verification. Please sign into YouTube in your browser first."
                )
            elif "Video unavailable" in result.stderr or "Private video" in result.stderr:
                raise HTTPException(
                    status_code=404,
                    detail="Video is unavailable or private."
                )
            else:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Failed to get metadata: {result.stderr}"
                )
        
        # Parse the JSON output
        for line in result.stdout.strip().split('\n'):
            if line.strip():
                try:
                    video_data = json.loads(line)
                    
                    # Return comprehensive metadata for user selection
                    metadata = {
                        "id": video_data.get('id', ''),
                        "title": video_data.get('title', 'Unknown'),
                        "url": video_data.get('webpage_url', video_data.get('url', '')),
                        "duration": video_data.get('duration'),
                        "thumbnail": video_data.get('thumbnail'),
                        "uploader": video_data.get('uploader'),
                        "description": video_data.get('description', ''),
                        "upload_date": video_data.get('upload_date'),
                        "extractor": video_data.get('extractor'),
                        
                        # Tags for selection
                        "available_tags": video_data.get('tags', []),
                        "categories": video_data.get('categories', []),
                        
                        # Engagement metrics
                        "view_count": video_data.get('view_count'),
                        "like_count": video_data.get('like_count'),
                        "dislike_count": video_data.get('dislike_count'),
                        "comment_count": video_data.get('comment_count'),
                        "average_rating": video_data.get('average_rating'),
                        
                        # Channel information
                        "channel_id": video_data.get('channel_id'),
                        "channel_url": video_data.get('channel_url'),
                        "age_limit": video_data.get('age_limit', 0),
                        
                        # Additional info
                        "webpage_url_basename": video_data.get('webpage_url_basename')
                    }
                    
                    return {
                        "message": "Video metadata retrieved successfully",
                        "metadata": metadata
                    }
                    
                except json.JSONDecodeError:
                    continue
        
        raise HTTPException(status_code=404, detail="No video metadata found")
        
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Timeout getting video metadata")
    except Exception as e:
        logger.error(f"Error getting video metadata: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/videopage_download")
async def download_video_from_page(request: VideoDownloadRequest):
    """Download a specific video format from a webpage URL using yt-dlp"""
    try:
        # Generate unique filename for this download
        download_id = str(uuid.uuid4())
        
        # Resolve relative path if needed
        download_tmp_dir = DOWNLOAD_TMP_DIR
        if not download_tmp_dir.is_absolute():
            download_tmp_dir = Path.cwd() / download_tmp_dir
        
        # Run yt-dlp to download the specific format with audio and thumbnail
        # Use format selection that ensures both video and audio are included
        # For Bilibili and other sites with separate video/audio streams
        # Use safe filename without video title to avoid character issues
        cmd = [
            "yt-dlp",
            "--format", f"{request.format_id}+bestaudio[ext=m4a]/best",
            "--output", str(download_tmp_dir / f"{download_id}.%(ext)s"),
            "--write-thumbnail",
            "--embed-metadata",
            "--keep-video",  # Keep video file temporarily for debugging
            # Use cookies from browser (more convenient) or file-based cookies
            "--cookies-from-browser", "chrome",
            "--extractor-args", "youtubetab:skip=authcheck",
            "--no-playlist",  # Only download single video, not playlist
            "--retries", "3",
            "--fragment-retries", "3",
            "--retry-sleep", "5",
            # Alternative: "--cookies", str(COOKIES_FILE),
            request.url
        ]
        
        logger.info(f"Running download command: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout for download
        )
        
        logger.info(f"Download result code: {result.returncode}")
        if result.stderr:
            logger.info(f"Download stderr: {result.stderr}")
        
        if result.returncode != 0:
            # Try alternative format selection if the first attempt fails
            logger.warning(f"First download attempt failed: {result.stderr}")
            
            # Fallback: Try with a simpler format selection but still ensure merging
            cmd_fallback = [
                "yt-dlp",
                "--format", f"{request.format_id}+bestaudio",
                "--output", str(download_tmp_dir / f"{download_id}.%(ext)s"),
                "--write-thumbnail",
                "--embed-metadata",
                "--cookies-from-browser", "chrome",
                "--extractor-args", "youtubetab:skip=authcheck",
                "--no-playlist",
                "--retries", "3",
                "--fragment-retries", "3",
                "--retry-sleep", "5",
                request.url
            ]
            
            logger.info(f"Running fallback command: {' '.join(cmd_fallback)}")
            
            result = subprocess.run(
                cmd_fallback,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            if result.returncode != 0:
                logger.error(f"Fallback download also failed: {result.stderr}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"Failed to download video with both attempts. Error: {result.stderr}"
                )
        
        # Find the downloaded files
        downloaded_files = list(download_tmp_dir.glob(f"{download_id}*"))
        video_files = [f for f in downloaded_files if f.suffix.lower() in ['.mp4', '.mkv', '.webm', '.avi'] and not '.f' in f.stem]
        audio_files = [f for f in downloaded_files if f.suffix.lower() in ['.m4a', '.aac', '.mp3', '.webm'] and '.f' in f.stem]
        
        logger.info(f"Downloaded files: {[f.name for f in downloaded_files]}")
        logger.info(f"Video files: {[f.name for f in video_files]}")
        logger.info(f"Audio files: {[f.name for f in audio_files]}")
        
        # Check if we have separate video and audio files that need merging
        if len(video_files) == 1 and len(audio_files) == 1:
            video_file = video_files[0]
            audio_file = audio_files[0]
            
            # Create merged filename using download_id only
            merged_filename = f"{download_id}_merged.mp4"
            merged_path = download_tmp_dir / merged_filename
            
            logger.info(f"Merging video: {video_file.name} with audio: {audio_file.name}")
            
            # Use ffmpeg to merge video and audio
            merge_cmd = [
                "ffmpeg",
                "-i", str(video_file),
                "-i", str(audio_file),
                "-c:v", "copy",
                "-c:a", "aac",
                "-shortest",  # Match the shortest stream duration
                "-y",  # Overwrite output file
                str(merged_path)
            ]
            
            merge_result = subprocess.run(
                merge_cmd,
                capture_output=True,
                text=True,
                timeout=120
            )
            
            if merge_result.returncode == 0:
                # Remove separate files and use merged file
                logger.info(f"Successfully merged video and audio. Removing separate files.")
                video_file.unlink()
                audio_file.unlink()
                downloaded_file = merged_path
            else:
                # If merging fails, use the video file (might be audio-less)
                downloaded_file = video_file
                logger.error(f"FFmpeg merge failed: {merge_result.stderr}")
                print(f"FFmpeg merge failed: {merge_result.stderr}")
        
        elif len(video_files) == 1:
            # Single video file (hopefully with audio already merged)
            downloaded_file = video_files[0]
        else:
            # Look for any non-image file, prefer mp4 files
            non_image_files = [f for f in downloaded_files if not f.name.endswith(('.jpg', '.jpeg', '.png', '.webp'))]
            if not non_image_files:
                raise HTTPException(
                    status_code=500, 
                    detail="Download completed but video file not found"
                )
            # Prefer .mp4 files
            mp4_files = [f for f in non_image_files if f.suffix.lower() == '.mp4']
            downloaded_file = mp4_files[0] if mp4_files else non_image_files[0]
        
        # Find the downloaded thumbnail file
        thumbnail_files = [f for f in downloaded_files if f.name.endswith(('.jpg', '.jpeg', '.png', '.webp'))]
        thumbnail_file = thumbnail_files[0] if thumbnail_files else None
        
        response_data = {
            "message": "Video download completed",
            "download_id": download_id,
            "filename": downloaded_file.name,
            "file_path": str(downloaded_file),
            "file_size": downloaded_file.stat().st_size,
            "url": request.url,
            "format_id": request.format_id,
            "merged": len(video_files) == 1 and len(audio_files) == 1 and downloaded_file.name.endswith('.mp4')
        }
        
        # Add thumbnail information if available
        if thumbnail_file:
            response_data["thumbnail_filename"] = thumbnail_file.name
            response_data["thumbnail_path"] = str(thumbnail_file)
            response_data["thumbnail_size"] = thumbnail_file.stat().st_size
        
        return response_data
        
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Download timeout - Video download took too long")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/videopage_save_auto")
async def save_video_to_library_auto_sync(request: VideoSaveRequest):
    """Move downloaded video to library and automatically sync all metadata from source"""
    try:
        logger.info(f"Auto-syncing and saving video: {request.video_file_name}")
        
        # Resolve relative paths if needed
        download_tmp_dir = DOWNLOAD_TMP_DIR
        if not download_tmp_dir.is_absolute():
            download_tmp_dir = Path.cwd() / download_tmp_dir
        
        video_library_dir = VIDEO_LIBRARY_DIR
        if not video_library_dir.is_absolute():
            video_library_dir = Path.cwd() / video_library_dir
        
        # Check if the source file exists in download_tmp
        source_file = download_tmp_dir / request.video_file_name
        
        # Debug: List all files in download_tmp to help with troubleshooting
        logger.info(f"Files in download_tmp: {[f.name for f in download_tmp_dir.iterdir() if f.is_file()]}")
        logger.info(f"Looking for source file: {request.video_file_name}")
        
        # If the requested file doesn't exist, try to find a merged version
        if not source_file.exists():
            # Extract download_id from filename if possible
            filename_parts = request.video_file_name.split('_', 1)
            if len(filename_parts) >= 1:
                potential_download_id = filename_parts[0]
                # Look for merged file with same download_id
                merged_file = download_tmp_dir / f"{potential_download_id}.mp4"
                if merged_file.exists():
                    source_file = merged_file
                    logger.info(f"Using merged file: {merged_file}")
        
        if not source_file.exists():
            raise HTTPException(
                status_code=404, 
                detail=f"Downloaded file '{request.video_file_name}' not found in download_tmp"
            )
        
        # Always prioritize merged .mp4 files over separate audio/video files
        source_file_stem = source_file.stem
        
        # Extract the base name (remove format suffixes like .f100046 or .f30280)
        if '.f' in source_file_stem:
            base_stem = source_file_stem.split('.f')[0]
        else:
            base_stem = source_file_stem
        
        # Look for merged .mp4 file with the same base name
        potential_merged_files = list(download_tmp_dir.glob(f"{base_stem}*.mp4"))
        
        # Filter to find the best merged file (largest .mp4 file without format suffix)
        best_merged_file = None
        largest_size = 0
        
        for potential_file in potential_merged_files:
            potential_stem = potential_file.stem
            if '.f' in potential_stem and any(char.isdigit() for char in potential_stem.split('.f')[-1]):
                continue
            
            file_size = potential_file.stat().st_size
            if file_size > largest_size:
                largest_size = file_size
                best_merged_file = potential_file
        
        # Use merged version if available and larger
        if best_merged_file and best_merged_file.stat().st_size > source_file.stat().st_size * 1.1:
            logger.info(f"Using larger merged file: {best_merged_file.name}")
            source_file = best_merged_file
        
        # Auto-sync ALL metadata from source video
        logger.info(f"Auto-syncing metadata from source video: {request.video_url}")
        video_page_name = "Unknown Video"
        auto_description = ""
        auto_category = None
        auto_tags = []
        auto_uploader = None
        auto_view_count = None
        auto_like_count = None
        auto_dislike_count = None
        auto_comment_count = None
        auto_average_rating = None
        auto_channel_id = None
        auto_channel_url = None
        auto_upload_date = None
        auto_duration = None
        auto_age_limit = None
        
        try:
            # Use yt-dlp to extract all video metadata
            cmd = [
                "yt-dlp",
                "--dump-json",
                "--no-download",
                "--cookies-from-browser", "chrome",
                "--extractor-args", "youtubetab:skip=authcheck",
                "--no-playlist",
                "--retries", "3",
                "--fragment-retries", "3",
                "--retry-sleep", "5",
                request.video_url
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0 and result.stdout.strip():
                # Parse the JSON output to get all metadata
                for line in result.stdout.strip().split('\n'):
                    if line.strip():
                        try:
                            video_data = json.loads(line)
                            
                            # Sync all metadata
                            video_page_name = video_data.get('title', 'Unknown Video')
                            auto_description = video_data.get('description', '')
                            
                            categories = video_data.get('categories', [])
                            if categories:
                                auto_category = categories[0]
                            
                            # Get tags (limit to first 15 to avoid overwhelming)
                            source_tags = video_data.get('tags', [])
                            if source_tags:
                                auto_tags = source_tags[:15]
                            
                            auto_uploader = video_data.get('uploader')
                            auto_view_count = video_data.get('view_count')
                            auto_like_count = video_data.get('like_count')
                            auto_dislike_count = video_data.get('dislike_count')
                            auto_comment_count = video_data.get('comment_count')
                            auto_average_rating = video_data.get('average_rating')
                            auto_channel_id = video_data.get('channel_id')
                            auto_channel_url = video_data.get('channel_url')
                            auto_upload_date = video_data.get('upload_date')
                            auto_duration = video_data.get('duration')
                            auto_age_limit = video_data.get('age_limit')
                            
                            logger.info(f"✅ Auto-synced metadata:")
                            logger.info(f"  📺 Title: {video_page_name}")
                            logger.info(f"  📝 Description: {len(auto_description)} chars")
                            logger.info(f"  📂 Category: {auto_category}")
                            logger.info(f"  🏷️ Tags: {len(auto_tags)} tags")
                            logger.info(f"  👤 Uploader: {auto_uploader}")
                            logger.info(f"  👀 Views: {auto_view_count}")
                            
                            break
                        except json.JSONDecodeError:
                            continue
                            
            logger.info("Successfully auto-synced all metadata from source video")
        except Exception as e:
            logger.error(f"Error auto-syncing metadata: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to auto-sync metadata from source video: {str(e)}"
            )
        
        # Generate video ID and move file
        video_id = str(uuid.uuid4())
        file_extension = source_file.suffix
        library_filename = f"{video_id}{file_extension}"
        destination_file = video_library_dir / library_filename
        source_file.rename(destination_file)
        
        # Handle thumbnail (same logic as before)
        thumbnail_destination = None
        thumbnail_filename = None
        
        # Extract download_id from the source file name to find matching thumbnail
        source_file_stem = source_file.stem
        potential_download_ids = []
        
        if '_merged' in source_file_stem:
            base_id = source_file_stem.replace('_merged', '')
            potential_download_ids.append(base_id)
        
        if not '.' in source_file_stem or source_file_stem.count('.') == 0:
            potential_download_ids.append(source_file_stem)
        
        if '.f' in source_file_stem:
            base_id = source_file_stem.split('.f')[0]
            potential_download_ids.append(base_id)
        
        # Search for thumbnail files
        for download_id in potential_download_ids:
            for thumb_ext in ['.webp', '.jpg', '.jpeg', '.png']:
                potential_thumb = download_tmp_dir / f"{download_id}{thumb_ext}"
                if potential_thumb.exists():
                    thumbnail_filename = f"{video_id}{thumb_ext}"
                    thumbnail_destination = video_library_dir / thumbnail_filename
                    potential_thumb.rename(thumbnail_destination)
                    logger.info(f"Found and moved thumbnail: {potential_thumb.name} -> {thumbnail_filename}")
                    break
            if thumbnail_destination:
                break
        
        # Load existing library data
        video_data = []
        video_library_data_file = VIDEO_LIBRARY_DATA_FILE
        if not video_library_data_file.is_absolute():
            video_library_data_file = Path.cwd() / video_library_data_file
        
        if video_library_data_file.exists():
            with open(video_library_data_file, 'r', encoding='utf-8') as f:
                video_data = json.load(f)
        
        # Create new entry with auto-synced metadata
        new_entry = {
            "id": video_id,
            "video_url": request.video_url,
            "video_page_name": video_page_name,
            "original_file_name": request.video_file_name,
            "library_file_name": library_filename,
            "file_path": str(destination_file.relative_to(Path.cwd())),
            "file_size": destination_file.stat().st_size,
            "video_local_url": f"/videopage_file/{video_id}",
            "video_direct_url": f"/video_library/{library_filename}",
            "saved_at": datetime.now().isoformat(),
            # Auto-synced metadata
            "selected_tags": auto_tags,
            "description": auto_description,
            "category": auto_category,
            # Auto-synced engagement metrics
            "like_count": auto_like_count,
            "dislike_count": auto_dislike_count,
            "comment_count": auto_comment_count,
            "view_count": auto_view_count,
            "average_rating": auto_average_rating,
            # Auto-synced channel information
            "uploader": auto_uploader,
            "channel_id": auto_channel_id,
            "channel_url": auto_channel_url,
            # Auto-synced additional metadata
            "upload_date": auto_upload_date,
            "duration": auto_duration,
            "age_limit": auto_age_limit,
            "extractor": "auto-synced"
        }
        
        # Add thumbnail information if available
        if thumbnail_destination and thumbnail_filename:
            new_entry["thumbnail_filename"] = thumbnail_filename
            new_entry["thumbnail_path"] = str(thumbnail_destination.relative_to(Path.cwd()))
            new_entry["thumbnail_url"] = f"/video_library/{thumbnail_filename}"
        
        video_data.append(new_entry)
        
        # Save updated data
        with open(video_library_data_file, 'w', encoding='utf-8') as f:
            json.dump(video_data, f, indent=2, ensure_ascii=False)
        
        response_data = {
            "message": "Video saved to library with auto-synced metadata",
            "video_id": new_entry["id"],
            "library_file_name": library_filename,
            "file_path": str(destination_file.relative_to(Path.cwd())),
            "file_size": new_entry["file_size"],
            "video_local_url": new_entry["video_local_url"],
            "video_direct_url": new_entry["video_direct_url"],
            "total_videos_in_library": len(video_data),
            # Show what was auto-synced
            "auto_synced_metadata": {
                "title": video_page_name,
                "description_length": len(auto_description) if auto_description else 0,
                "category": auto_category,
                "tags_count": len(auto_tags),
                "uploader": auto_uploader,
                "view_count": auto_view_count,
                "like_count": auto_like_count,
                "upload_date": auto_upload_date
            }
        }
        
        # Add thumbnail information to response if available
        if thumbnail_destination and thumbnail_filename:
            response_data["thumbnail_filename"] = thumbnail_filename
            response_data["thumbnail_path"] = str(thumbnail_destination.relative_to(Path.cwd()))
            response_data["thumbnail_url"] = f"/video_library/{thumbnail_filename}"
        
        return response_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/videopage_save")
async def save_video_to_library(request: VideoSaveRequest):
    """Move downloaded video to video library and update metadata"""
    try:
        # Resolve relative paths if needed
        download_tmp_dir = DOWNLOAD_TMP_DIR
        if not download_tmp_dir.is_absolute():
            download_tmp_dir = Path.cwd() / download_tmp_dir
        
        video_library_dir = VIDEO_LIBRARY_DIR
        if not video_library_dir.is_absolute():
            video_library_dir = Path.cwd() / video_library_dir
        
        # Check if the source file exists in download_tmp
        source_file = download_tmp_dir / request.video_file_name
        
        # Debug: List all files in download_tmp to help with troubleshooting
        logger.info(f"Files in download_tmp: {[f.name for f in download_tmp_dir.iterdir() if f.is_file()]}")
        logger.info(f"Looking for source file: {request.video_file_name}")
        
        # If the requested file doesn't exist, try to find a merged version
        if not source_file.exists():
            # Extract download_id from filename if possible
            filename_parts = request.video_file_name.split('_', 1)
            if len(filename_parts) >= 1:
                potential_download_id = filename_parts[0]
                # Look for merged file with same download_id
                merged_file = download_tmp_dir / f"{potential_download_id}.mp4"
                if merged_file.exists():
                    source_file = merged_file
                    print(f"Using merged file: {merged_file}")
        
        if not source_file.exists():
            raise HTTPException(
                status_code=404, 
                detail=f"Downloaded file '{request.video_file_name}' not found in download_tmp"
            )
        
        # Always prioritize merged .mp4 files over separate audio/video files
        original_source_file = source_file
        source_file_stem = source_file.stem
        
        # Extract the base name (remove format suffixes like .f100046 or .f30280)
        if '.f' in source_file_stem:
            base_stem = source_file_stem.split('.f')[0]
        else:
            # Handle cases where the file might not have format suffix
            base_stem = source_file_stem
        
        # Look for merged .mp4 file with the same base name
        potential_merged_files = list(download_tmp_dir.glob(f"{base_stem}*.mp4"))
        
        # Filter to find the best merged file (largest .mp4 file without format suffix)
        best_merged_file = None
        largest_size = 0
        
        for potential_file in potential_merged_files:
            # Skip files with format suffixes (like .f100046.mp4) - look for clean merged files
            potential_stem = potential_file.stem
            if '.f' in potential_stem and any(char.isdigit() for char in potential_stem.split('.f')[-1]):
                continue
            
            file_size = potential_file.stat().st_size
            if file_size > largest_size:
                largest_size = file_size
                best_merged_file = potential_file
        
        # If user selected an audio file (.m4a), force them to use the merged .mp4 version
        if source_file.suffix.lower() == '.m4a':
            if best_merged_file:
                print(f"Audio file detected. Using merged file: {best_merged_file.name} ({best_merged_file.stat().st_size} bytes) instead of {source_file.name} ({source_file.stat().st_size} bytes)")
                source_file = best_merged_file
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Audio file selected but no merged .mp4 file found. Please ensure the video has been properly downloaded and merged first."
                )
        # For video files, use merged version if it's significantly larger (indicating it has audio)
        elif best_merged_file and best_merged_file.stat().st_size > source_file.stat().st_size * 1.1:  # At least 10% larger
            print(f"Using larger merged file: {best_merged_file.name} ({best_merged_file.stat().st_size} bytes) instead of {source_file.name} ({source_file.stat().st_size} bytes)")
            source_file = best_merged_file
        
        # Extract video title and metadata if not provided
        video_page_name = request.video_page_name
        auto_description = request.description
        auto_category = request.category
        auto_tags = request.selected_tags or []
        auto_uploader = request.uploader
        auto_view_count = request.view_count
        auto_like_count = request.like_count
        auto_dislike_count = request.dislike_count
        auto_comment_count = request.comment_count
        auto_average_rating = request.average_rating
        auto_channel_id = request.channel_id
        auto_channel_url = request.channel_url
        auto_upload_date = request.upload_date
        auto_duration = request.duration
        auto_age_limit = request.age_limit
        
        # If key metadata is missing, fetch it from the source video
        if not video_page_name or not auto_description or not auto_category or not auto_uploader:
            try:
                logger.info(f"Fetching missing metadata from source video: {request.video_url}")
                # Use yt-dlp to extract video metadata
                cmd = [
                    "yt-dlp",
                    "--dump-json",
                    "--no-download",
                    "--cookies-from-browser", "chrome",
                    "--extractor-args", "youtubetab:skip=authcheck",
                    "--no-playlist",
                    "--retries", "3",
                    "--fragment-retries", "3",
                    "--retry-sleep", "5",
                    request.video_url
                ]
                
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                if result.returncode == 0 and result.stdout.strip():
                    # Parse the JSON output to get the metadata
                    for line in result.stdout.strip().split('\n'):
                        if line.strip():
                            try:
                                video_data = json.loads(line)
                                
                                # Sync title if not provided
                                if not video_page_name:
                                    extracted_title = video_data.get('title', 'Unknown Video')
                                    if (extracted_title.startswith('youtube video #') or 
                                        extracted_title == 'Unknown Video' or 
                                        len(extracted_title.strip()) < 3):
                                        video_id_from_data = video_data.get('id', '')
                                        if video_id_from_data:
                                            video_page_name = f"Video_{video_id_from_data}"
                                        else:
                                            video_page_name = "Unknown Video"
                                    else:
                                        video_page_name = extracted_title
                                
                                # Sync description if not provided
                                if not auto_description:
                                    auto_description = video_data.get('description', '')
                                    logger.info(f"Synced description: {auto_description[:100]}...")
                                
                                # Sync category if not provided
                                if not auto_category:
                                    categories = video_data.get('categories', [])
                                    if categories:
                                        auto_category = categories[0]  # Take first category
                                        logger.info(f"Synced category: {auto_category}")
                                
                                # Sync other metadata if not provided
                                if not auto_uploader:
                                    auto_uploader = video_data.get('uploader')
                                    logger.info(f"Synced uploader: {auto_uploader}")
                                
                                if not auto_view_count:
                                    auto_view_count = video_data.get('view_count')
                                
                                if not auto_like_count:
                                    auto_like_count = video_data.get('like_count')
                                
                                if not auto_dislike_count:
                                    auto_dislike_count = video_data.get('dislike_count')
                                
                                if not auto_comment_count:
                                    auto_comment_count = video_data.get('comment_count')
                                
                                if not auto_average_rating:
                                    auto_average_rating = video_data.get('average_rating')
                                
                                if not auto_channel_id:
                                    auto_channel_id = video_data.get('channel_id')
                                
                                if not auto_channel_url:
                                    auto_channel_url = video_data.get('channel_url')
                                
                                if not auto_upload_date:
                                    auto_upload_date = video_data.get('upload_date')
                                
                                if not auto_duration:
                                    auto_duration = video_data.get('duration')
                                
                                if not auto_age_limit:
                                    auto_age_limit = video_data.get('age_limit')
                                
                                # Sync tags if user didn't select any
                                if not auto_tags:
                                    source_tags = video_data.get('tags', [])
                                    if source_tags:
                                        # Take first 10 tags to avoid overwhelming
                                        auto_tags = source_tags[:10]
                                        logger.info(f"Synced {len(auto_tags)} tags from source video")
                                
                                break
                            except json.JSONDecodeError:
                                continue
                    
                    if not video_page_name:
                        video_page_name = "Unknown Video"
                        
                    logger.info("Successfully synced metadata from source video")
                else:
                    logger.warning("Failed to fetch source video metadata, using provided values")
                    if not video_page_name:
                        video_page_name = "Unknown Video"
            except Exception as e:
                logger.error(f"Error fetching source video metadata: {str(e)}")
                if not video_page_name:
                    video_page_name = "Unknown Video"
        
        # Generate video ID first
        video_id = str(uuid.uuid4())
        
        # Generate a safe filename for the library using only video ID
        file_extension = source_file.suffix
        library_filename = f"{video_id}{file_extension}"
        
        # Move video file to video library
        destination_file = video_library_dir / library_filename
        source_file.rename(destination_file)
        
        # Look for and move thumbnail file if it exists
        thumbnail_destination = None
        thumbnail_filename = None
        
        # Extract download_id from the source file name to find matching thumbnail
        source_file_stem = source_file.stem  # filename without extension
        
        # Try different patterns to find the thumbnail
        potential_download_ids = []
        
        # Pattern 1: Direct download_id (e.g., "abc123_merged" -> "abc123")
        if '_merged' in source_file_stem:
            base_id = source_file_stem.replace('_merged', '')
            potential_download_ids.append(base_id)
        
        # Pattern 2: Direct download_id (e.g., "abc123.mp4" -> "abc123")
        if not '.' in source_file_stem or source_file_stem.count('.') == 0:
            potential_download_ids.append(source_file_stem)
        
        # Pattern 3: Download_id with format suffix (e.g., "abc123.f401" -> "abc123")
        if '.f' in source_file_stem:
            base_id = source_file_stem.split('.f')[0]
            potential_download_ids.append(base_id)
        
        # Pattern 4: Try the original requested filename's stem
        if request.video_file_name != source_file.name:
            original_stem = Path(request.video_file_name).stem
            if '.f' in original_stem:
                base_id = original_stem.split('.f')[0]
                potential_download_ids.append(base_id)
            else:
                potential_download_ids.append(original_stem)
        
        logger.info(f"Searching for thumbnails with IDs: {potential_download_ids}")
        
        # Search for thumbnail files with matching patterns
        for download_id in potential_download_ids:
            logger.info(f"Checking for thumbnail with ID: {download_id}")
            for thumb_ext in ['.webp', '.jpg', '.jpeg', '.png']:
                # Try exact match first
                potential_thumb = download_tmp_dir / f"{download_id}{thumb_ext}"
                logger.info(f"Checking: {potential_thumb}")
                if potential_thumb.exists():
                    thumbnail_filename = f"{video_id}{thumb_ext}"
                    thumbnail_destination = video_library_dir / thumbnail_filename
                    potential_thumb.rename(thumbnail_destination)
                    logger.info(f"Found and moved thumbnail: {potential_thumb.name} -> {thumbnail_filename}")
                    break
            
            if thumbnail_destination:
                break
        
        # If still no thumbnail found, do a broader search
        if not thumbnail_destination:
            logger.info("No thumbnail found with exact patterns, doing broader search...")
            # Look for any thumbnail files that might match
            all_thumbs = list(download_tmp_dir.glob("*.webp")) + \
                        list(download_tmp_dir.glob("*.jpg")) + \
                        list(download_tmp_dir.glob("*.jpeg")) + \
                        list(download_tmp_dir.glob("*.png"))
            
            logger.info(f"All thumbnails in download_tmp: {[t.name for t in all_thumbs]}")
            
            for potential_thumb in all_thumbs:
                # Check if this thumbnail might belong to our download
                thumb_stem = potential_thumb.stem
                for download_id in potential_download_ids:
                    if download_id in thumb_stem:
                        thumbnail_filename = f"{video_id}{potential_thumb.suffix}"
                        thumbnail_destination = video_library_dir / thumbnail_filename
                        potential_thumb.rename(thumbnail_destination)
                        logger.info(f"Found matching thumbnail in broader search: {potential_thumb.name} -> {thumbnail_filename}")
                        break
                if thumbnail_destination:
                    break
        
        # Load existing data or create new
        video_data = []
        video_library_data_file = VIDEO_LIBRARY_DATA_FILE
        if not video_library_data_file.is_absolute():
            video_library_data_file = Path.cwd() / video_library_data_file
        
        if video_library_data_file.exists():
            with open(video_library_data_file, 'r', encoding='utf-8') as f:
                video_data = json.load(f)
        
        # Add new video entry (store relative paths for portability)
        new_entry = {
            "id": video_id,
            "video_url": request.video_url,
            "video_page_name": video_page_name,
            "original_file_name": request.video_file_name,
            "library_file_name": library_filename,
            "file_path": str(destination_file.relative_to(Path.cwd())),
            "file_size": destination_file.stat().st_size,
            "video_local_url": f"/videopage_file/{video_id}",
            "video_direct_url": f"/video_library/{library_filename}",
            "saved_at": datetime.now().isoformat(),
            # Enhanced metadata (synced from source video)
            "selected_tags": auto_tags,
            "description": auto_description,
            "category": auto_category,
            # Engagement metrics (synced from source video)
            "like_count": auto_like_count,
            "dislike_count": auto_dislike_count,
            "comment_count": auto_comment_count,
            "view_count": auto_view_count,
            "average_rating": auto_average_rating,
            # Channel information (synced from source video)
            "uploader": auto_uploader,
            "channel_id": auto_channel_id,
            "channel_url": auto_channel_url,
            # Additional metadata (synced from source video)
            "upload_date": auto_upload_date,
            "duration": auto_duration,
            "age_limit": auto_age_limit,
            "extractor": None  # Will be filled if available
        }
        
        # Add thumbnail information if available
        if thumbnail_destination and thumbnail_filename:
            new_entry["thumbnail_filename"] = thumbnail_filename
            new_entry["thumbnail_path"] = str(thumbnail_destination.relative_to(Path.cwd()))
            new_entry["thumbnail_url"] = f"/video_library/{thumbnail_filename}"
        
        video_data.append(new_entry)
        
        # Save updated data
        with open(video_library_data_file, 'w', encoding='utf-8') as f:
            json.dump(video_data, f, indent=2, ensure_ascii=False)
        
        response_data = {
            "message": "Video saved to library successfully",
            "video_id": new_entry["id"],
            "library_file_name": library_filename,
            "file_path": str(destination_file.relative_to(Path.cwd())),
            "file_size": new_entry["file_size"],
            "video_local_url": new_entry["video_local_url"],
            "video_direct_url": new_entry["video_direct_url"],
            "total_videos_in_library": len(video_data)
        }
        
        # Add thumbnail information to response if available
        if thumbnail_destination and thumbnail_filename:
            response_data["thumbnail_filename"] = thumbnail_filename
            response_data["thumbnail_path"] = str(thumbnail_destination.relative_to(Path.cwd()))
            response_data["thumbnail_url"] = f"/video_library/{thumbnail_filename}"
        
        return response_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/videopage_list")
async def list_saved_videos(
    search: Optional[str] = None,
    tag: Optional[str] = None,
    category: Optional[str] = None,
    uploader: Optional[str] = None,
    sort_by: Optional[str] = "saved_at",  # saved_at, title, view_count, like_count, duration
    order: Optional[str] = "desc"  # asc, desc
):
    """Get list of all saved videos from the library with search and filter options"""
    try:
        # Resolve relative path if needed
        video_library_data_file = VIDEO_LIBRARY_DATA_FILE
        if not video_library_data_file.is_absolute():
            video_library_data_file = Path.cwd() / video_library_data_file
        
        # Check if data file exists
        if not video_library_data_file.exists():
            return {
                "message": "No videos in library",
                "total_videos": 0,
                "videos": [],
                "filters_applied": {
                    "search": search,
                    "tag": tag,
                    "category": category,
                    "uploader": uploader,
                    "sort_by": sort_by,
                    "order": order
                }
            }
        
        # Load video data
        with open(video_library_data_file, 'r', encoding='utf-8') as f:
            video_data = json.load(f)
        
        # Apply filters
        filtered_videos = video_data.copy()
        
        # Search filter (title, description, tags)
        if search:
            search_lower = search.lower()
            filtered_videos = [
                video for video in filtered_videos
                if (search_lower in video.get('video_page_name', '').lower() or
                    search_lower in video.get('description', '').lower() or
                    any(search_lower in tag.lower() for tag in video.get('selected_tags', [])))
            ]
        
        # Tag filter
        if tag:
            filtered_videos = [
                video for video in filtered_videos
                if tag in video.get('selected_tags', [])
            ]
        
        # Category filter
        if category:
            filtered_videos = [
                video for video in filtered_videos
                if video.get('category') == category
            ]
        
        # Uploader filter
        if uploader:
            filtered_videos = [
                video for video in filtered_videos
                if video.get('uploader') == uploader
            ]
        
        # Sort videos
        reverse_order = order == "desc"
        if sort_by == "title":
            filtered_videos.sort(key=lambda x: x.get('video_page_name', '').lower(), reverse=reverse_order)
        elif sort_by == "view_count":
            filtered_videos.sort(key=lambda x: x.get('view_count', 0) or 0, reverse=reverse_order)
        elif sort_by == "like_count":
            filtered_videos.sort(key=lambda x: x.get('like_count', 0) or 0, reverse=reverse_order)
        elif sort_by == "duration":
            filtered_videos.sort(key=lambda x: x.get('duration', 0) or 0, reverse=reverse_order)
        else:  # default: saved_at
            filtered_videos.sort(key=lambda x: x.get('saved_at', ''), reverse=reverse_order)
        
        # Get unique values for filter options
        all_tags = set()
        all_categories = set()
        all_uploaders = set()
        
        for video in video_data:
            all_tags.update(video.get('selected_tags', []))
            if video.get('category'):
                all_categories.add(video.get('category'))
            if video.get('uploader'):
                all_uploaders.add(video.get('uploader'))
        
        return {
            "message": "Video library loaded successfully",
            "total_videos": len(video_data),
            "filtered_videos": len(filtered_videos),
            "videos": filtered_videos,
            "filters_applied": {
                "search": search,
                "tag": tag,
                "category": category,
                "uploader": uploader,
                "sort_by": sort_by,
                "order": order
            },
            "available_filters": {
                "tags": sorted(list(all_tags)),
                "categories": sorted(list(all_categories)),
                "uploaders": sorted(list(all_uploaders))
            }
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid video library data file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/videopage_file/{video_id}")
@app.head("/videopage_file/{video_id}")
async def get_video_file(video_id: str):
    """Serve a video file from the library by video ID"""
    try:
        # Resolve relative path if needed
        video_library_data_file = VIDEO_LIBRARY_DATA_FILE
        if not video_library_data_file.is_absolute():
            video_library_data_file = Path.cwd() / video_library_data_file
        
        # Check if data file exists
        if not video_library_data_file.exists():
            raise HTTPException(status_code=404, detail="Video library not found")
        
        # Load video data
        with open(video_library_data_file, 'r', encoding='utf-8') as f:
            video_data = json.load(f)
        
        # Find the video by ID
        video_entry = None
        for video in video_data:
            if video.get('id') == video_id:
                video_entry = video
                break
        
        if not video_entry:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Check if the file exists (resolve relative path)
        file_path = Path(video_entry['file_path'])
        if not file_path.is_absolute():
            file_path = Path.cwd() / file_path
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Video file not found on disk")
        
        # Return the video file
        return FileResponse(
            path=file_path,
            filename=video_entry['library_file_name'],
            media_type='video/mp4'
        )
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid video library data file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/video_library/{filename}")
@app.head("/video_library/{filename}")
async def serve_video_library_file(filename: str):
    """Serve video files and images directly from the video library folder"""
    # Resolve relative path if needed
    library_dir = VIDEO_LIBRARY_DIR
    if not library_dir.is_absolute():
        library_dir = Path.cwd() / library_dir
    
    file_path = library_dir / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine media type based on file extension
    file_extension = file_path.suffix.lower()
    
    # Video files
    if file_extension == ".mp4":
        media_type = "video/mp4"
    elif file_extension == ".webm":
        media_type = "video/webm"
    elif file_extension == ".avi":
        media_type = "video/x-msvideo"
    elif file_extension == ".mov":
        media_type = "video/quicktime"
    elif file_extension == ".mkv":
        media_type = "video/x-matroska"
    # Image files (thumbnails)
    elif file_extension in [".jpg", ".jpeg"]:
        media_type = "image/jpeg"
    elif file_extension == ".png":
        media_type = "image/png"
    elif file_extension == ".webp":
        media_type = "image/webp"
    else:
        media_type = "application/octet-stream"  # Default for unknown types
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=media_type
    )

@app.get("/download/{filename}")
async def download_file(filename: str):
    """Download processed file"""
    # Resolve relative path if needed
    outputs_dir = OUTPUTS_DIR
    if not outputs_dir.is_absolute():
        outputs_dir = Path.cwd() / outputs_dir
    
    file_path = outputs_dir / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/octet-stream'
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=6800)