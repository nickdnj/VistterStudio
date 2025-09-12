# YouTube Live Streaming Setup Guide

## 🎯 Complete YouTube Live Integration

VistterStudio now includes full YouTube Live streaming capabilities with timeline-driven automated broadcasting. Follow this guide to set up your first live stream.

## 📋 Prerequisites

### 1. YouTube Channel Requirements
- **YouTube Channel**: Must have 0+ subscribers (no longer requires 50+ subscribers as of 2023)
- **Channel Verification**: Phone number verification required
- **Live Streaming Enabled**: Must be enabled in YouTube Studio
- **Good Standing**: No live streaming restrictions in the past 90 days

### 2. VistterStudio Setup
- **All Services Running**: Frontend, API Server, and Broadcast Server
- **Timeline Content**: At least one camera or asset on the timeline
- **Network**: Stable internet with 5+ Mbps upload speed

## 🔑 Getting Your YouTube Stream Key

### Step 1: Access YouTube Studio
1. Go to [YouTube Studio](https://studio.youtube.com)
2. Sign in with your YouTube account
3. Click **"Go Live"** in the top-right corner

### Step 2: Create Live Stream
1. Choose **"Stream"** (not "Webcam" or "Mobile")
2. **Stream Title**: Enter your stream title
3. **Description**: Add stream description
4. **Visibility**: Choose Public, Unlisted, or Private
5. **Category**: Select appropriate category
6. **Thumbnail**: Upload custom thumbnail (optional)

### Step 3: Copy Stream Key
1. Scroll down to **"Stream Settings"**
2. **Stream Key**: Click "COPY" next to the stream key
3. **Keep this secure**: Never share your stream key publicly

### Step 4: Configure Stream Settings (Optional)
- **Latency**: Choose "Low latency" for interactive streams
- **DVR**: Enable to allow viewers to rewind
- **Auto-start**: Enable to start recording when you go live

## ⚙️ VistterStudio Configuration

### Step 1: Open Broadcast Manager
1. **Open VistterStudio**: http://localhost:5173
2. **Click "Broadcast" Tab**: In the left sidebar tools section
3. **YouTube Live Section**: Find the YouTube Live platform

### Step 2: Configure YouTube Live
1. **Enable YouTube**: Toggle the switch to enable YouTube Live
2. **Paste Stream Key**: Enter your YouTube stream key
3. **Test Connection**: Click "Test" to verify the key format
4. **Save Configuration**: Settings are automatically saved

### Step 3: Configure Stream Quality
1. **Click "Settings" Tab**: In the Broadcast Manager
2. **Resolution**: Choose 1080p (recommended) or 720p
3. **Frame Rate**: 30 FPS (recommended) or 60 FPS
4. **Bitrate**: 3500-5000 kbps for 1080p, 2500-3500 kbps for 720p
5. **Encoding Preset**: "Very Fast" for best performance

## 🎬 Going Live

### Method 1: Timeline Go Live Button
1. **Create Timeline**: Add cameras, assets, or content to timeline
2. **Enable Loop**: For continuous broadcasting
3. **Click "Go Live"**: Red button in timeline controls
4. **Automatic Setup**: Uses your configured YouTube credentials
5. **Monitor Status**: Live indicator shows in timeline and preview

### Method 2: Broadcast Manager
1. **Go to Broadcast Tab**: In sidebar
2. **YouTube Live Section**: Click "🔴 Go Live" 
3. **Stream Starts**: Broadcast begins immediately
4. **Monitor Health**: Watch stream metrics and viewer count

## 📊 Monitoring Your Stream

### Live Status Indicators
- **Timeline Controls**: "LIVE" indicator with viewer count
- **Preview Window**: Live stream status overlay (top-right)
- **Broadcast Tab**: Detailed metrics and health monitoring

### Stream Health Metrics
- **Bitrate**: Current upload speed to YouTube
- **FPS**: Frames per second being sent
- **Dropped Frames**: Network stability indicator
- **Buffer Health**: Stream stability percentage
- **Viewer Count**: Live viewer count from YouTube

### Health Warnings
- **Yellow Health (50-80%)**: Check internet connection
- **Red Health (<50%)**: Reduce bitrate or resolution
- **Dropped Frames**: Improve network or lower settings

## 🔄 Automated Broadcasting Features

### Timeline Looping
1. **Enable Loop**: Click repeat button in timeline controls
2. **Continuous Stream**: Timeline repeats automatically
3. **Seamless Transitions**: No interruption between loops
4. **24/7 Broadcasting**: Perfect for continuous content

### Live Camera Switching
1. **Multiple Cameras**: Add RTMP cameras to timeline
2. **Scheduled Switching**: Timeline automatically switches cameras
3. **Live Updates**: Changes reflect immediately in broadcast
4. **Multi-angle Production**: Professional multi-camera streams

## 🎛️ Advanced Stream Settings

### Recommended Settings by Use Case

#### **Gaming/Screen Recording**
- **Resolution**: 1920x1080
- **Frame Rate**: 60 FPS
- **Bitrate**: 4500-6000 kbps
- **Preset**: Very Fast

#### **Talk Shows/Podcasts**
- **Resolution**: 1280x720
- **Frame Rate**: 30 FPS  
- **Bitrate**: 2500-3500 kbps
- **Preset**: Fast

#### **Music/Concerts**
- **Resolution**: 1920x1080
- **Frame Rate**: 30 FPS
- **Bitrate**: 4000-5000 kbps
- **Preset**: Medium (better quality)

#### **24/7 Automated Streams**
- **Resolution**: 1280x720
- **Frame Rate**: 30 FPS
- **Bitrate**: 3000 kbps
- **Preset**: Very Fast (stability)

## 🚨 Troubleshooting

### "Stream Key Invalid"
- ✅ Copy stream key exactly from YouTube Studio
- ✅ Make sure no extra spaces or characters
- ✅ Generate new stream key if needed

### "Connection Failed"
- ✅ Check internet upload speed (5+ Mbps required)
- ✅ Verify firewall allows RTMP (port 1935)
- ✅ Try lower bitrate (2000-3000 kbps)

### "Dropped Frames"
- ✅ Reduce bitrate by 500-1000 kbps
- ✅ Lower resolution to 720p
- ✅ Change preset to "Ultra Fast"
- ✅ Close other bandwidth-heavy applications

### "No Preview"
- ✅ Make sure timeline has content (cameras or assets)
- ✅ Check if broadcast server is running (port 3001)
- ✅ Verify WebSocket connection in browser console

### "Stream Not Appearing on YouTube"
- ✅ Wait 10-30 seconds for stream to appear
- ✅ Check YouTube Studio for stream status
- ✅ Verify stream key is correct
- ✅ Make sure stream is set to "Public" visibility

## 🎉 Success Checklist

### Before Going Live:
- [ ] YouTube Live enabled and stream key configured
- [ ] Timeline has content (cameras, videos, images)
- [ ] Stream quality settings appropriate for your internet
- [ ] Test stream with a private/unlisted broadcast first
- [ ] Monitor stream health shows green/stable

### During Broadcast:
- [ ] Stream health remains above 80%
- [ ] Dropped frames stay at 0 or very low
- [ ] Viewer count updating (if public stream)
- [ ] Timeline looping working correctly
- [ ] Recording enabled if you want to save content

### After Broadcast:
- [ ] Stream ended gracefully in YouTube Studio
- [ ] Recording saved (if enabled)
- [ ] Stream analytics available in YouTube Studio
- [ ] No errors in VistterStudio logs

## 🌟 Pro Tips

### **Maximize Stream Quality**
- **Stable Internet**: Wired connection preferred over WiFi
- **Dedicated Upload**: Avoid other uploads during streaming
- **Consistent Bitrate**: Keep bitrate steady for best quality
- **Test First**: Always test with private stream before going public

### **Engage Your Audience**
- **Interactive Timeline**: Switch between cameras for variety
- **Scheduled Content**: Use timeline to schedule different content types
- **Live Graphics**: Add overlays and text for professional look
- **Chat Integration**: Monitor YouTube chat while streaming

### **24/7 Streaming Strategy**
- **Loop Content**: Create 1-4 hour timeline that loops
- **Variety**: Mix cameras, videos, and graphics
- **Scheduled Updates**: Update timeline content periodically
- **Monitor Health**: Check stream health regularly

---

**🎬 You're now ready for professional YouTube Live broadcasting with VistterStudio!** 

Your timeline-driven approach gives you unique automation capabilities that most streamers don't have. Use this power to create engaging, professional streams that run automatically! ✨
