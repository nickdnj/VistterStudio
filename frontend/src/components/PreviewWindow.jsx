import { useState } from 'react';
import { Play, Pause, Square, Volume2, VolumeX, Maximize2, Settings } from 'lucide-react';
import VideoPlayer from './VideoPlayer';

const PreviewWindow = ({ selectedCamera, cameras, getStreamUrl, className = "" }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className={`bg-dark rounded-lg border border-gray-700 flex flex-col ${className}`}>
      {/* Preview Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-red-500 font-medium">LIVE</span>
          </div>
          {selectedCamera && cameras[selectedCamera] && (
            <span className="text-white font-medium">
              {cameras[selectedCamera].nickname}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-gray-400" />
            ) : (
              <Volume2 className="h-4 w-4 text-white" />
            )}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Maximize2 className="h-4 w-4 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <Settings className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 bg-black rounded-b-lg overflow-hidden relative">
        {selectedCamera && cameras[selectedCamera] ? (
          <VideoPlayer
            key={selectedCamera}
            src={getStreamUrl(cameras[selectedCamera], 'hls')}
            className="w-full h-full"
            autoPlay={isPlaying}
            muted={isMuted}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-4">📹</div>
              <h3 className="text-xl font-semibold mb-2">No Camera Selected</h3>
              <p>Select a camera from the sidebar to start previewing</p>
            </div>
          </div>
        )}

        {/* Stream Info Overlay */}
        {selectedCamera && cameras[selectedCamera] && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 rounded-lg p-3 text-white text-sm">
            <div className="space-y-1">
              <div>📍 {cameras[selectedCamera].ip}</div>
              <div>🎥 {cameras[selectedCamera].is_2k ? '2K' : 'HD'} Quality</div>
              <div>⚡ {cameras[selectedCamera].req_bitrate}kbps</div>
            </div>
          </div>
        )}

        {/* Playback Controls Overlay */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-3 bg-black bg-opacity-70 rounded-lg px-4 py-2">
            <button
              onClick={togglePlayback}
              className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 text-white" />
              ) : (
                <Play className="h-5 w-5 text-white" />
              )}
            </button>
            <button className="p-2 hover:bg-gray-600 rounded-lg transition-colors">
              <Square className="h-4 w-4 text-white" />
            </button>
            <div className="text-white text-sm font-mono">
              00:00 / --:--
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewWindow;
