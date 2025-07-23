import React, { useState, useEffect } from 'react';
import { Search, Play, Download, ExternalLink, FileVideo, Calendar, HardDrive, Grid3X3, List, Loader2 } from 'lucide-react';
import VideoCard from './VideoCard';

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

interface ApiVideo {
  id: string;
  video_url: string;
  video_page_name: string;
  original_file_name: string;
  library_file_name: string;
  file_path: string;
  file_size: number;
  saved_at: string;
  video_local_url?: string;
  video_direct_url?: string;
}

interface VideoLibraryProps {
  onPlayVideo: (video: Video) => void;
  onDownloadVideo: (video: Video) => void;
}

const VideoLibrary: React.FC<VideoLibraryProps> = ({ onPlayVideo, onDownloadVideo }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'gallery' | 'list'>('gallery');

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get file extension
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toUpperCase() || 'MP4';
  };

  // Transform API video to UI video format
  const transformApiVideo = (apiVideo: ApiVideo): Video => {
    return {
      id: apiVideo.id,
      title: apiVideo.video_page_name,
      thumbnail: `https://i.ytimg.com/vi/${apiVideo.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1] || 'default'}/hqdefault.jpg`,
      duration: 'N/A', // Duration not available in API response
      format: getFileExtension(apiVideo.library_file_name),
      fileSize: formatFileSize(apiVideo.file_size),
      downloadedAt: formatDate(apiVideo.saved_at),
      url: apiVideo.video_url,
      video_local_url: apiVideo.video_local_url,
      video_direct_url: apiVideo.video_direct_url
    };
  };

  // Fetch videos from API
  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:6800/videopage_list');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const transformedVideos = data.videos.map(transformApiVideo);
      setVideos(transformedVideos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  };

  // Fetch videos on component mount
  useEffect(() => {
    fetchVideos();
  }, []);

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Loading videos...</h3>
            <p className="text-slate-400">Fetching your video library</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <div className="bg-red-500/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="h-12 w-12 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Failed to load videos</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={fetchVideos}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Video Library</h2>
          <p className="text-slate-400">
            {videos.length} video{videos.length !== 1 ? 's' : ''} in your collection
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={fetchVideos}
            disabled={loading}
            className="bg-slate-700/50 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            title="Refresh library"
          >
            <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
          
          <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-600">
            <button
              onClick={() => setViewMode('gallery')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'gallery'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
              title="Gallery view"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
        </div>
      </div>

      {filteredVideos.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-slate-800/30 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
            <Search className="h-12 w-12 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchTerm ? 'No videos found' : 'No videos yet'}
          </h3>
          <p className="text-slate-400">
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : 'Download your first video to get started'
            }
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'gallery' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onPlay={onPlayVideo}
                  onDownload={onDownloadVideo}
                />
              ))}
            </div>
          ) : (
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center p-4 hover:bg-slate-700/30 transition-colors duration-200 border-b border-slate-700/30 last:border-b-0"
                >
                  {/* Video Icon */}
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center mr-4">
                    <FileVideo className="h-6 w-6 text-blue-400" />
                  </div>

                  {/* Video Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm mb-1 truncate">
                      {video.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-xs text-slate-400">
                      <div className="flex items-center space-x-1">
                        <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                          {video.format}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <HardDrive className="h-3 w-3" />
                        <span>{video.fileSize}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{video.downloadedAt}</span>
                      </div>
                      <span>{video.duration}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onPlayVideo(video)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors duration-200"
                      title="Play video"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDownloadVideo(video)}
                      className="p-2 bg-slate-600/50 hover:bg-slate-600/70 text-slate-300 rounded-lg transition-colors duration-200"
                      title="Download video"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => window.open(video.url, '_blank')}
                      className="p-2 bg-slate-600/50 hover:bg-slate-600/70 text-slate-300 rounded-lg transition-colors duration-200"
                      title="View original"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoLibrary;