from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import shutil
from pathlib import Path
import uuid
from typing import Optional

app = FastAPI(title="Video Toolkit API", version="1.0.0")

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