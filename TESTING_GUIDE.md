# VistterStudio RTMP Testing Guide

## 🚀 Ready for Testing!

The RTMP camera integration refactor is complete. Here's how to test the new system.

## ✅ What Was Changed

### Removed:
- ❌ Wyze Bridge dependency
- ❌ Wyze-specific camera detection (HL_CAM4, product_model)
- ❌ WebRTC iframe handling for V4 cameras
- ❌ HLS stream URLs and transcoding

### Added:
- ✅ RTMP camera management API
- ✅ Secure credential storage and URL generation  
- ✅ Camera Drawer UI with add/edit/delete functionality
- ✅ Timeline integration with drag-and-drop RTMP cameras
- ✅ Properties Panel with positioning, zoom, and opacity controls
- ✅ Real-time preview updates for camera adjustments

## 🧪 Testing Options

### Option 1: Development Testing (Recommended)

```bash
# Terminal 1: Start Backend
cd server
npm install
npm start
# Server runs on http://localhost:8080

# Terminal 2: Start Frontend  
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

### Option 2: Docker Testing

```bash
# Build and start containers
docker-compose up --build

# Access URLs:
# Frontend: http://localhost:5173
# Backend API: http://localhost:8080/api
```

## 📝 Test Plan

### Step 1: Backend API Testing

```bash
# Test the API is running
curl http://localhost:8080/api/rtmp/cameras

# Should return: {"cameras": []}

# Test adding the provided RTMP camera
node test_rtmp_camera.js

# This will add the test camera and validate all endpoints
```

### Step 2: Frontend Integration Testing

1. **Open VistterStudio**: http://localhost:5173
2. **Camera Drawer**: 
   - Click "Cameras" tab in left sidebar
   - Verify RTMP Cameras section appears
   - Check for test camera if you ran the test script
3. **Add Camera Manually**:
   - Click "Add Camera" (+ button)
   - Enter test configuration:
     ```
     Name: Test Reolink Camera
     Host: 192.168.86.23
     Port: 1935
     Channel: 0
     Stream: 2
     Username: Wharfside
     Password: Wharfside2025!!
     ```
   - Click "Add Camera"
   - Verify camera appears in the list

### Step 3: Timeline Integration Testing

1. **Drag to Timeline**: 
   - Drag the RTMP camera from Camera Drawer to the timeline
   - Verify camera clip appears on timeline track
2. **Preview Validation**:
   - Check timeline preview window shows RTMP placeholder
   - Should display camera name and connection info
3. **Properties Panel**:
   - Click on the camera clip in timeline
   - Switch to "Properties" tab in sidebar
   - Verify RTMP camera controls appear:
     - Position sliders (X/Y: -100 to +100)
     - Zoom slider (50% to 300%)
     - Opacity slider (0% to 100%)

### Step 4: Advanced Feature Testing

1. **Multiple Cameras**: Add 2-3 cameras and test timeline layering
2. **Asset Integration**: Upload images/videos and verify they work alongside cameras
3. **Effects Testing**: Try transitions and overlays on camera clips
4. **Persistence**: Refresh the page and verify cameras persist

## 🔧 Expected Behavior

### ✅ Working Features:
- Camera management (add/edit/delete)
- Timeline drag-and-drop integration
- Properties panel controls (with real-time updates)
- Camera credential persistence
- RTMP URL generation and validation
- Asset library integration
- Multi-track timeline editing

### ⚠️ Known Limitations:
- **RTMP Preview**: Browsers can't directly display RTMP streams, so we show placeholders
- **Stream Testing**: You'll need external tools (VLC, FFplay) to test actual RTMP playback
- **Production Use**: For real streaming, you'd need RTMP-to-HLS transcoding

## 🛠️ Troubleshooting

### Backend Issues:
```bash
# Check server logs
cd server && npm start

# Common issues:
# - Port 8080 already in use
# - Missing node_modules (run npm install)
# - API endpoints not responding
```

### Frontend Issues:
```bash
# Check frontend logs  
cd frontend && npm run dev

# Common issues:
# - Port 5173 already in use
# - API connection errors (verify backend is running)
# - Build errors (run npm install)
```

### API Connection Issues:
```bash
# Test backend connectivity
curl http://localhost:8080/api/rtmp/cameras

# If this fails:
# 1. Verify backend is running on port 8080
# 2. Check CORS configuration
# 3. Verify no firewall blocking
```

## 📊 Success Criteria

### ✅ Pass Criteria:
- [ ] Backend API responds to all RTMP camera endpoints
- [ ] Frontend loads without errors
- [ ] Camera Drawer shows RTMP section
- [ ] Can add/edit/delete cameras through UI
- [ ] Cameras can be dragged onto timeline
- [ ] Properties panel shows RTMP controls
- [ ] Camera credentials persist between sessions
- [ ] Test script runs successfully

### 🚨 Fail Criteria:
- API endpoints return errors
- Frontend fails to load or shows blank screen
- Cannot add cameras through UI
- Drag-and-drop doesn't work
- Properties panel missing or broken
- Data doesn't persist

## 🎯 Next Steps After Testing

Once basic functionality is validated:

1. **Real Camera Testing**: Test with actual Reolink/IP cameras
2. **Stream Transcoding**: Add RTMP-to-HLS conversion for browser playback
3. **Performance Optimization**: Test with multiple cameras
4. **Production Deployment**: Deploy in Docker containers
5. **Documentation Updates**: Based on test results

## 📞 Issues & Feedback

If you encounter issues during testing:

1. **Check Console Logs**: Browser dev tools + terminal output
2. **Verify Configuration**: API URLs, ports, and endpoints
3. **Test Isolation**: Test backend API separately from frontend
4. **Document Issues**: Note specific error messages and reproduction steps

---

**🎬 Ready to test? Start with Option 1 (Development Testing) for the best debugging experience!**
