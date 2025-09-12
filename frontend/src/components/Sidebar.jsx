import { useState } from 'react';
import { Camera, FolderOpen, Layers, Settings, Palette, Type, Music, Image, Video, FileText, Edit3, Radio } from 'lucide-react';
import { PropertiesDock } from '../timeline';
import AssetManager from './AssetManager';
import RTMPCameraManager from './RTMPCameraManager';
import BroadcastManager from './BroadcastManager';

const Sidebar = ({ 
  cameras, 
  selectedCamera, 
  onSelectCamera, 
  assets = [],
  onAssetSelect,
  onCamerasUpdate,
  className = "" 
}) => {
  const [activeTab, setActiveTab] = useState('cameras');
  const [assetManagerOpen, setAssetManagerOpen] = useState(false);

  const tabs = [
    { id: 'cameras', name: 'Cameras', icon: Camera },
    { id: 'assets', name: 'Assets', icon: FolderOpen },
    { id: 'effects', name: 'Effects', icon: Layers },
    { id: 'properties', name: 'Properties', icon: Edit3 },
    { id: 'broadcast', name: 'Broadcast', icon: Radio },
    { id: 'tools', name: 'Tools', icon: Settings },
  ];

  const handleAssetDrag = (asset, e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'asset',
      asset
    }));
  };

  const getAssetIcon = (category) => {
    switch (category) {
      case 'images': return Image;
      case 'videos': return Video;
      case 'audio': return Music;
      default: return FileText;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={`bg-dark border-r border-gray-700 flex flex-col ${className}`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Studio</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 p-3 flex flex-col items-center space-y-1 transition-colors ${
                activeTab === tab.id 
                  ? 'bg-primary text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs">{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {activeTab === 'cameras' && (
          <div className="p-4">
            <RTMPCameraManager
              cameras={cameras}
              onCamerasUpdate={onCamerasUpdate}
              onCameraSelect={onSelectCamera}
              selectedCamera={selectedCamera}
            />
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-white">Media Library</h3>
              <button
                onClick={() => setAssetManagerOpen(true)}
                className="text-xs text-primary hover:text-blue-400"
              >
                Manage
              </button>
            </div>
            
             <div className="space-y-2 max-h-96 overflow-y-auto">
               {assets.map((asset) => {
                const Icon = getAssetIcon(asset.category);
                return (
                  <div
                    key={asset.id}
                    draggable
                    onDragStart={(e) => handleAssetDrag(asset, e)}
                    className="p-2 rounded bg-gray-800 hover:bg-gray-700 cursor-move transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      {asset.category === 'images' ? (
                        <img
                          src={`http://localhost:8080${asset.url}`}
                          alt={asset.originalName}
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                          <Icon className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-xs font-medium truncate">
                          {asset.originalName}
                        </h4>
                        <p className="text-gray-400 text-xs">
                          {formatFileSize(asset.size)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {assets.length === 0 && (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No assets</p>
                  <button
                    onClick={() => setAssetManagerOpen(true)}
                    className="text-primary text-xs hover:text-blue-400 mt-2"
                  >
                    Upload files
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'effects' && (
          <div className="p-4">
            <h3 className="font-medium text-white mb-4">Effects & Overlays</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Text & Graphics</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-gray-800 rounded-lg text-center cursor-pointer hover:bg-gray-700">
                    <Type className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                    <span className="text-xs text-gray-400">Title</span>
                  </div>
                  <div className="p-3 bg-gray-800 rounded-lg text-center cursor-pointer hover:bg-gray-700">
                    <Palette className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                    <span className="text-xs text-gray-400">Lower Third</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Data Overlays</h4>
                <div className="space-y-2">
                  <div className="p-2 bg-gray-800 rounded text-xs text-gray-400">
                    🌤️ Weather Widget
                  </div>
                  <div className="p-2 bg-gray-800 rounded text-xs text-gray-400">
                    🌊 Tide Information
                  </div>
                  <div className="p-2 bg-gray-800 rounded text-xs text-gray-400">
                    📊 Live Data Feed
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="flex-1 flex flex-col">
            <PropertiesDock className="flex-1" />
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="flex-1 flex flex-col">
            <BroadcastManager className="flex-1" />
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="p-4">
            <h3 className="font-medium text-white mb-4">Tools & Settings</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Export</h4>
                <button className="w-full p-2 bg-primary hover:bg-blue-600 text-white rounded text-sm transition-colors">
                  Export Timeline
                </button>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Project</h4>
                <div className="space-y-2">
                  <button className="w-full p-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm">
                    Save Project
                  </button>
                  <button className="w-full p-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm">
                    Load Project
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Settings</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Resolution</span>
                    <span>1920x1080</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Frame Rate</span>
                    <span>30 FPS</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Quality</span>
                    <span>High</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Asset Manager Modal */}
      <AssetManager
        isOpen={assetManagerOpen}
        onClose={() => setAssetManagerOpen(false)}
        onSelectAsset={onAssetSelect}
      />
    </div>
  );
};

export default Sidebar;
