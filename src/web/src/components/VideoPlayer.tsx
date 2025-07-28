import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, ExternalLink, Eye, ThumbsUp, MessageCircle, User, Calendar, Tag } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

function formatNumber(num?: number): string {
  if (!num) return '0';
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
  return `${(num / 1000000000).toFixed(1)}B`;
}

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  // Handle YYYYMMDD format from YouTube
  if (dateString.length === 8) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    const date = new Date(`${year}-${month}-${day}`);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  return dateString;
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

interface VideoPlayerProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (video: Video) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, isOpen, onClose, onDownload }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { t } = useLanguage();

  // Reset video state when modal opens/closes
  useEffect(() => {
    if (isOpen && video) {
      setIsPlaying(false);
      setHasError(false);
      setIsLoading(true);
    }
  }, [isOpen, video]);

  // Cleanup when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };
  }, [isOpen]);

  if (!isOpen || !video) return null;

  const handleVideoLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  return createPortal(
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-white mb-2 leading-tight">{video.title}</h3>
            <div className="flex items-center space-x-4 text-slate-400 text-sm">
              {video.uploader && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{video.uploader}</span>
                </div>
              )}
              {video.upload_date && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(video.upload_date)}</span>
                </div>
              )}
              <span className="text-slate-500">•</span>
              <span>{video.format} • {video.fileSize}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors duration-200 p-2 hover:bg-slate-800 rounded-lg ml-4"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Video Player */}
        <div className="aspect-video bg-black relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          )}
          {hasError ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-white">
              <div className="text-red-500 mb-4">
                <X className="h-16 w-16" />
              </div>
              <p className="text-lg mb-2">{t('videoPlayer.failedToLoad')}</p>
              <p className="text-slate-400 text-sm text-center px-4">
                {t('videoPlayer.formatNotSupported')}
              </p>
            </div>
          ) : (
            <video
              ref={videoRef}
              src={video.video_local_url ? `http://localhost:6800${video.video_local_url}` : video.url}
              poster={video.thumbnail_url}
              controls
              className="w-full h-full"
              preload="metadata"
              onLoadedData={handleVideoLoad}
              onError={handleVideoError}
              onPlay={handlePlay}
              onPause={handlePause}
            >
              {t('videoPlayer.browserNotSupported')}
            </video>
          )}
        </div>

        {/* Metadata Section */}
        <div className="flex h-64 overflow-hidden">
          {/* Left Side - Description and Details */}
          <div className="flex-1 p-6 border-r border-slate-700 overflow-y-auto">
            {/* Engagement Metrics */}
            <div className="flex items-center space-x-6 mb-4 text-slate-300">
              {video.view_count && (
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-blue-400" />
                  <span className="font-medium">{formatNumber(video.view_count)}</span>
                  <span className="text-slate-400 text-sm">views</span>
                </div>
              )}
              {video.like_count && (
                <div className="flex items-center space-x-2">
                  <ThumbsUp className="h-4 w-4 text-green-400" />
                  <span className="font-medium">{formatNumber(video.like_count)}</span>
                </div>
              )}
              {video.comment_count && (
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4 text-yellow-400" />
                  <span className="font-medium">{formatNumber(video.comment_count)}</span>
                </div>
              )}
            </div>

            {/* Category */}
            {video.category && (
              <div className="mb-4">
                <div className="inline-flex items-center space-x-2 bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full border border-purple-600/30">
                  <Tag className="h-3 w-3" />
                  <span className="text-sm font-medium">{video.category}</span>
                </div>
              </div>
            )}

            {/* Description */}
            {video.description && (
              <div className="mb-4">
                <h4 className="text-white font-medium mb-2">Description</h4>
                <div className="text-slate-300 text-sm leading-relaxed max-h-32 overflow-y-auto bg-slate-800/30 p-3 rounded-lg">
                  {video.description.split('\n').map((line, index) => (
                    <p key={index} className="mb-1">{line}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Tags and Actions */}
          <div className="w-80 p-6 overflow-y-auto">
            {/* Tags */}
            {video.selected_tags && video.selected_tags.length > 0 && (
              <div className="mb-6">
                <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                  <Tag className="h-4 w-4" />
                  <span>Tags</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {video.selected_tags.map((tag, index) => (
                    <div
                      key={index}
                      className="bg-slate-700/50 text-slate-300 text-xs px-3 py-1 rounded-full border border-slate-600/30 hover:bg-slate-600/50 transition-colors"
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Channel Info */}
            {video.channel_url && (
              <div className="mb-6">
                <h4 className="text-white font-medium mb-3">Channel</h4>
                <button
                  onClick={() => window.open(video.channel_url, '_blank')}
                  className="w-full bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 text-sm py-2 px-3 rounded-lg transition-colors border border-slate-600/30 flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Visit Channel</span>
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => onDownload(video)}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Download className="h-5 w-5" />
                <span>{t('videoPlayer.downloadVideo')}</span>
              </button>
              <button
                onClick={() => window.open(video.url, '_blank')}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <ExternalLink className="h-5 w-5" />
                <span>{t('videoPlayer.viewOriginal')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VideoPlayer;