import React, { useState, useEffect } from 'react';
import { Search, Grid3X3, List, Filter, User, FileVideo, Trash2 } from 'lucide-react';
import VideoCard from './VideoCard';
import VideoPlayer from './VideoPlayer';

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

const LibraryPage: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedUploader, setSelectedUploader] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('saved_at');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  
  // Available filter options
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableUploaders, setAvailableUploaders] = useState<string[]>([]);

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

  // Fetch videos with filters
  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        sort_by: sortBy,
        order: sortOrder
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedUploader) params.append('uploader', selectedUploader);
      
      const response = await fetch(`http://localhost:6800/videopage_list?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const transformedVideos = data.videos.map(transformApiVideo);
      setVideos(transformedVideos);
      
      // Extract available filter options
      const categories = [...new Set(data.videos.map((v: ApiVideo) => v.category).filter(Boolean))] as string[];
      const uploaders = [...new Set(data.videos.map((v: ApiVideo) => v.uploader).filter(Boolean))] as string[];
      
      setAvailableCategories(categories.sort());
      setAvailableUploaders(uploaders.sort());
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [searchTerm, selectedCategory, selectedUploader, sortBy, sortOrder]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isSelectionMode) {
        switch (event.key) {
          case 'Escape':
            clearSelection();
            break;
          case 'a':
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              selectAllVideos();
            }
            break;
          case 'Delete':
          case 'Backspace':
            if (selectedVideos.size > 0) {
              deleteSelectedVideos();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelectionMode, selectedVideos]);  

  const handlePlayVideo = (video: Video) => {
    setSelectedVideo(video);
    setIsPlayerOpen(true);
  };

  const handleDownloadVideo = (video: Video) => {
    const downloadUrl = video.video_direct_url 
      ? `http://localhost:6800${video.video_direct_url}`
      : video.url;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${video.title}.mp4`;
    link.target = '_blank';
    link.click();
  };

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    setSelectedVideo(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedUploader('');
  };

  // Selection functions
  const toggleVideoSelection = (videoId: string) => {
    const newSelection = new Set(selectedVideos);
    if (newSelection.has(videoId)) {
      newSelection.delete(videoId);
    } else {
      newSelection.add(videoId);
    }
    setSelectedVideos(newSelection);
  };

  const selectAllVideos = () => {
    const allVideoIds = new Set(videos.map((video: Video) => video.id));
    setSelectedVideos(allVideoIds);
  };

  const clearSelection = () => {
    setSelectedVideos(new Set());
    setIsSelectionMode(false);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedVideos(new Set());
    }
  };

  // Delete functions
  const deleteSelectedVideos = async () => {
    if (selectedVideos.size === 0) return;

    // Confirmation dialog
    const confirmMessage = `Are you sure you want to delete ${selectedVideos.size} video${selectedVideos.size > 1 ? 's' : ''}? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    const videosToDelete = Array.from(selectedVideos);
    
    try {
      // Delete videos one by one
      for (const videoId of videosToDelete) {
        const response = await fetch(`http://localhost:6800/api/videos/${videoId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to delete video ${videoId}`);
        }
      }
      
      // Refresh the video list
      await fetchVideos();
      
      // Clear selection and exit selection mode
      setSelectedVideos(new Set());
      setIsSelectionMode(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete videos');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">{error}</p>
            <button 
              onClick={fetchVideos}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Video Library</h1>
            <p className="text-slate-400">
              {videos.length} video{videos.length !== 1 ? 's' : ''} in your collection
              {selectedVideos.size > 0 && ` • ${selectedVideos.size} selected`}
              {isSelectionMode && selectedVideos.size === 0 && ' • Click videos to select them'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Selection Mode Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectionMode}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isSelectionMode 
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                }`}
              >
                {isSelectionMode ? 'Exit Selection' : 'Select Videos'}
              </button>

              {/* Selection Actions (only show when in selection mode) */}
              {isSelectionMode && (
                <>
                  <button
                    onClick={selectAllVideos}
                    className="px-3 py-2 text-sm bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white rounded-lg transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-2 text-sm bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={deleteSelectedVideos}
                    disabled={selectedVideos.size === 0 || isDeleting}
                    className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      selectedVideos.size === 0 || isDeleting
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeleting ? 'Deleting...' : `Delete (${selectedVideos.size})`}
                  </button>
                </>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-200">{error}</p>
            <button 
              onClick={() => setError(null)} 
              className="mt-2 text-sm text-red-300 hover:text-red-100 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Selection Mode Help */}
        {isSelectionMode && (
          <div className="mb-4 bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
            <p className="text-blue-200 text-sm">
              <strong>Selection Mode:</strong> Click videos to select/deselect • 
              <span className="ml-2"><kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Ctrl+A</kbd> Select All</span> • 
              <span className="ml-2"><kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Delete</kbd> Delete Selected</span> • 
              <span className="ml-2"><kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Esc</kbd> Exit</span>
            </p>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-slate-800/30 rounded-xl p-6 mb-8 border border-slate-700/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">All Categories</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Uploader Filter */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <select
                value={selectedUploader}
                onChange={(e) => setSelectedUploader(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">All Uploaders</option>
                {availableUploaders.map(uploader => (
                  <option key={uploader} value={uploader}>{uploader}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="saved_at">Date Added</option>
                <option value="title">Title</option>
                <option value="view_count">Views</option>
                <option value="like_count">Likes</option>
                <option value="duration">Duration</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="desc">↓</option>
                <option value="asc">↑</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || selectedCategory || selectedUploader) && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Search: "{searchTerm}"
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Category: {selectedCategory}
                  </span>
                )}
                {selectedUploader && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                    Uploader: {selectedUploader}
                  </span>
                )}
              </div>
              <button
                onClick={clearFilters}
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Videos Grid/List */}
        {videos.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-slate-500 mb-4">
              <FileVideo className="h-16 w-16 mx-auto mb-4" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No videos found</h3>
            <p className="text-slate-400 mb-4">
              {searchTerm || selectedCategory || selectedUploader 
                ? 'Try adjusting your filters to see more results.'
                : 'Your video library is empty. Start by adding some videos!'
              }
            </p>
            {(searchTerm || selectedCategory || selectedUploader) && (
              <button
                onClick={clearFilters}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onPlay={handlePlayVideo}
                onDownload={handleDownloadVideo}
                isSelectionMode={isSelectionMode}
                isSelected={selectedVideos.has(video.id)}
                onToggleSelection={toggleVideoSelection}
              />
            ))}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      <VideoPlayer
        video={selectedVideo}
        isOpen={isPlayerOpen}
        onClose={handleClosePlayer}
        onDownload={handleDownloadVideo}
      />
    </div>
  );
};

export default LibraryPage;
