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

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
UPLOADS_DIR = Path("uploads")
UPLOADS_DIR.mkdir(exist_ok=True)

OUTPUTS_DIR = Path("outputs")
OUTPUTS_DIR.mkdir(exist_ok=True)

DOWNLOAD_TMP_DIR = Path("/data/leixu/source/vid-toolkit/src/server/download_tmp")
DOWNLOAD_TMP_DIR.mkdir(parents=True, exist_ok=True)

VIDEO_LIBRARY_DIR = Path("/data/leixu/source/vid-toolkit/src/server/video_library")
VIDEO_LIBRARY_DIR.mkdir(parents=True, exist_ok=True)

VIDEO_LIBRARY_DATA_FILE = VIDEO_LIBRARY_DIR / "data.json"

@app.get("/")
async def root():
    return {"message": "Video Toolkit API is running"}

@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    """Upload a video file"""
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    file_extension = Path(file.filename).suffix
    filename = f"{file_id}{file_extension}"
    file_path = UPLOADS_DIR / filename
    
    # Save uploaded file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {
        "file_id": file_id,
        "filename": filename,
        "original_name": file.filename,
        "size": file_path.stat().st_size
    }

@app.post("/convert/{file_id}")
async def convert_video(file_id: str, output_format: str = "mp4"):
    """Convert video to different format"""
    # Find the uploaded file
    input_files = list(UPLOADS_DIR.glob(f"{file_id}.*"))
    if not input_files:
        raise HTTPException(status_code=404, detail="File not found")
    
    input_file = input_files[0]
    output_filename = f"{file_id}_converted.{output_format}"
    output_path = OUTPUTS_DIR / output_filename
    
    # TODO: Implement actual video conversion using ffmpeg
    # For now, just copy the file as a placeholder
    shutil.copy2(input_file, output_path)
    
    return {
        "message": "Video conversion completed",
        "output_file": output_filename,
        "download_url": f"/download/{output_filename}"
    }

@app.post("/extract-audio/{file_id}")
async def extract_audio(file_id: str, output_format: str = "mp3"):
    """Extract audio from video"""
    input_files = list(UPLOADS_DIR.glob(f"{file_id}.*"))
    if not input_files:
        raise HTTPException(status_code=404, detail="File not found")
    
    output_filename = f"{file_id}_audio.{output_format}"
    output_path = OUTPUTS_DIR / output_filename
    
    # TODO: Implement actual audio extraction using ffmpeg
    # For now, create a placeholder file
    output_path.touch()
    
    return {
        "message": "Audio extraction completed",
        "output_file": output_filename,
        "download_url": f"/download/{output_filename}"
    }

@app.post("/thumbnail/{file_id}")
async def generate_thumbnail(file_id: str, timestamp: float = 1.0):
    """Generate thumbnail from video"""
    input_files = list(UPLOADS_DIR.glob(f"{file_id}.*"))
    if not input_files:
        raise HTTPException(status_code=404, detail="File not found")
    
    output_filename = f"{file_id}_thumbnail.jpg"
    output_path = OUTPUTS_DIR / output_filename
    
    # TODO: Implement actual thumbnail generation using ffmpeg
    # For now, create a placeholder file
    output_path.touch()
    
    return {
        "message": "Thumbnail generation completed",
        "output_file": output_filename,
        "download_url": f"/download/{output_filename}"
    }

@app.post("/compress/{file_id}")
async def compress_video(file_id: str, quality: str = "medium"):
    """Compress video file"""
    input_files = list(UPLOADS_DIR.glob(f"{file_id}.*"))
    if not input_files:
        raise HTTPException(status_code=404, detail="File not found")
    
    input_file = input_files[0]
    output_filename = f"{file_id}_compressed{input_file.suffix}"
    output_path = OUTPUTS_DIR / output_filename
    
    # TODO: Implement actual video compression using ffmpeg
    # For now, just copy the file as a placeholder
    shutil.copy2(input_file, output_path)
    
    return {
        "message": "Video compression completed",
        "output_file": output_filename,
        "download_url": f"/download/{output_filename}"
    }

