# RTMP Stream Viewing Guide

## 🎯 Browser Preview Now Available!

VistterStudio now supports **real-time browser preview** using HTTP/MJPEG streaming! 

### ✅ **With HTTP/MJPEG Enabled (Browser Preview)**
- Enable "HTTP/MJPEG" protocol when adding your camera
- See live video directly in VistterStudio timeline and preview
- Real-time updates as you adjust position, zoom, and opacity
- No external tools needed for basic monitoring

### 📺 **RTMP Only (External Tools Required)**
- RTMP streams require VLC, OBS, or FFplay for viewing
- Timeline shows professional placeholder with stream information
- Use "Test in VLC" button for actual video validation

## 🔧 **Enabling HTTP/MJPEG on Your Camera**

### For Reolink Cameras:
1. **Access Camera Web Interface**: http://[camera-ip]
2. **Login** with your camera credentials
3. **Go to Settings** → Network → Advanced
4. **Enable "HTTP Port"** (usually port 80)
5. **Enable "RTMP"** if you want both protocols
6. **Save Settings** and reboot camera if prompted

### For Other Camera Brands:
- **Hikvision**: Enable "HTTP Listening" in Network settings
- **Dahua**: Enable "HTTP Port" in Network → Connection
- **Generic ONVIF**: Look for "Streaming" or "Network Services"

💡 **Tip**: Most modern IP cameras support HTTP streaming - check your camera's manual for "HTTP streaming", "MJPEG", or "Web streaming" options.

## 📺 How to View Your RTMP Streams

### Option 1: VLC Media Player (Recommended)

1. **Download VLC**: https://www.videolan.org/vlc/
2. **Open Network Stream**: 
   - Go to `Media` → `Open Network Stream...`
   - Or press `Ctrl+N` (Windows/Linux) or `Cmd+N` (Mac)
3. **Paste RTMP URL**: 
   ```
   rtmp://192.168.86.23:1935/bcs/channel0_ext.bcs?channel=0&stream=2&user=Wharfside&password=Wharfside2025!!
   ```
4. **Click Play**: Stream should start playing

### Option 2: FFplay (Command Line)

```bash
# Install FFmpeg (includes FFplay)
# macOS: brew install ffmpeg
# Windows: Download from https://ffmpeg.org/
# Ubuntu: sudo apt install ffmpeg

# Play the stream
ffplay "rtmp://192.168.86.23:1935/bcs/channel0_ext.bcs?channel=0&stream=2&user=Wharfside&password=Wharfside2025!!"
```

### Option 3: OBS Studio

1. **Download OBS**: https://obsproject.com/
2. **Add Media Source**:
   - Click `+` in Sources
   - Choose `Media Source`
   - Create new or select existing
3. **Configure Source**:
   - **Uncheck** "Local File"
   - **Input**: Paste your RTMP URL
   - **Click OK**

### Option 4: Browser via HLS (Future Enhancement)

For browser viewing, you would need to:
1. **Add RTMP to HLS transcoding** (using FFmpeg)
2. **Serve HLS streams** via HTTP
3. **Use HLS.js** or similar player in the browser

## 🔧 VistterStudio "Test in VLC" Button

In VistterStudio:
1. **Go to Camera Drawer** → RTMP Cameras section
2. **Click "📺 Test in VLC"** on any camera
3. **Copy the provided URL** (automatically copied to clipboard)
4. **Paste in VLC** as described above

## 🎬 Timeline Preview vs Real Stream

| Feature | Timeline Preview | External Player |
|---------|------------------|-----------------|
| **Purpose** | Timeline editing & composition | Actual video viewing |
| **Shows** | Camera info, status, controls | Live video stream |
| **Use Case** | Positioning, timing, effects | Stream validation, monitoring |
| **Latency** | N/A (placeholder) | Real-time (~1-3 seconds) |

## 🚀 Future Enhancements

### Phase 1: HLS Transcoding
```bash
# Add FFmpeg transcoding service
docker run -d \
  --name rtmp-to-hls \
  -p 1935:1935 \
  -p 8080:8080 \
  nginx-rtmp
```

### Phase 2: WebRTC Gateway
- Real-time browser preview
- Lower latency (~100ms)
- Interactive controls

### Phase 3: Thumbnail Generation
- Capture frames from RTMP stream
- Show latest frame in timeline preview
- Update every few seconds

## 🛠️ Troubleshooting

### "Stream Won't Connect"
- ✅ Verify camera IP address and port
- ✅ Check username/password
- ✅ Ensure camera RTMP is enabled
- ✅ Test network connectivity: `ping 192.168.86.23`

### "VLC Shows Error"
- ✅ Copy URL exactly (including credentials)
- ✅ Try increasing network caching in VLC
- ✅ Check firewall settings
- ✅ Verify camera is streaming (not just configured)

### "Timeline Shows No Preview"
This is **expected behavior**! The timeline shows:
- ✅ Camera name and configuration
- ✅ Stream status and connection info
- ✅ Professional grid background
- ✅ Controls for positioning/zoom/opacity

The actual video requires external tools as described above.

---

**💡 Pro Tip**: Use VistterStudio for professional timeline editing and composition, then use VLC/OBS to monitor the actual video streams during production!
