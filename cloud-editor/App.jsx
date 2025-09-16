import { useState, useEffect } from 'react'
import { Monitor, Maximize2, Minimize2 } from 'lucide-react'
import axios from 'axios'
import PreviewWindow from './components/PreviewWindow'
import { Timeline } from './timeline'
import { useTimelinePreview } from './timeline'
import Sidebar from './components/Sidebar'
import LiveStreamStatus from './components/LiveStreamStatus'
import './App.css'

// API base URL - adjust for your Docker setup
const API_BASE = 'http://localhost:8080/api'

function App() {
  const [cameras, setCameras] = useState({})
  const [selectedCamera, setSelectedCamera] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [assets, setAssets] = useState([])
  
  // Layout state
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [timelineHeight, setTimelineHeight] = useState(350)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    fetchCameras()
    fetchAssets()
  }, [])

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
      const response = await axios.get(`${API_BASE}/rtmp/cameras`)
      const cameraList = response.data.cameras || []
      
      // Convert array to object format for compatibility with existing code
      const camerasObj = {}
      cameraList.forEach(camera => {
        camerasObj[camera.id] = {
          ...camera,
          nickname: camera.name,
          mac: camera.id,
          type: 'rtmp'
        }
      })
      
      setCameras(camerasObj)
      
      // Auto-select first camera
      const firstCameraId = Object.keys(camerasObj)[0]
      if (firstCameraId) {
        setSelectedCamera(firstCameraId)
      }
    } catch (err) {
      setError('Failed to fetch cameras')
      console.error('Error fetching cameras:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getStreamUrl = async (camera, type = 'rtmp') => {
    if (!camera || camera.type !== 'rtmp') return ''
    
    try {
      // Get the RTMP stream URL from the API
      const response = await axios.get(`${API_BASE}/rtmp/cameras/${camera.id}/stream`)
      return response.data.streamUrl
    } catch (error) {
      console.error('Error getting stream URL:', error)
      return ''
    }
  }

  // Get the appropriate stream type for camera
  const getStreamType = (camera) => {
    if (!camera) return 'rtmp'
    
    // RTMP cameras use RTMP streams
    if (camera.type === 'rtmp') {
      return 'rtmp'
    }
    
    return 'rtmp'
  }

  // Get timeline preview data using the new timeline system
  const { previewContent, overlays } = useTimelinePreview(cameras, getStreamUrl)

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
            onCamerasUpdate={fetchCameras}
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
            className="flex-1 min-h-0 flex items-center justify-center bg-gray-900 relative"
            style={{ height: `calc(100% - ${timelineHeight}px)` }}
          >
            <div className="w-full max-w-4xl mx-auto">
              <PreviewWindow
                previewContent={previewContent}
                overlays={overlays}
                getStreamUrl={getStreamUrl}
                className="w-full shadow-2xl"
                style={{ maxHeight: '50vh' }}
              />
            </div>
            
            {/* Live Stream Status Overlay */}
            <div className="absolute top-4 right-4">
              <LiveStreamStatus />
            </div>
          </div>

          {/* Timeline Resize Handle */}
          <div
            className="h-1 bg-gray-700 cursor-ns-resize hover:bg-primary transition-colors"
            onMouseDown={(e) => handleMouseDown(e, 'timeline')}
          />

          {/* Timeline */}
          <div style={{ height: timelineHeight }} className="flex-shrink-0">
            <Timeline className="h-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App