# VistterStudio Broadcast Node

The headless Raspberry Pi runtime for executing timeline segments and broadcasting scenic locations.

## Architecture

This is the **Broadcast Node** component of VistterStudio's two-component architecture:

- **Cloud Editor**: Web UI for timeline editing and asset management
- **Broadcast Node (this repo)**: Headless runtime for executing timeline segments

## Features

- **Timeline Execution**: Interpret and execute JSON timeline segments
- **Asset Synchronization**: Download and cache static assets from cloud
- **Dynamic Data Processing**: Fetch real-time data for weather, tide, and ads
- **Camera Integration**: Connect to existing security cameras and IP cameras
- **Video Processing**: FFmpeg-based video processing with overlays
- **Cloud Sync**: Periodic synchronization with cloud for updates

## Development

### Prerequisites

- Docker
- Raspberry Pi (for deployment)
- FFmpeg

### Setup

```bash
docker build -t vistterstudio-broadcast-node .
docker run -d --name broadcast-node vistterstudio-broadcast-node
```

## Project Structure

```
broadcast-node/
├── src/
│   ├── timeline/       # Timeline execution engine
│   ├── assets/         # Asset management and caching
│   ├── cameras/        # Camera integration
│   ├── apis/           # External API integrations
│   └── ffmpeg/         # Video processing
├── config/             # Configuration files
└── Dockerfile          # Container definition
```

## Timeline Execution

The broadcast node receives JSON timeline segments from the cloud editor and executes them by:

1. **Asset Sync**: Downloading static assets and caching them locally
2. **Dynamic Data**: Fetching real-time data from configured APIs
3. **Video Processing**: Using FFmpeg to composite camera feeds with overlays
4. **Output Streaming**: Streaming processed video to configured outputs

## Asset Management

- **Static Assets**: PNG/JPEG images downloaded from Firebase Storage
- **Dynamic Overlays**: Weather, tide, and ad overlays rendered with live data
- **Local Caching**: Assets cached locally for offline operation

## API Integrations

- **Weather APIs**: Real-time weather data for dynamic overlays
- **Tide APIs**: NOAA tide data for coastal locations
- **Ad APIs**: Dynamic ad content and rotation

## Configuration

The broadcast node is configured through environment variables and JSON configuration files:

- `FIREBASE_CONFIG`: Firebase service account credentials
- `CAMERA_CONFIG`: Camera connection settings
- `API_CONFIGS`: External API configurations
- `OUTPUT_CONFIG`: Streaming output settings