@app.post("/videopage_analyze")
async def analyze_video_page(request: VideoPageRequest):
    """Analyze a webpage URL to extract downloadable video information using yt-dlp"""
    try:
        # Run yt-dlp to extract video information
        cmd = [
            "yt-dlp",
            "--dump-json",
            "--no-download",
            "--cookies", "/home/azureuser/source/cookies.txt",
            request.url
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode != 0:
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
                        formats=formats
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
        raise HTTPException(status_code=408, detail="Request timeout - URL analysis took too long")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/videopage_download")
async def download_video_from_page(request: VideoDownloadRequest):
    """Download a specific video format from a webpage URL using yt-dlp"""
    try:
        # Generate unique filename for this download
        download_id = str(uuid.uuid4())
        
        # Run yt-dlp to download the specific format
        cmd = [
            "yt-dlp",
            "--format", request.format_id,
            "--output", str(DOWNLOAD_TMP_DIR / f"{download_id}.%(ext)s"),
            "--cookies", "/home/azureuser/source/cookies.txt",
            request.url
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout for download
        )
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Failed to download video: {result.stderr}"
            )
        
        # Find the downloaded file
        downloaded_files = list(DOWNLOAD_TMP_DIR.glob(f"{download_id}.*"))
        if not downloaded_files:
            raise HTTPException(
                status_code=500, 
                detail="Download completed but file not found"
            )
        
        downloaded_file = downloaded_files[0]
        
        return {
            "message": "Video download completed",
            "download_id": download_id,
            "filename": downloaded_file.name,
            "file_path": str(downloaded_file),
            "file_size": downloaded_file.stat().st_size,
            "url": request.url,
            "format_id": request.format_id
        }
        
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Download timeout - Video download took too long")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/videopage_save")
async def save_video_to_library(request: VideoSaveRequest):
    """Move downloaded video to video library and update metadata"""
    try:
        # Check if the source file exists in download_tmp
        source_file = DOWNLOAD_TMP_DIR / request.video_file_name
        if not source_file.exists():
            raise HTTPException(
                status_code=404, 
                detail=f"Downloaded file '{request.video_file_name}' not found in download_tmp"
            )
        
        # Extract video title if not provided
        video_page_name = request.video_page_name
        if not video_page_name:
            try:
                # Use yt-dlp to extract video title using dump-json
                cmd = [
                    "yt-dlp",
                    "--dump-json",
                    "--no-download",
                    "--cookies", "/home/azureuser/source/cookies.txt",
                    request.video_url
                ]
                
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                if result.returncode == 0 and result.stdout.strip():
                    # Parse the JSON output to get the title
                    for line in result.stdout.strip().split('\n'):
                        if line.strip():
                            try:
                                video_data = json.loads(line)
                                extracted_title = video_data.get('title', 'Unknown Video')
                                
                                # Check if title is generic (contains "youtube video #" or similar patterns)
                                if (extracted_title.startswith('youtube video #') or 
                                    extracted_title == 'Unknown Video' or 
                                    len(extracted_title.strip()) < 3):
                                    # Try to extract video ID from URL for a better fallback
                                    video_id = video_data.get('id', '')
                                    if video_id:
                                        video_page_name = f"Video_{video_id}"
                                    else:
                                        video_page_name = "Unknown Video"
                                else:
                                    video_page_name = extracted_title
                                break
                            except json.JSONDecodeError:
                                continue
                    if not video_page_name:
                        video_page_name = "Unknown Video"
                else:
                    video_page_name = "Unknown Video"
            except Exception:
                video_page_name = "Unknown Video"
        
        # Generate a clean filename for the library
        file_extension = source_file.suffix
        clean_name = "".join(c for c in video_page_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        clean_name = clean_name.replace(' ', '_')
        library_filename = f"{clean_name}_{str(uuid.uuid4())[:8]}{file_extension}"
        
        # Move file to video library
        destination_file = VIDEO_LIBRARY_DIR / library_filename
        source_file.rename(destination_file)
        
        # Load existing data or create new
        video_data = []
        if VIDEO_LIBRARY_DATA_FILE.exists():
            with open(VIDEO_LIBRARY_DATA_FILE, 'r', encoding='utf-8') as f:
                video_data = json.load(f)
        
        # Add new video entry
        new_entry = {
            "id": str(uuid.uuid4()),
            "video_url": request.video_url,
            "video_page_name": video_page_name,
            "original_file_name": request.video_file_name,
            "library_file_name": library_filename,
            "file_path": str(destination_file),
            "file_size": destination_file.stat().st_size,
            "saved_at": datetime.now().isoformat(),
        }
        
        video_data.append(new_entry)
        
        # Save updated data
        with open(VIDEO_LIBRARY_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(video_data, f, indent=2, ensure_ascii=False)
        
        return {
            "message": "Video saved to library successfully",
            "video_id": new_entry["id"],
            "library_file_name": library_filename,
            "file_path": str(destination_file),
            "file_size": new_entry["file_size"],
            "total_videos_in_library": len(video_data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/videopage_list")
async def list_saved_videos():
    """Get list of all saved videos from the library"""
    try:
        # Check if data file exists
        if not VIDEO_LIBRARY_DATA_FILE.exists():
            return {
                "message": "No videos in library",
                "total_videos": 0,
                "videos": []
            }
        
        # Load and return video data
        with open(VIDEO_LIBRARY_DATA_FILE, 'r', encoding='utf-8') as f:
            video_data = json.load(f)
        
        return {
            "message": "Video library loaded successfully",
            "total_videos": len(video_data),
            "videos": video_data
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid video library data file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/videopage_file/{video_id}")
async def get_video_file(video_id: str):
    """Serve a video file from the library by video ID"""
    try:
        # Check if data file exists
        if not VIDEO_LIBRARY_DATA_FILE.exists():
            raise HTTPException(status_code=404, detail="Video library not found")
        
        # Load video data
        with open(VIDEO_LIBRARY_DATA_FILE, 'r', encoding='utf-8') as f:
            video_data = json.load(f)
        
        # Find the video by ID
        video_entry = None
        for video in video_data:
            if video.get('id') == video_id:
                video_entry = video
                break
        
        if not video_entry:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Check if the file exists
        file_path = Path(video_entry['file_path'])
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

@app.get("/download/{filename}")
async def download_file(filename: str):
    """Download processed file"""
    file_path = OUTPUTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/octet-stream'
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)