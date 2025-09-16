# VistterStudio

Transform your scenic location into a compelling digital destination through automated place-based visual storytelling.

## Architecture

VistterStudio is built as a two-component system:

- **Cloud Editor**: Web-based timeline editor for creating visual storytelling content
- **Broadcast Node**: Headless Raspberry Pi runtime for executing timeline segments

## Quick Start

### Cloud Editor

```bash
cd cloud-editor
npm install
npm run dev
```

### Broadcast Node

```bash
cd broadcast-node
docker build -t vistterstudio-broadcast-node .
docker run -d --name broadcast-node vistterstudio-broadcast-node
```

## Project Structure

```
VistterStudio/
├── cloud-editor/        # Web UI for timeline editing
├── broadcast-node/      # Headless Raspberry Pi runtime
├── shared/              # Common types and schemas
├── legacy/              # Legacy code and components
└── docs/                # Documentation
```

## Features

### Cloud Editor
- **Timeline Editor**: Drag-and-drop interface for creating visual storytelling timelines
- **Asset Management**: Upload and manage PNG/JPEG images, promotional graphics, and overlay assets
- **Dynamic Data Integration**: Weather, tide, and advertising API integration
- **Ad Management**: Insert ads directly into livestreams with scheduling and rotation
- **JSON Export**: Export timelines as JSON segments for broadcast node execution

### Broadcast Node
- **Timeline Execution**: Interpret and execute JSON timeline segments
- **Asset Synchronization**: Download and cache static assets from cloud
- **Dynamic Data Processing**: Fetch real-time data for weather, tide, and ads
- **Camera Integration**: Connect to existing security cameras and IP cameras
- **Video Processing**: FFmpeg-based video processing with overlays

## Documentation

- [Product Requirements Document](docs/PRD.md)
- [Software Architecture Document](docs/SAD.md)
- [User Experience Design](docs/UXD.md)
- [Quality Assurance](docs/QA.md)
- [External Marketing Document](docs/EMD.md)

## Development

### Prerequisites

- Node.js 18+
- Docker
- FFmpeg (for broadcast node)

### Setup

1. Clone the repository
2. Install dependencies for each component
3. Configure environment variables
4. Start development servers

### Environment Variables

#### Cloud Editor
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`

#### Broadcast Node
- `FIREBASE_CONFIG`
- `CAMERA_CONFIG`
- `API_CONFIGS`
- `OUTPUT_CONFIG`

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For support and questions, please open an issue on GitHub.