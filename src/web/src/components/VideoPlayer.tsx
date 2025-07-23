import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, ExternalLink } from 'lucide-react';
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
            <>
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
            </>
          )}
        </div>

        <div className="p-6 border-t border-slate-700">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onDownload(video)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Download className="h-5 w-5" />
              <span>{t('videoPlayer.downloadVideo')}</span>
            </button>
            <button
              onClick={() => window.open(video.url, '_blank')}
              className="flex-1 sm:flex-none bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <ExternalLink className="h-5 w-5" />
              <span>{t('videoPlayer.viewOriginal')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VideoPlayer;