import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Search, Play, Download, ExternalLink, Calendar, HardDrive, Grid3X3, List, Loader2 } from 'lucide-react';
import VideoCard from './VideoCard';
import { useLanguage } from '../contexts/LanguageContext';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  duration: string;
  format: string;
  fileSize: string;
  downloadedAt: string;
  url: string;
  video_local_url?: string;
  video_direct_url?: string;
  video_url?: string;
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
  thumbnail_url?: string;
}

function getVideoSource(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'YouTube';
  } else if (url.includes('bilibili.com')) {
    return 'Bilibili';
  } else if (url.includes('x.com') || url.includes('twitter.com')) {
    return 'X';
  }
  return 'Unknown';
}

interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  duration: string;
  format: string;
  fileSize: string;
  downloadedAt: string;
  url: string;
  video_local_url?: string;
  video_direct_url?: string;
  video_url?: string;
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
  thumbnail_url?: string;
}

interface VideoLibraryProps {
  onPlayVideo: (video: Video) => void;
  onDownloadVideo: (video: Video) => void;
}

interface VideoLibraryRef {
  refreshVideos: () => void;
}

const VideoLibrary = forwardRef<VideoLibraryRef, VideoLibraryProps>(({ onPlayVideo, onDownloadVideo }, ref) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'gallery' | 'list'>('gallery');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const { t } = useLanguage();

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
      thumbnail_url: `http://localhost:6800${apiVideo.thumbnail_url}`,
      duration: 'N/A', // Duration not available in API response
      format: getFileExtension(apiVideo.library_file_name),
      fileSize: formatFileSize(apiVideo.file_size),
      downloadedAt: formatDate(apiVideo.saved_at),
      url: apiVideo.video_url,
      video_local_url: apiVideo.video_local_url,
      video_direct_url: apiVideo.video_direct_url,
      video_url: apiVideo.video_url
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

  // Expose refresh function to parent component
  useImperativeHandle(ref, () => ({
    refreshVideos: fetchVideos
  }));

  // Fetch videos on component mount
  useEffect(() => {
    fetchVideos();
  }, []);

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort filtered videos by date
  const sortedVideos = [...filteredVideos].sort((a, b) => {
    const dateA = new Date(a.downloadedAt).getTime();
    const dateB = new Date(b.downloadedAt).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">{t('videoLibrary.loadingVideos')}</h3>
            <p className="text-slate-400">{t('videoLibrary.fetchingLibrary')}</p>
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
          <h3 className="text-xl font-semibold text-white mb-2">{t('videoLibrary.failedToLoad')}</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={fetchVideos}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            {t('videoLibrary.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{t('videoLibrary.title')}</h2>
          <p className="text-slate-400">
            {videos.length} {videos.length === 1 ? t('videoLibrary.videosInCollection') : t('videoLibrary.videosInCollectionPlural')} {t('videoLibrary.inYourCollection')}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={fetchVideos}
            disabled={loading}
            className="bg-slate-700/50 hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            title={t('videoLibrary.refreshLibrary')}
          >
            <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm">{t('videoLibrary.refresh')}</span>
          </button>
          {/* Sort Order Dropdown */}
          <div className="relative">
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="bg-slate-800/50 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Sort by date"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
          
          <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-600">
            <button
              onClick={() => setViewMode('gallery')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'gallery'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
              title={t('videoLibrary.galleryView')}
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
              title={t('videoLibrary.listView')}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('videoLibrary.searchPlaceholder')}
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
            {searchTerm ? t('videoLibrary.noVideosFound') : t('videoLibrary.noVideosYet')}
          </h3>
          <p className="text-slate-400">
            {searchTerm 
              ? t('videoLibrary.adjustSearchTerms') 
              : t('videoLibrary.downloadFirstVideo')
            }
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'gallery' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedVideos.map((video) => (
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
              {sortedVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center p-4 hover:bg-slate-700/30 transition-colors duration-200 border-b border-slate-700/30 last:border-b-0"
                >
                  {/* Video Thumbnail */}
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-700/50 rounded-lg overflow-hidden mr-4">
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></div>';
                        }
                      }}
                    />
                  </div>

                  {/* Video Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm mb-1 truncate">
                      {video.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-xs text-slate-400">
                      {video.video_url && (
                        <div className="flex items-center space-x-1">
                          <span className="bg-indigo-500/90 text-white text-xs px-1.5 py-0.5 rounded">
                            {getVideoSource(video.video_url)}
                          </span>
                        </div>
                      )}
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
                      title={t('videoLibrary.playVideo')}
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDownloadVideo(video)}
                      className="p-2 bg-slate-600/50 hover:bg-slate-600/70 text-slate-300 rounded-lg transition-colors duration-200"
                      title={t('videoLibrary.downloadVideo')}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => window.open(video.url, '_blank')}
                      className="p-2 bg-slate-600/50 hover:bg-slate-600/70 text-slate-300 rounded-lg transition-colors duration-200"
                      title={t('videoLibrary.viewOriginal')}
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
});

VideoLibrary.displayName = 'VideoLibrary';

export default VideoLibrary;
