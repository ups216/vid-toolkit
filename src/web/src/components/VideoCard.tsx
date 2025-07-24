import React, { useState } from 'react';
import { Play, Download, Calendar, Clock, FileVideo } from 'lucide-react';
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

interface VideoCardProps {
  video: Video;
  onPlay: (video: Video) => void;
  onDownload: (video: Video) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onPlay, onDownload }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { t } = useLanguage();

  return (
    <div
      className="bg-slate-800/50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border border-slate-700/30 h-80 flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-48 bg-slate-700 overflow-hidden">
        {!imageError && (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover block"
            style={{ minHeight: '192px', maxHeight: '192px' }}
            onError={() => {
              setImageError(true);
            }}
          />
        )}
        {/* Fallback background when image fails to load */}
        {imageError && (
          <div className="absolute inset-0 bg-slate-600 flex items-center justify-center">
            <FileVideo className="h-12 w-12 text-slate-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onPlay(video)}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transform hover:scale-110 transition-all duration-200"
          >
            <Play className="h-6 w-6 ml-1" />
          </button>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {video.duration}
        </div>
        <div className="absolute top-2 left-2 bg-blue-500/90 text-white text-xs px-2 py-1 rounded-full">
          {video.format}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-white font-semibold text-sm mb-2 leading-tight h-10 overflow-hidden">
          <span className="line-clamp-2">
            {video.title}
          </span>
        </h3>
        
        <div className="flex items-center justify-between text-slate-400 text-xs mb-4 flex-1">
          <div className="flex items-center space-x-3">
            {video.video_url && (
              <div className="flex items-center space-x-1">
                <span className="bg-indigo-500/90 text-white text-xs px-1.5 py-0.5 rounded">
                  {getVideoSource(video.video_url)}
                </span>
              </div>
            )}
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

        <div className="mt-auto">
          <button
            onClick={() => onDownload(video)}
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
