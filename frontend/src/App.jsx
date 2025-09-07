import { useState, useEffect } from 'react'
import { Monitor, Camera, Settings, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import axios from 'axios'
import './App.css'

// API base URL - adjust for your Docker setup
const API_BASE = 'http://localhost:18080/api'

function App() {
  const [cameras, setCameras] = useState({})
  const [selectedCamera, setSelectedCamera] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mixerMode, setMixerMode] = useState(false)

  useEffect(() => {
    fetchCameras()
  }, [])

  const fetchCameras = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get(`${API_BASE}/cams`)
      setCameras(response.data.cameras || {})
      
      // Auto-select first camera
      const firstCamera = Object.keys(response.data.cameras || {})[0]
      if (firstCamera) {
        setSelectedCamera(firstCamera)
      }
    } catch (err) {
      setError('Failed to fetch cameras')
      console.error('Error fetching cameras:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getStreamUrl = (camera, type = 'hls') => {
    if (!camera) return ''
    
    // Convert internal URLs to external accessible URLs
    const url = camera[`${type}_url`] || ''
    return url.replace('wyze-bridge:', 'localhost:')
      .replace(':8888', ':18888')
      .replace(':8554', ':18554')
      .replace(':1935', ':11935')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-darker flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white">Loading VistterStudio...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-darker flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
          <p className="text-gray-400">{error}</p>
          <button onClick={fetchCameras} className="btn-primary mt-4">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const cameraList = Object.entries(cameras)

  return (
    <div className="min-h-screen bg-darker">
      {/* Header */}
      <header className="bg-dark border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Monitor className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-white">VistterStudio</h1>
            <span className="text-sm bg-success text-white px-2 py-1 rounded">LIVE</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setMixerMode(!mixerMode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                mixerMode ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Mixer Mode</span>
            </button>
            <div className="text-sm text-gray-400">
              {cameraList.length} cameras • {cameraList.filter(([_, cam]) => cam.enabled).length} enabled
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Camera Sidebar */}
        <div className="w-80 bg-dark border-r border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Camera className="h-5 w-5 mr-2 text-primary" />
              Camera Feeds
            </h3>
            
            <div className="space-y-3">
              {cameraList.map(([cameraId, camera]) => (
                <div 
                  key={cameraId}
                  onClick={() => setSelectedCamera(cameraId)}
                  className={`stream-card p-4 cursor-pointer ${
                    selectedCamera === cameraId ? 'border-primary bg-gray-700' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white truncate">{camera.nickname}</h4>
                    <div className={`h-2 w-2 rounded-full ${
                      camera.enabled ? 'bg-success' : 'bg-gray-500'
                    }`}></div>
                  </div>
                  
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>{camera.model_name}</div>
                    <div>{camera.ip}</div>
                    <div className="flex items-center space-x-2">
                      <span className={camera.is_2k ? 'text-primary' : 'text-gray-500'}>
                        {camera.is_2k ? '2K' : 'HD'}
                      </span>
                      {camera.audio && <Volume2 className="h-3 w-3 text-green-500" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Main Video Display */}
          <div className="flex-1 p-6">
            {selectedCamera && cameras[selectedCamera] ? (
              <div className="h-full">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">
                    {cameras[selectedCamera].nickname}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">
                      {cameras[selectedCamera].model_name}
                    </span>
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-red-500">LIVE</span>
                  </div>
                </div>
                
                {/* Video Player */}
                <div className="relative bg-black rounded-lg overflow-hidden h-[70vh]">
                  <video 
                    key={selectedCamera}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    muted
                    playsInline
                  >
                    <source 
                      src={getStreamUrl(cameras[selectedCamera], 'hls')} 
                      type="application/x-mpegURL" 
                    />
                    <source 
                      src={getStreamUrl(cameras[selectedCamera], 'rtsp')} 
                      type="application/x-rtsp" 
                    />
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Stream Info Overlay */}
                  <div className="absolute top-4 left-4 bg-black bg-opacity-70 rounded-lg p-3 text-white">
                    <div className="text-sm space-y-1">
                      <div>📍 {cameras[selectedCamera].ip}</div>
                      <div>🎥 {cameras[selectedCamera].is_2k ? '2K' : 'HD'} Quality</div>
                      <div>⚡ {cameras[selectedCamera].req_bitrate}kbps</div>
                    </div>
                  </div>
                </div>

                {/* Stream URLs */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {['hls', 'rtsp', 'rtmp'].map(type => (
                    <div key={type} className="bg-gray-800 rounded-lg p-3">
                      <div className="text-sm font-medium text-white mb-2 uppercase">
                        {type} Stream
                      </div>
                      <div className="text-xs text-gray-400 font-mono break-all">
                        {getStreamUrl(cameras[selectedCamera], type)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400">Select a camera to start streaming</h3>
                </div>
              </div>
            )}
          </div>

          {/* Mixer Panel */}
          {mixerMode && (
            <div className="h-48 border-t border-gray-700 bg-dark p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Stream Mixer</h3>
              <div className="grid grid-cols-4 gap-4 h-32">
                {cameraList.slice(0, 4).map(([cameraId, camera]) => (
                  <div key={cameraId} className="mixer-panel">
                    <div className="text-sm font-medium text-white mb-2">{camera.nickname}</div>
                    <div className="h-20 bg-black rounded overflow-hidden">
                      <video 
                        className="w-full h-full object-cover"
                        muted
                        autoPlay
                        playsInline
                      >
                        <source src={getStreamUrl(camera, 'hls')} type="application/x-mpegURL" />
                      </video>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App