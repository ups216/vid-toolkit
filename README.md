# Video Toolkit

A modern web application for video processing built with React.js, Tailwind CSS, and FastAPI.

## Project Structure

```
vid-toolkit/
├── src/
│   ├── web/          # React.js frontend with Tailwind CSS
│   └── server/       # FastAPI backend service
├── README.md
└── package.json
```

## Features

- **Video Upload**: Upload video files through a modern web interface
- **Video Conversion**: Convert videos to different formats
- **Audio Extraction**: Extract audio tracks from video files
- **Thumbnail Generation**: Generate thumbnails from video frames
- **Video Compression**: Compress videos to reduce file size

## Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- npm or yarn
- pip

## Setup Instructions

### Frontend Setup (React.js + Tailwind)

1. Navigate to the web directory:
   ```bash
   cd src/web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

### Backend Setup (FastAPI)

1. Navigate to the server directory:
   ```bash
   cd src/server
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI server:
   ```bash
   python main.py
   ```

   The API will be available at `http://localhost:8000`
   API documentation: `http://localhost:8000/docs`

## Usage

1. Start both the frontend and backend servers
2. Open your browser and navigate to `http://localhost:5173`
3. Upload a video file using the file input
4. Choose from the available processing options:
   - Convert Video
   - Extract Audio
   - Generate Thumbnail
   - Compress Video

## API Endpoints

- `POST /upload` - Upload a video file
- `POST /convert/{file_id}` - Convert video format
- `POST /extract-audio/{file_id}` - Extract audio from video
- `POST /thumbnail/{file_id}` - Generate video thumbnail
- `POST /compress/{file_id}` - Compress video file
- `GET /download/{filename}` - Download processed file

## Development

### Frontend Development

The frontend is built with:
- **React.js** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for build tooling

### Backend Development

The backend is built with:
- **FastAPI** for the web framework
- **Uvicorn** as the ASGI server
- **python-multipart** for file uploads
- **python-ffmpeg** for video processing (planned)

## TODO

- [ ] Implement actual video processing with FFmpeg
- [ ] Add progress tracking for long-running operations
- [ ] Add file format validation
- [ ] Implement user authentication
- [ ] Add batch processing capabilities
- [ ] Add video preview functionality

## License

MIT License