import { useState, useEffect } from 'react';
import { Camera, Plus, Edit3, Trash2, Save, X, AlertCircle, CheckCircle, Wifi } from 'lucide-react';
import axios from 'axios';

const SourcesManager = ({ className = '' }) => {
  const [sources, setSources] = useState({
    wyzeCameras: {},
    rtmpCameras: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    rtmpUrl: '',
    username: '',
    password: '',
    description: ''
  });

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:18080/api/sources');
      setSources(response.data);
    } catch (error) {
      console.error('Error fetching camera sources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      rtmpUrl: '',
      username: '',
      password: '',
      description: ''
    });
    setEditingCamera(null);
    setShowAddForm(false);
  };

  const handleAddCamera = () => {
    resetForm();
    setShowAddForm(true);
  };

  const handleEditCamera = (camera) => {
    setFormData({
      name: camera.name,
      rtmpUrl: camera.rtmpUrl,
      username: camera.username || '',
      password: camera.password || '',
      description: camera.description || ''
    });
    setEditingCamera(camera);
    setShowAddForm(true);
  };

  const handleSaveCamera = async () => {
    try {
      if (!formData.name.trim() || !formData.rtmpUrl.trim()) {
        alert('Name and RTMP URL are required');
        return;
      }

      if (editingCamera) {
        // Update existing camera
        await axios.put(`http://localhost:18080/api/sources/rtmp/${editingCamera.id}`, formData);
      } else {
        // Add new camera
        await axios.post('http://localhost:18080/api/sources/rtmp', formData);
      }

      await fetchSources();
      resetForm();
    } catch (error) {
      console.error('Error saving RTMP camera:', error);
      alert(`Failed to save camera: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteCamera = async (camera) => {
    if (!confirm(`Are you sure you want to delete "${camera.name}"?`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:18080/api/sources/rtmp/${camera.id}`);
      await fetchSources();
    } catch (error) {
      console.error('Error deleting RTMP camera:', error);
      alert(`Failed to delete camera: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleToggleCamera = async (camera) => {
    try {
      await axios.put(`http://localhost:18080/api/sources/rtmp/${camera.id}`, {
        ...camera,
        enabled: !camera.enabled
      });
      await fetchSources();
    } catch (error) {
      console.error('Error toggling RTMP camera:', error);
      alert(`Failed to toggle camera: ${error.response?.data?.message || error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-medium text-white">Camera Sources</h3>
        <button
          onClick={handleAddCamera}
          className="flex items-center space-x-2 px-3 py-1 bg-primary hover:bg-blue-600 text-white text-sm rounded transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add RTMP</span>
        </button>
      </div>

      {/* Wyze Cameras Section */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <h4 className="text-sm font-medium text-gray-300">Wyze Cameras</h4>
          <span className="text-xs text-gray-500">({Object.keys(sources.wyzeCameras).length})</span>
        </div>
        
        <div className="space-y-2">
          {Object.entries(sources.wyzeCameras).map(([cameraId, camera]) => (
            <div
              key={cameraId}
              className="p-3 bg-gray-800 rounded border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${camera.enabled ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <div>
                    <h5 className="text-white text-sm font-medium">{camera.nickname}</h5>
                    <p className="text-gray-400 text-xs">{camera.product_model} • {camera.name_uri}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs px-2 py-1 bg-blue-900 text-blue-300 rounded">WYZE</span>
                  <div className={`w-2 h-2 rounded-full ${camera.connected ? 'bg-green-500' : 'bg-yellow-500'}`} 
                       title={camera.connected ? 'Connected' : 'Connecting'}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RTMP Cameras Section */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <h4 className="text-sm font-medium text-gray-300">RTMP Cameras</h4>
          <span className="text-xs text-gray-500">({sources.rtmpCameras.length})</span>
        </div>
        
        <div className="space-y-2">
          {sources.rtmpCameras.map((camera) => (
            <div
              key={camera.id}
              className="p-3 bg-gray-800 rounded border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${camera.enabled ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <div>
                    <h5 className="text-white text-sm font-medium">{camera.name}</h5>
                    <p className="text-gray-400 text-xs font-mono">{camera.rtmpUrl}</p>
                    {camera.description && (
                      <p className="text-gray-500 text-xs">{camera.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs px-2 py-1 bg-green-900 text-green-300 rounded">RTMP</span>
                  <button
                    onClick={() => handleToggleCamera(camera)}
                    className={`p-1 rounded ${camera.enabled ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-400'}`}
                    title={camera.enabled ? 'Disable camera' : 'Enable camera'}
                  >
                    {camera.enabled ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleEditCamera(camera)}
                    className="p-1 text-gray-400 hover:text-white rounded"
                    title="Edit camera"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCamera(camera)}
                    className="p-1 text-red-400 hover:text-red-300 rounded"
                    title="Delete camera"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {sources.rtmpCameras.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <Wifi className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No RTMP cameras configured</p>
              <p className="text-xs">Click "Add RTMP" to add your first camera</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-white">
                {editingCamera ? 'Edit RTMP Camera' : 'Add RTMP Camera'}
              </h4>
              <button
                onClick={resetForm}
                className="p-1 text-gray-400 hover:text-white rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Camera Name */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Camera Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                  placeholder="e.g., Reolink Front Door"
                />
              </div>

              {/* RTMP URL */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">RTMP URL *</label>
                <input
                  type="text"
                  value={formData.rtmpUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, rtmpUrl: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm font-mono"
                  placeholder="rtmp://192.168.86.23:1935/live/main"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Full RTMP URL including stream path
                </p>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Username (Optional)</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                  placeholder="RTMP authentication username"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Password (Optional)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                  placeholder="RTMP authentication password"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                  rows="2"
                  placeholder="Camera description or location"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCamera}
                disabled={!formData.name.trim() || !formData.rtmpUrl.trim()}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded transition-colors
                  ${formData.name.trim() && formData.rtmpUrl.trim()
                    ? 'bg-primary hover:bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                <Save className="h-4 w-4" />
                <span>{editingCamera ? 'Update' : 'Add'} Camera</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Setup Help */}
      <div className="p-3 bg-green-900 bg-opacity-30 rounded border border-green-700">
        <div className="flex items-start space-x-2">
          <Camera className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-green-300">
            <p className="font-medium mb-1">RTMP Camera Setup:</p>
            <p>1. Find your camera's RTMP stream URL</p>
            <p>2. Test the URL in VLC or similar player</p>
            <p>3. Add authentication if required</p>
            <p>4. Click "Add RTMP" to configure</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourcesManager;
