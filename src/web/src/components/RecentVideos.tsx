import React, { useState, useEffect } from 'react';
import { Eye, ThumbsUp, MessageCircle, User, FileVideo, Calendar, Play } from 'lucide-react';

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
  // Enhanced metadata
  description?: string;
  category?: string;
  selected_tags?: string[];
  uploader?: string;
  view_count?: number;
  like_count?: number;
  dislike_count?: number;
  comment_count?: number;
  average_rating?: number;
  channel_id?: string;
  channel_url?: string;
  upload_date?: string;
  age_limit?: number;
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
  // Enhanced metadata from backend
  description?: string;
  category?: string;
  selected_tags?: string[];
  uploader?: string;
  view_count?: number;
  like_count?: number;
  dislike_count?: number;
  comment_count?: number;
  average_rating?: number;
  channel_id?: string;
  channel_url?: string;
  upload_date?: string;
  duration?: number;
  age_limit?: number;
}

interface RecentVideosProps {
  onPlayVideo: (video: Video) => void;
}

function formatNumber(num?: number): string {
  if (!num) return '0';
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
  return `${(num / 1000000000).toFixed(1)}B`;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return 'N/A';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toUpperCase() || 'MP4';
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

const RecentVideos: React.FC<RecentVideosProps> = ({ onPlayVideo }) => {
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transform API video to UI video format
  const transformApiVideo = (apiVideo: ApiVideo): Video => {
    return {
      id: apiVideo.id,
      title: apiVideo.video_page_name,
      thumbnail_url: `http://localhost:6800${apiVideo.thumbnail_url}`,
      duration: apiVideo.duration ? formatDuration(apiVideo.duration) : 'N/A',
      format: getFileExtension(apiVideo.library_file_name),
      fileSize: formatFileSize(apiVideo.file_size),
      downloadedAt: formatDate(apiVideo.saved_at),
      url: apiVideo.video_url,
      video_local_url: apiVideo.video_local_url,
      video_direct_url: apiVideo.video_direct_url,
      video_url: apiVideo.video_url,
      // Enhanced metadata
      description: apiVideo.description,
      category: apiVideo.category,
      selected_tags: apiVideo.selected_tags,
      uploader: apiVideo.uploader,
      view_count: apiVideo.view_count,
      like_count: apiVideo.like_count,
      dislike_count: apiVideo.dislike_count,
      comment_count: apiVideo.comment_count,
      average_rating: apiVideo.average_rating,
      channel_id: apiVideo.channel_id,
      channel_url: apiVideo.channel_url,
      upload_date: apiVideo.upload_date,
      age_limit: apiVideo.age_limit
    };
  };

  // Fetch recent videos from API
  const fetchRecentVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:6800/videopage_list?sort_by=saved_at&order=desc');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Get only the 3 most recent videos
      const recentVideosData = data.videos.slice(0, 3).map(transformApiVideo);
      setRecentVideos(recentVideosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentVideos();
  }, []);

  if (loading) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Recent Videos</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Recent Videos</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-slate-400">{error}</p>
        </div>
      </section>
    );
  }

  if (recentVideos.length === 0) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Recent Videos</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-slate-400">No videos in your library yet. Start by adding a video above!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">Recent Videos</h2>
        <a 
          href="#library" 
          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          onClick={(e) => {
            e.preventDefault();
            document.querySelector('#library')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          View All →
        </a>
      </div>

      {/* Card Layout for Large Screens */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        {recentVideos.map((video) => (
          <div 
            key={video.id}
            className="bg-slate-800/50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border border-slate-700/30 flex flex-col cursor-pointer"
            onClick={() => onPlayVideo(video)}
          >
            {/* Thumbnail Section */}
            <div className="relative aspect-video bg-slate-700 overflow-hidden">
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.querySelector('.fallback')?.classList.remove('hidden');
                }}
              />
              <div className="fallback hidden absolute inset-0 bg-slate-600 flex items-center justify-center">
                <FileVideo className="h-12 w-12 text-slate-400" />
              </div>
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                <div className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transform hover:scale-110 transition-all duration-200">
                  <Play className="h-6 w-6 ml-1" />
                </div>
              </div>
              {/* Duration Badge */}
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                {video.duration}
              </div>
              {/* Format Badge */}
              <div className="absolute top-2 left-2 bg-blue-500/90 text-white text-xs px-2 py-1 rounded-full">
                {video.format}
              </div>
              {/* Source Badge */}
              {video.video_url && (
                <div className="absolute top-2 right-2 bg-indigo-500/90 text-white text-xs px-2 py-1 rounded">
                  {getVideoSource(video.video_url)}
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-4 flex-1 flex flex-col space-y-3">
              {/* Title */}
              <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                {video.title}
              </h3>

              {/* Channel/Uploader Info */}
              {video.uploader && (
                <div className="flex items-center space-x-2 text-slate-300">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-sm truncate">{video.uploader}</span>
                </div>
              )}

              {/* Engagement Metrics */}
              <div className="flex items-center space-x-4 text-slate-400 text-xs">
                {video.view_count && (
                  <div className="flex items-center space-x-1">
                    <Eye className="h-3 w-3" />
                    <span>{formatNumber(video.view_count)} views</span>
                  </div>
                )}
                {video.like_count && (
                  <div className="flex items-center space-x-1">
                    <ThumbsUp className="h-3 w-3" />
                    <span>{formatNumber(video.like_count)}</span>
                  </div>
                )}
                {video.comment_count && (
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-3 w-3" />
                    <span>{formatNumber(video.comment_count)}</span>
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex items-center justify-between text-slate-400 text-xs mt-auto pt-2 border-t border-slate-700/50">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <FileVideo className="h-3 w-3" />
                    <span>{video.fileSize}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{video.downloadedAt}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* List Layout for Small Screens */}
      <div className="lg:hidden space-y-4">
        {recentVideos.map((video) => (
          <div 
            key={video.id}
            className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30 hover:bg-slate-800/70 transition-all duration-200 cursor-pointer"
            onClick={() => onPlayVideo(video)}
          >
            <div className="flex space-x-4">
              {/* Thumbnail */}
              <div className="relative w-24 h-16 bg-slate-700 rounded-md overflow-hidden flex-shrink-0">
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.querySelector('.fallback')?.classList.remove('hidden');
                  }}
                />
                <div className="fallback hidden absolute inset-0 bg-slate-600 flex items-center justify-center">
                  <FileVideo className="h-6 w-6 text-slate-400" />
                </div>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Play className="h-4 w-4 text-white" />
                </div>
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                  {video.duration}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium text-sm line-clamp-2 mb-2">
                  {video.title}
                </h3>
                
                {video.uploader && (
                  <div className="flex items-center space-x-1 mb-2">
                    <User className="h-3 w-3 text-slate-400" />
                    <span className="text-slate-400 text-xs truncate">{video.uploader}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <div className="flex items-center space-x-3">
                    {video.view_count && (
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{formatNumber(video.view_count)}</span>
                      </div>
                    )}
                    {video.like_count && (
                      <div className="flex items-center space-x-1">
                        <ThumbsUp className="h-3 w-3" />
                        <span>{formatNumber(video.like_count)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{video.downloadedAt}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentVideos;
