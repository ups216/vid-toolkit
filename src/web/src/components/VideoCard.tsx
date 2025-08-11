import React, { useState } from 'react';
import { Play, Download, Calendar, FileVideo, Eye, ThumbsUp, MessageCircle, User, Tag, Check } from 'lucide-react';
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

interface VideoCardProps {
  video: Video;
  onPlay: (video: Video) => void;
  onDownload: (video: Video) => void;
  // Selection props
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (videoId: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ 
  video, 
  onPlay, 
  onDownload,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelection
}) => {
  const [imageError, setImageError] = useState(false);
  const { t } = useLanguage();

  const handleCardClick = () => {
    if (isSelectionMode && onToggleSelection) {
      onToggleSelection(video.id);
    } else {
      onPlay(video);
    }
  };

  return (
    <div 
      className={`bg-slate-800/50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border flex flex-col cursor-pointer relative ${
        isSelected 
          ? 'border-blue-500 ring-2 ring-blue-500/50' 
          : 'border-slate-700/30'
      }`}
      onClick={handleCardClick}
    >
      {/* Selection Checkbox */}
      {isSelectionMode && (
        <div className="absolute top-3 left-3 z-10">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            isSelected 
              ? 'bg-blue-500 border-blue-500' 
              : 'bg-slate-800/80 border-slate-400 hover:border-blue-400'
          }`}>
            {isSelected && <Check className="h-4 w-4 text-white" />}
          </div>
        </div>
      )}
      {/* Thumbnail Section */}
      <div className="relative aspect-video bg-slate-700 overflow-hidden">
        {!imageError && (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
        {imageError && (
          <div className="absolute inset-0 bg-slate-600 flex items-center justify-center">
            <FileVideo className="h-12 w-12 text-slate-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
          {!isSelectionMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay(video);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transform hover:scale-110 transition-all duration-200"
            >
              <Play className="h-6 w-6 ml-1" />
            </button>
          )}
        </div>
        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {isFinite(Number(video.duration)) && video.duration !== '' ? formatDuration(Number(video.duration)) : 'N/A'}
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

        {/* Category */}
        {video.category && (
          <div className="flex items-center space-x-2">
            <div className="bg-purple-600/20 text-purple-300 text-xs px-2 py-1 rounded-full border border-purple-600/30">
              {video.category}
            </div>
          </div>
        )}

        {/* Tags */}
        {video.selected_tags && video.selected_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {video.selected_tags.slice(0, 3).map((tag, index) => (
              <div
                key={index}
                className="flex items-center space-x-1 bg-slate-700/50 text-slate-300 text-xs px-2 py-1 rounded-full border border-slate-600/30"
              >
                <Tag className="h-2 w-2" />
                <span className="truncate max-w-24">{tag}</span>
              </div>
            ))}
            {video.selected_tags.length > 3 && (
              <div className="text-slate-400 text-xs px-2 py-1">
                +{video.selected_tags.length - 3} more
              </div>
            )}
          </div>
        )}

        {/* Description Preview */}
        {video.description && (
          <div className="text-slate-400 text-xs">
            <p className="line-clamp-2 leading-relaxed">
              {video.description.length > 100 
                ? `${video.description.substring(0, 100)}...` 
                : video.description
              }
            </p>
          </div>
        )}

        {/* File Info & Download */}
        <div className="mt-auto pt-3 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
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
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(video);
            }}
            className="w-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>{t('videoCard.download')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
