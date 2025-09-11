import { useState, useEffect, useRef } from 'react';
import { Wifi, Play, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';

const RTMPCameraPreview = ({ camera, isPlaying, isMuted }) => {
  const [previewState, setPreviewState] = useState('idle'); // idle, starting, playing, error
  const [hlsUrl, setHlsUrl] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamKey = `rtmp_${camera.id}`;

  useEffect(() => {
    if (isPlaying) {
      startRTMPPreview();
    } else {
      stopRTMPPreview();
    }

    return () => {
      stopRTMPPreview();
    };
  }, [isPlaying, camera.rtmpUrl]);

  const startRTMPPreview = async () => {
    try {
      setPreviewState('starting');
      setError(null);

      console.log(`🎬 Starting RTMP preview for ${camera.name}`);

      const response = await axios.post('http://localhost:19001/api/preview/rtmp/start', {
        rtmpUrl: camera.rtmpUrl,
        streamKey: streamKey
      });

      setHlsUrl(response.data.hlsUrl);
      
      // Wait a moment for HLS segments to be generated
      setTimeout(() => {
        setPreviewState('playing');
      }, 3000);

    } catch (error) {
      console.error(`❌ Failed to start RTMP preview for ${camera.name}:`, error);
      setError(error.response?.data?.error || error.message);
      setPreviewState('error');
    }
  };

  const stopRTMPPreview = async () => {
    try {
      if (previewState === 'playing' || previewState === 'starting') {
        await axios.post('http://localhost:19001/api/preview/rtmp/stop', {
          streamKey: streamKey
        });
      }
      
      setPreviewState('idle');
      setHlsUrl(null);
      
    } catch (error) {
      console.error(`❌ Failed to stop RTMP preview for ${camera.name}:`, error);
    }
  };

  const handleVideoError = (e) => {
    console.error('HLS video error:', e);
    setError('Failed to load HLS stream');
    setPreviewState('error');
  };

  const handleVideoLoad = () => {
    console.log(`✅ HLS stream loaded for ${camera.name}`);
    setPreviewState('playing');
  };

  // Render based on current state
  if (previewState === 'idle' || !isPlaying) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded">
        <div className="text-center">
          <Wifi className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">{camera.name}</h3>
          <p className="text-gray-400 mb-2">RTMP Camera Source</p>
          <p className="text-sm text-gray-500 font-mono mb-4">{camera.rtmpUrl.split('?')[0]}</p>
          <div className="flex items-center justify-center space-x-2 text-blue-300">
            <Play className="h-4 w-4" />
            <span className="text-sm">Press play to start preview</span>
          </div>
        </div>
      </div>
    );
  }

  if (previewState === 'starting') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded">
        <div className="text-center">
          <Loader className="h-16 w-16 text-green-400 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-semibold text-white mb-2">{camera.name}</h3>
          <p className="text-gray-400 mb-2">Starting RTMP Preview...</p>
          <p className="text-sm text-gray-500">Converting RTMP to HLS for browser playback</p>
        </div>
      </div>
    );
  }

  if (previewState === 'error') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">{camera.name}</h3>
          <p className="text-red-400 mb-2">Preview Error</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={startRTMPPreview}
            className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded transition-colors"
          >
            Retry Preview
          </button>
        </div>
      </div>
    );
  }

  if (previewState === 'playing' && hlsUrl) {
    return (
      <video
        ref={videoRef}
        key={`rtmp-hls-${camera.id}`}
        src={hlsUrl.replace('localhost:8081', 'localhost:19081')} // Use external port mapping
        className="w-full h-full rounded object-contain"
        autoPlay={true}
        muted={isMuted}
        controls={false}
        onError={handleVideoError}
        onLoadedData={handleVideoLoad}
        onCanPlay={() => console.log(`📺 HLS stream ready for ${camera.name}`)}
      />
    );
  }

  return null;
};

export default RTMPCameraPreview;
