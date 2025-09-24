# VistterStudio Broadcast Node

Headless Raspberry Pi runtime for executing VistterStudio timeline segments in production environments.

## Architecture

The Broadcast Node is designed to run on Raspberry Pi devices and execute pre-defined timeline segments:

- **Runtime**: Node.js + Express
- **Media Processing**: FFmpeg integration
- **Camera Management**: RTMP camera support
- **Media Management**: Local media caching and synchronization

## Development

### Prerequisites

- Node.js >= 18.0.0
- FFmpeg (for video processing)
- Docker (for containerized deployment)

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

### Docker Deployment

```bash
# Build Docker image
docker build -t vistterstudio-broadcast-node .

# Run container
docker run -d --name broadcast-node vistterstudio-broadcast-node
```

## Project Structure

```
broadcast-node/
├── src/
│   ├── apis/          # External API integrations
│   ├── media/        # Media management
│   ├── cameras/       # Camera management
│   ├── ffmpeg/        # Video processing
│   └── timeline/      # Timeline execution engine
├── data/
│   └── segments/      # Timeline segment storage
├── service.js         # Main service entry point
└── Dockerfile         # Container configuration
```

## Features

- **Timeline Execution**: Interpret and execute JSON timeline segments
- **Media Synchronization**: Download and cache media from cloud
- **Camera Integration**: Connect to RTMP cameras and IP cameras
- **Video Processing**: FFmpeg-based video processing with overlays
- **Dynamic Data**: Fetch real-time data for weather, tide, and ads

## Configuration

Environment variables:

- `PORT` - Server port (default: 3000)
- `SEGMENTS_PATH` - Path to segments directory
- `MEDIA_PATH` - Path to media directory
- `FFMPEG_PATH` - Path to FFmpeg binary

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/segments` - List available segments
- `POST /api/execute/:id` - Execute timeline segment
- `GET /api/status` - Current execution status
