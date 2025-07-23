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
}

function App() {
  const [videos, setVideos] = useState<Video[]>([
    {
      id: '1',
      title: 'Amazing Nature Documentary - Wildlife in 4K',
      thumbnail: 'https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg?auto=compress&cs=tinysrgb&w=500',
      duration: '15:42',
      format: '1080p',
      fileSize: '245 MB',
      downloadedAt: '2 hours ago',
      url: 'https://example.com/video1'
    },
    {
      id: '2',
      title: 'Coding Tutorial: React Hooks Explained',
      thumbnail: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=500',
      duration: '23:15',
      format: '720p',
      fileSize: '187 MB',
      downloadedAt: '1 day ago',
      url: 'https://example.com/video2'
    },
    {
      id: '3',
      title: 'Beautiful Sunset Timelapse',
      thumbnail: 'https://images.pexels.com/photos/158163/clouds-cloudporn-weather-lookup-158163.jpeg?auto=compress&cs=tinysrgb&w=500',
      duration: '5:30',
      format: '4K',
      fileSize: '892 MB',
      downloadedAt: '3 days ago',
      url: 'https://example.com/video3'
    },
    {
      id: '4',
      title: 'Music Performance - Live Concert',
      thumbnail: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=500',
      duration: '45:18',
      format: '1080p',
      fileSize: '1.2 GB',
      downloadedAt: '1 week ago',
      url: 'https://example.com/video4'
    }
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const handleVideoSubmit = async (url: string, format: string) => {
    setIsProcessing(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create a new video entry
    const newVideo: Video = {
      id: Date.now().toString(),
      title: `Downloaded Video - ${format}`,
      thumbnail: 'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=500',
      duration: '12:34',
      format: format,
      fileSize: format === '4K' ? '750 MB' : format === '1080p' ? '320 MB' : '180 MB',
      downloadedAt: 'Just now',
      url: url
    };

    setVideos(prevVideos => [newVideo, ...prevVideos]);
    setIsProcessing(false);
  };

  const handlePlayVideo = (video: Video) => {
    setSelectedVideo(video);
    setIsPlayerOpen(true);
  };

  const handleDownloadVideo = (video: Video) => {
    // Simulate download
    const link = document.createElement('a');
    link.href = video.thumbnail; // In a real app, this would be the video file
    link.download = `${video.title}.mp4`;
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
            videos={videos}
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