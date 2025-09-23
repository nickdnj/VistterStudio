# VistterStudio

Transform your scenic location into a compelling digital destination through automated place-based visual storytelling.

## Architecture

VistterStudio is built as a two-component system:

- **Cloud Editor**: Web-based timeline editor for creating visual storytelling content
- **Broadcast Node**: Headless Raspberry Pi runtime for executing timeline segments

## Quick Start (Local Development)

```bash
# install dependencies across all workspaces
npm install

# start the Express API on http://localhost:4000
npm run dev:backend

# in a second terminal, start the Vite dev server on http://localhost:5173
npm run dev:frontend
```

The backend reads/writes timeline segments under `data/segments/`. The frontend proxies API calls to `http://localhost:4000` by default.

The repository ships with a starter timeline at `data/segments/demo-morning.json`. Once both servers are running, open http://localhost:5173 to load the GUI, save edits, and verify the segment list updates in real time.

## Phase 1 Verification Checklist

These commands confirm the local development foundation before moving into containerised or cloud deployments:

- `npm run build --workspace=cloud-editor/frontend`
- `npm run dev:backend`
- `npm run dev:frontend`
- `npm run test --workspace=cloud-editor/backend`

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

Copy `.env.example` to `.env` at the repository root and adjust as needed.

#### Cloud Editor Backend
- `PORT` – HTTP port for the Express API (defaults to `4000`)
- `SEGMENTS_PATH` – Directory containing JSON segment definitions (defaults to `../../data/segments`)

#### Cloud Editor Frontend
- `VITE_API_URL` – Base URL the React app uses for API requests (defaults to `http://localhost:4000`)

#### Broadcast Node
- `YOUTUBE_STREAM_KEY` – Stream key used when pushing to YouTube Live
- `YOUTUBE_RTMP_URL` – RTMP ingest URL for YouTube (defaults to `rtmp://a.rtmp.youtube.com/live2`)
- `TEST_RTMP_INPUT` – Optional RTMP source used for local testing

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For support and questions, please open an issue on GitHub.
