import { useState, useEffect } from 'react'
import { Monitor, Maximize2, Minimize2 } from 'lucide-react'
import axios from 'axios'
import PreviewWindow from './components/PreviewWindow'
import Timeline from './components/Timeline'
import Sidebar from './components/Sidebar'
import { useTimelineEngine } from './components/TimelineEngine'
import './App.css'

// API base URL - adjust for your Docker setup
const API_BASE = 'http://localhost:18080/api'

function App() {
  const [cameras, setCameras] = useState({})
  const [selectedCamera, setSelectedCamera] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [assets, setAssets] = useState([])
  
  // Timeline state - managed by Timeline Engine
  const [tracks, setTracks] = useState([
    { id: 'main', name: 'Main Track', type: 'video', elements: [], color: 'bg-blue-600' },
    { id: 'overlay1', name: 'Overlay 1', type: 'overlay', elements: [], color: 'bg-green-600' },
    { id: 'overlay2', name: 'Overlay 2', type: 'overlay', elements: [], color: 'bg-purple-600' },
    { id: 'audio', name: 'Audio', type: 'audio', elements: [], color: 'bg-orange-600' },
  ])
  
  // Initialize Timeline Engine
  const timeline = useTimelineEngine(tracks)
  
  // Layout state
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [timelineHeight, setTimelineHeight] = useState(350)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    fetchCameras()
    fetchAssets()
  }, [])

  // Update Timeline Engine when tracks change
  useEffect(() => {
    timeline.setTracks(tracks)
  }, [tracks, timeline])

  const fetchAssets = async () => {
    try {
      const response = await axios.get(`${API_BASE}/assets`)
      setAssets(response.data.assets || [])
    } catch (err) {
      console.error('Error fetching assets:', err)
    }
  }

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
    
    // Check if this is a v4 camera that needs WebRTC
    const isV4Camera = camera.product_model === 'HL_CAM4'
    
    if (isV4Camera && type === 'webrtc') {
      // v4 cameras use WebRTC endpoints
      return `http://localhost:15001/webrtc/${camera.name_uri}`
    }
    
    // Convert internal URLs to external accessible URLs for v4fix bridge
    const url = camera[`${type}_url`] || ''
    return url.replace('wyze-bridge:', 'localhost:')
      .replace(':8889', ':18889') // HLS port for v4fix
      .replace(':8555', ':18555') // RTSP port for v4fix  
      .replace(':1935', ':11935') // RTMP port unchanged
  }

  // Get the appropriate stream type for camera
  const getStreamType = (camera) => {
    if (!camera) return 'hls'
    
    // v4 cameras should use WebRTC when available
    if (camera.product_model === 'HL_CAM4') {
      return 'webrtc'
    }
    
    // Legacy cameras use HLS/RTSP
    return 'hls'
  }

  // Timeline management functions
  const addElementToTrack = (trackId, element) => {
    setTracks(tracks.map(track => 
      track.id === trackId 
        ? { ...track, elements: [...track.elements, element] }
        : track
    ))
  }

  const updateTrackElement = (trackId, elementId, updates) => {
    setTracks(tracks.map(track => 
      track.id === trackId 
        ? { 
            ...track, 
            elements: track.elements.map(el => 
              el.id === elementId ? { ...el, ...updates } : el
            )
          }
        : track
    ))
  }

  const removeElementFromTrack = (trackId, elementId) => {
    setTracks(tracks.map(track => 
      track.id === trackId 
        ? { ...track, elements: track.elements.filter(el => el.id !== elementId) }
        : track
    ))
  }

  const addTrack = (type = 'overlay') => {
    const newTrack = {
      id: `${type}_${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${tracks.filter(t => t.type === type).length + 1}`,
      type,
      elements: [],
      color: type === 'video' ? 'bg-blue-600' :
             type === 'overlay' ? 'bg-green-600' :
             type === 'audio' ? 'bg-orange-600' : 'bg-gray-600'
    }
    setTracks([...tracks, newTrack])
  }

  const removeTrack = (trackId) => {
    if (tracks.length <= 1) return // Keep at least one track
    setTracks(tracks.filter(track => track.id !== trackId))
  }

  // Timeline content is now handled by Timeline Engine
  // timeline.currentContent provides the current content
  // timeline.currentOverlays provides the current overlays  
  // timeline.currentAudio provides the current audio

  // Handle resize events for panels
  const handleMouseDown = (e, type) => {
    setIsResizing(type)
    e.preventDefault()
  }

  const handleMouseMove = (e) => {
    if (!isResizing) return

    if (isResizing === 'sidebar') {
      const newWidth = Math.max(250, Math.min(500, e.clientX))
      setSidebarWidth(newWidth)
    } else if (isResizing === 'timeline') {
      const newHeight = Math.max(200, Math.min(600, window.innerHeight - e.clientY))
      setTimelineHeight(newHeight)
    }
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  // Attach global mouse events for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing])

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

  return (
    <div className="min-h-screen bg-darker flex flex-col">
      {/* Header */}
      <header className="bg-dark border-b border-gray-700 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Monitor className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold text-white">VistterStudio</h1>
            <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">LIVE</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-400">
              {Object.keys(cameras).length} cameras • {Object.values(cameras).filter(cam => cam.enabled).length} enabled
            </div>
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <Maximize2 className="h-4 w-4 text-gray-400" />
        </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div style={{ width: sidebarWidth }} className="flex-shrink-0">
          <Sidebar
            cameras={cameras}
            selectedCamera={selectedCamera}
            onSelectCamera={setSelectedCamera}
            assets={assets}
            onAssetSelect={(asset) => {
              console.log('Asset selected:', asset)
              fetchAssets() // Refresh assets if needed
            }}
            className="h-full"
          />
        </div>

        {/* Sidebar Resize Handle */}
        <div
          className="w-1 bg-gray-700 cursor-ew-resize hover:bg-primary transition-colors"
          onMouseDown={(e) => handleMouseDown(e, 'sidebar')}
        />

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Preview Window */}
          <div 
            className="flex-1 min-h-0 flex items-center justify-center"
            style={{ height: `calc(100% - ${timelineHeight}px)` }}
          >
            <div className="w-full max-w-4xl mx-auto p-6">
              <PreviewWindow
                currentTime={timeline.currentTime}
                isPlaying={timeline.isPlaying}
                setIsPlaying={(playing) => playing ? timeline.play() : timeline.pause()}
                setCurrentTime={timeline.seekTo}
                duration={timeline.duration}
                previewContent={timeline.currentContent}
                overlays={timeline.currentOverlays}
                currentAudio={timeline.currentAudio}
                getStreamUrl={getStreamUrl}
                cameras={cameras}
                className="w-full"
                style={{ maxHeight: '50vh' }}
                // Timeline Engine controls
                timeline={timeline}
              />
            </div>
          </div>

          {/* Timeline Resize Handle */}
          <div
            className="h-1 bg-gray-700 cursor-ns-resize hover:bg-primary transition-colors"
            onMouseDown={(e) => handleMouseDown(e, 'timeline')}
          />

          {/* Timeline */}
          <div style={{ height: timelineHeight }} className="flex-shrink-0">
            <Timeline 
              tracks={tracks}
              currentTime={timeline.currentTime}
              setCurrentTime={timeline.seekTo}
              duration={timeline.duration}
              isPlaying={timeline.isPlaying}
              addTrack={addTrack}
              removeTrack={removeTrack}
              addElementToTrack={addElementToTrack}
              updateTrackElement={updateTrackElement}
              removeElementFromTrack={removeElementFromTrack}
              timeline={timeline}
              className="h-full" 
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App