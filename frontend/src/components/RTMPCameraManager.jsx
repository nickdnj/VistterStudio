import React, { useState } from 'react'
import { Plus, X, Eye, EyeOff, Trash2, Settings } from 'lucide-react'
import axios from 'axios'

const API_BASE = 'http://localhost:8080/api'

const RTMPCameraManager = ({ cameras, onCamerasUpdate, onCameraSelect, selectedCamera }) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 1935,
    channel: 0,
    stream: 2,
    username: '',
    password: '',
    protocols: ['rtmp'] // Default to RTMP only
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  // Filter RTMP cameras
  const rtmpCameras = Object.values(cameras).filter(camera => camera.type === 'rtmp')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await axios.post(`${API_BASE}/rtmp/cameras`, formData)
      
      // Refresh cameras list
      onCamerasUpdate()
      
      // Reset form
      setFormData({
        name: '',
        host: '',
        port: 1935,
        channel: 0,
        stream: 2,
        username: '',
        password: '',
        protocols: ['rtmp']
      })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding camera:', error)
      alert('Failed to add camera: ' + (error.response?.data?.message || error.message))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (cameraId) => {
    if (!confirm('Are you sure you want to delete this camera?')) return

    try {
      await axios.delete(`${API_BASE}/rtmp/cameras/${cameraId}`)
      onCamerasUpdate()
    } catch (error) {
      console.error('Error deleting camera:', error)
      alert('Failed to delete camera: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleAddToTimeline = (camera) => {
    // This will be implemented when timeline integration is ready
    console.log('Add to timeline:', camera)
    onCameraSelect(camera.id)
  }

  const handleTestStream = async (camera) => {
    try {
      // Get the full RTMP URL from the API
      const response = await axios.get(`${API_BASE}/rtmp/cameras/${camera.id}/stream`)
      const streamUrl = response.data.streamUrl
      
      // Show the stream URL and instructions
      const message = `RTMP Stream URL:\n${streamUrl}\n\nTo test:\n1. Copy the URL above\n2. Open VLC Media Player\n3. Go to Media > Open Network Stream\n4. Paste the URL and click Play\n\nOr use FFplay:\nffplay "${streamUrl}"`
      
      if (navigator.clipboard && window.isSecureContext) {
        // Copy to clipboard if available
        await navigator.clipboard.writeText(streamUrl)
        alert(message + '\n\n✅ URL copied to clipboard!')
      } else {
        // Fallback for non-HTTPS contexts
        alert(message)
      }
    } catch (error) {
      console.error('Error getting stream URL:', error)
      alert('Failed to get stream URL: ' + (error.response?.data?.message || error.message))
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 bg-gray-700 cursor-pointer hover:bg-gray-600 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="font-medium text-white">RTMP Cameras</span>
          <span className="text-xs text-gray-400">({rtmpCameras.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowAddForm(true)
            }}
            className="p-1 hover:bg-gray-500 rounded transition-colors"
            title="Add RTMP Camera"
          >
            <Plus size={16} className="text-gray-300" />
          </button>
          <div className="text-gray-400">
            {isExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Camera List */}
          {rtmpCameras.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">📹</div>
              <p className="text-sm">No RTMP cameras configured</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                Add your first camera
              </button>
            </div>
          ) : (
            rtmpCameras.map(camera => (
              <div 
                key={camera.id}
                draggable
                onDragStart={(e) => {
                  console.log('Dragging RTMP camera:', { cameraId: camera.id, camera });
                  e.dataTransfer.setData('text/plain', JSON.stringify({
                    type: 'camera',
                    cameraId: camera.id,
                    camera
                  }));
                }}
                className={`p-3 bg-gray-700 rounded-lg border transition-all cursor-move ${
                  selectedCamera === camera.id ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white truncate">{camera.nickname || camera.name}</h4>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAddToTimeline(camera)}
                      className="p-1 hover:bg-gray-600 rounded transition-colors"
                      title="Add to Timeline"
                    >
                      <Plus size={14} className="text-green-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(camera.id)}
                      className="p-1 hover:bg-gray-600 rounded transition-colors"
                      title="Delete Camera"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 space-y-1">
                  <div>Host: {camera.host}:{camera.port}</div>
                  <div>Channel: {camera.channel} | Stream: {camera.stream}</div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      camera.isActive ? 'bg-green-400' : 'bg-gray-500'
                    }`}></span>
                    <span>{camera.status || 'Unknown'}</span>
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => onCameraSelect(camera.id)}
                    className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                  >
                    Select Camera
                  </button>
                  <button
                    onClick={() => handleTestStream(camera)}
                    className="w-full px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                  >
                    📺 Test in VLC
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Add Camera Form */}
          {showAddForm && (
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white">Add RTMP Camera</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1 hover:bg-gray-600 rounded transition-colors"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Camera Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Reolink Camera 1"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Host/IP</label>
                    <input
                      type="text"
                      value={formData.host}
                      onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="192.168.1.100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Port</label>
                    <input
                      type="number"
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="1935"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Channel</label>
                    <input
                      type="number"
                      value={formData.channel}
                      onChange={(e) => setFormData({ ...formData, channel: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Stream</label>
                    <input
                      type="number"
                      value={formData.stream}
                      onChange={(e) => setFormData({ ...formData, stream: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="2"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="admin"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2">Supported Protocols</label>
                  <div className="space-y-2">
                    {[
                      { id: 'rtmp', label: 'RTMP (Required)', desc: 'For timeline integration' },
                      { id: 'http', label: 'HTTP/MJPEG', desc: 'For browser preview' },
                      { id: 'rtsp', label: 'RTSP', desc: 'For external tools' }
                    ].map((protocol) => (
                      <label key={protocol.id} className="flex items-start space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.protocols.includes(protocol.id)}
                          onChange={(e) => {
                            const newProtocols = e.target.checked
                              ? [...formData.protocols, protocol.id]
                              : formData.protocols.filter(p => p !== protocol.id);
                            setFormData({ ...formData, protocols: newProtocols });
                          }}
                          disabled={protocol.id === 'rtmp'} // RTMP always required
                          className="mt-0.5 w-3 h-3 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="text-xs text-white">{protocol.label}</div>
                          <div className="text-xs text-gray-500">{protocol.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Camera'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              <div className="mt-3 p-2 bg-blue-900/20 border border-blue-500/30 rounded text-xs">
                <div className="text-blue-400 font-medium mb-1">Example URL Format:</div>
                <div className="text-gray-300 font-mono text-xs break-all">
                  rtmp://192.168.86.23:1935/bcs/channel0_ext.bcs?channel=0&stream=2&user=username&password=password
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RTMPCameraManager
