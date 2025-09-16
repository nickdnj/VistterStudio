import { useState, useEffect } from 'react';
import { Upload, Image, Video, Music, FileText, Trash2, Search, Filter, Plus, X } from 'lucide-react';
import axios from 'axios';

const AssetManager = ({ isOpen, onClose, onSelectAsset }) => {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchAssets();
    }
  }, [isOpen, selectedCategory]);

  const fetchAssets = async () => {
    try {
      const params = selectedCategory !== 'all' ? { category: selectedCategory } : {};
      const response = await axios.get('http://localhost:8080/api/assets', { params });
      setAssets(response.data.assets || []);
      setCategories(response.data.categories || {});
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        await axios.post('http://localhost:8080/api/assets/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        });
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
    fetchAssets();
  };

  const handleDelete = async (assetId) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      await axios.delete(`http://localhost:8080/api/assets/${assetId}`);
      fetchAssets();
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  const filteredAssets = assets.filter(asset =>
    asset.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.tags && asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (mimetype.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (mimetype.startsWith('audio/')) return <Music className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark rounded-lg w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Asset Manager</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex space-x-4">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-800 text-white rounded px-3 py-2 border border-gray-600"
            >
              <option value="all">All Assets ({Object.values(categories).reduce((a, b) => a + b, 0)})</option>
              <option value="images">Images ({categories.images || 0})</option>
              <option value="videos">Videos ({categories.videos || 0})</option>
              <option value="audio">Audio ({categories.audio || 0})</option>
              <option value="documents">Documents ({categories.documents || 0})</option>
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 text-white rounded pl-10 pr-4 py-2 border border-gray-600 w-64"
              />
            </div>
          </div>

          {/* Upload Button */}
          <label className="btn-primary flex items-center space-x-2 cursor-pointer">
            <Upload className="h-4 w-4" />
            <span>Upload Files</span>
            <input
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.txt,.md"
            />
          </label>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-4">
              <span className="text-white">Uploading...</span>
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span className="text-white">{uploadProgress}%</span>
            </div>
          </div>
        )}

        {/* Asset Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Upload className="h-16 w-16 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No assets found</h3>
              <p>Upload some files to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors cursor-pointer group"
                  onClick={() => onSelectAsset && onSelectAsset(asset)}
                >
                  {/* Preview */}
                  <div className="aspect-square bg-gray-900 flex items-center justify-center relative">
                    {asset.mimetype.startsWith('image/') ? (
                      <img
                        src={`http://localhost:8080${asset.url}`}
                        alt={asset.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : asset.mimetype.startsWith('video/') ? (
                      <div className="relative w-full h-full">
                        <video
                          src={`http://localhost:8080${asset.url}`}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <Video className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400">
                        {getFileIcon(asset.mimetype)}
                      </div>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(asset.id);
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h4 className="text-white text-sm font-medium truncate" title={asset.originalName}>
                      {asset.originalName}
                    </h4>
                    <p className="text-gray-400 text-xs mt-1">
                      {formatFileSize(asset.size)}
                    </p>
                    <div className="flex items-center mt-2">
                      <div className="text-gray-400 mr-2">
                        {getFileIcon(asset.mimetype)}
                      </div>
                      <span className="text-xs text-gray-500 uppercase">
                        {asset.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetManager;
