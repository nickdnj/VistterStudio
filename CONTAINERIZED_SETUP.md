# VistterStudio Containerized Development Environment

This setup simulates the full cloud-to-broadcast loop using Docker containers on macOS.

## 🏗️ Architecture

- **Cloud Editor**: React frontend + Node.js backend (ports 3000, 4000)
- **Broadcast Node**: Node.js service with FFmpeg (port 5000)
- **Shared Volume**: `/data/segments` for JSON segment handoff
- **Internal Network**: Docker network for service communication

## 🚀 Quick Start

### 1. Prerequisites

- Docker and Docker Compose installed
- YouTube Live stream key (optional, for actual streaming)

### 2. Environment Setup

```bash
# Copy environment template
cp env.example .env

# Edit .env with your YouTube stream key (optional)
# YOUTUBE_STREAM_KEY=your_youtube_stream_key_here
```

### 3. Start Services

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 4. Access Services

- **Cloud Editor**: http://localhost:3000
- **Broadcast Node UI**: http://localhost:5000
- **Cloud Editor API**: http://localhost:4000/api

## 🎯 Usage Workflow

### Step 1: Create Timeline Segment

1. Open http://localhost:3000
2. Fill in segment details:
   - Name: "My Test Stream"
   - Duration: 60 seconds
   - Stream URL: Your RTMP input (e.g., from OBS)
3. Click "Save Segment"

### Step 2: Start Broadcasting

1. Open http://localhost:5000
2. See your saved segment in the list
3. Click "Start Stream" to begin broadcasting to YouTube Live

## 🔧 Configuration

### YouTube Live Setup

1. Go to YouTube Studio > Go Live
2. Create a new stream
3. Copy the stream key
4. Set `YOUTUBE_STREAM_KEY` in your `.env` file

### Test RTMP Input

For testing without a real camera:

1. **Using OBS**:
   - Add a video source (webcam, screen capture, etc.)
   - Go to Settings > Stream
   - Set Service to "Custom"
   - Set Server to `rtmp://localhost:1935/live`
   - Set Stream Key to `test`
   - Start streaming

2. **Using FFmpeg** (test pattern):
   ```bash
   ffmpeg -f lavfi -i testsrc=duration=60:size=1920x1080:rate=30 -f flv rtmp://localhost:1935/live/test
   ```

## 📁 Project Structure

```
VistterStudio/
├── docker-compose.yml          # Container orchestration
├── data/segments/              # Shared volume for JSON segments
├── cloud-editor/
│   ├── frontend/               # React timeline editor
│   ├── backend/                # Node.js API server
│   └── Dockerfile
├── broadcast-node/
│   ├── service.js              # FFmpeg streaming service
│   └── Dockerfile
└── env.example                 # Environment template
```

## 🐛 Troubleshooting

### Common Issues

1. **FFmpeg not found**: Ensure FFmpeg is installed in the broadcast-node container
2. **Permission denied**: Check Docker volume permissions
3. **YouTube stream fails**: Verify stream key and network connectivity
4. **RTMP input not working**: Check if input stream is actually streaming

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs cloud-editor
docker-compose logs broadcast-node

# Follow logs in real-time
docker-compose logs -f broadcast-node
```

### Debug Mode

```bash
# Run broadcast-node in debug mode
docker-compose exec broadcast-node sh
# Then run: node service.js
```

## 🔄 Development Workflow

1. **Edit Cloud Editor**: Changes to `cloud-editor/` are hot-reloaded
2. **Edit Broadcast Node**: Restart container after changes
3. **Test Segments**: Use the web UI to create and test segments
4. **Monitor Streams**: Check YouTube Live for output

## 📝 API Endpoints

### Cloud Editor API (port 4000)

- `GET /api/segments` - List all segments
- `POST /api/segments` - Create new segment
- `GET /api/segments/:id` - Get specific segment
- `PUT /api/segments/:id` - Update segment
- `DELETE /api/segments/:id` - Delete segment

### Broadcast Node API (port 5000)

- `GET /api/segments` - List available segments
- `POST /api/stream/start/:segmentId` - Start streaming segment
- `POST /api/stream/stop` - Stop current stream
- `GET /api/stream/status` - Get streaming status
- `GET /api/health` - Health check

## 🎯 Next Steps

This is Step 1 of the containerized development environment. Future enhancements:

- [ ] Add asset management and overlays
- [ ] Implement Firebase authentication
- [ ] Add real-time segment synchronization
- [ ] Create more sophisticated timeline editor
- [ ] Add HLS preview for debugging



