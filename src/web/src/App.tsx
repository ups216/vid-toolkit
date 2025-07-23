import React, { useState } from 'react';
import Header from './components/Header';
import VideoInput from './components/VideoInput';
import VideoLibrary from './components/VideoLibrary';
import VideoPlayer from './components/VideoPlayer';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  format: string;
  fileSize: string;
  downloadedAt: string;
  url: string;
  video_local_url?: string;
  video_direct_url?: string;
}

function App() {

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const handleVideoSubmit = async (url: string, format: string) => {
    setIsProcessing(true);
    
    // TODO: Implement actual video download logic
    // This would call the /videopage_analyze, /videopage_download, and /videopage_save endpoints
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsProcessing(false);
  };

  const handlePlayVideo = (video: Video) => {
    setSelectedVideo(video);
    setIsPlayerOpen(true);
  };

  const handleDownloadVideo = (video: Video) => {
    // Use video_direct_url for local downloads if available, otherwise fallback to original URL
    const downloadUrl = video.video_direct_url 
      ? `http://localhost:6800${video.video_direct_url}`
      : video.url;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${video.title}.mp4`;
    link.target = '_blank'; // Open in new tab for external URLs
    link.click();
  };

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    setSelectedVideo(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Hero Section with Input */}
        <section className="text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
              Download Videos with
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent"> Ease</span>
            </h1>
            <p className="text-xl text-slate-400 mb-8">
              Simply paste any video URL and download in your preferred quality. 
              Fast, reliable, and completely free.
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <VideoInput onSubmit={handleVideoSubmit} isProcessing={isProcessing} />
          </div>
        </section>

        {/* Video Library */}
        <section>
          <VideoLibrary
            onPlayVideo={handlePlayVideo}
            onDownloadVideo={handleDownloadVideo}
          />
        </section>
      </main>

      {/* Video Player Modal */}
      <VideoPlayer
        video={selectedVideo}
        isOpen={isPlayerOpen}
        onClose={handleClosePlayer}
        onDownload={handleDownloadVideo}
      />

      {/* Footer */}
      <footer className="bg-slate-900/50 border-t border-slate-700/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-slate-400">
              © 2025 VideoFlow. Built with React, Vite, and Tailwind CSS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;