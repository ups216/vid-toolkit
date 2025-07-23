import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

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

interface VideoPlayerProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (video: Video) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, isOpen, onClose, onDownload }) => {
  if (!isOpen || !video) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">{video.title}</h3>
            <p className="text-slate-400 text-sm">{video.format} • {video.fileSize}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors duration-200 p-2 hover:bg-slate-800 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="aspect-video bg-black">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-6 border-t border-slate-700">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onDownload(video)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Download className="h-5 w-5" />
              <span>Download Video</span>
            </button>
            <button
              onClick={() => window.open(video.url, '_blank')}
              className="flex-1 sm:flex-none bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <ExternalLink className="h-5 w-5" />
              <span>View Original</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;