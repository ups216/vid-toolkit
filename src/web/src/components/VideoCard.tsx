import React, { useState } from 'react';
import { Play, Download, Calendar, Clock, FileVideo } from 'lucide-react';

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

interface VideoCardProps {
  video: Video;
  onPlay: (video: Video) => void;
  onDownload: (video: Video) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onPlay, onDownload }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="bg-slate-800/50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border border-slate-700/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-video bg-slate-700">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
        />
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

      <div className="p-4">
        <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 leading-tight">
          {video.title}
        </h3>
        
        <div className="flex items-center justify-between text-slate-400 text-xs mb-4">
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
          onClick={() => onDownload(video)}
          className="w-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Download</span>
        </button>
      </div>
    </div>
  );
};

export default VideoCard;