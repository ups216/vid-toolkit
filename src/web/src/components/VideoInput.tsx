import React, { useState } from 'react';
import { Download, Globe, ChevronDown } from 'lucide-react';

interface VideoInputProps {
  onSubmit: (url: string, format: string) => void;
  isProcessing: boolean;
}

const VideoInput: React.FC<VideoInputProps> = ({ onSubmit, isProcessing }) => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('1080p');
  const [showFormats, setShowFormats] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(false);

  const formats = [
    { value: '2160p', label: '4K (2160p)', size: 'Largest file' },
    { value: '1440p', label: '2K (1440p)', size: 'Large file' },
    { value: '1080p', label: 'Full HD (1080p)', size: 'Recommended' },
    { value: '720p', label: 'HD (720p)', size: 'Smaller file' },
    { value: '480p', label: 'SD (480p)', size: 'Smallest file' },
  ];

  const validateUrl = (urlString: string) => {
    try {
      const url = new URL(urlString);
      // Check for common video platforms
      const validDomains = [
        'youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com',
        'twitch.tv', 'facebook.com', 'instagram.com', 'tiktok.com'
      ];
      return validDomains.some(domain => url.hostname.includes(domain));
    } catch {
      return false;
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setIsValidUrl(validateUrl(newUrl));
    if (!validateUrl(newUrl)) {
      setShowFormats(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && isValidUrl) {
      onSubmit(url.trim(), format);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-700/50">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Download Any Video</h2>
        <p className="text-slate-400">Paste a video URL and choose your preferred quality</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-slate-300 mb-2">
            Video URL
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="url"
              id="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
            {url && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isValidUrl ? (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                ) : (
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </div>
            )}
          </div>
          {url && !isValidUrl && (
            <p className="text-red-400 text-sm mt-2">
              Please enter a valid video URL from supported platforms (YouTube, Vimeo, etc.)
            </p>
          )}
        </div>

        {isValidUrl && (
        <div className="animate-in slide-in-from-top-2 duration-300">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Video Quality
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFormats(!showFormats)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white hover:bg-slate-700/70 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            >
              <span>{formats.find(f => f.value === format)?.label}</span>
              <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${showFormats ? 'rotate-180' : ''}`} />
            </button>
            
            {showFormats && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-10">
                {formats.map((formatOption) => (
                  <button
                    key={formatOption.value}
                    type="button"
                    onClick={() => {
                      setFormat(formatOption.value);
                      setShowFormats(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-slate-700/50 first:rounded-t-lg last:rounded-b-lg transition-colors duration-150"
                  >
                    <div className="text-white">{formatOption.label}</div>
                    <div className="text-slate-400 text-sm">{formatOption.size}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        <button
          type="submit"
          disabled={isProcessing || !url.trim() || !isValidUrl}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              <span>Download Video</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default VideoInput;