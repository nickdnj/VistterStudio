# VistterStudio Cloud Editor

The cloud-based web application for creating and managing place-based visual storytelling timelines.

## Architecture

This is the **Cloud Editor** component of VistterStudio's two-component architecture:

- **Cloud Editor (this repo)**: Web UI for timeline editing, asset management, and JSON export
- **Broadcast Node**: Headless Raspberry Pi runtime for executing timeline segments

## Features

- **Timeline Editor**: Drag-and-drop interface for creating visual storytelling timelines
- **Asset Management**: Upload and manage PNG/JPEG images, promotional graphics, and overlay assets
- **Dynamic Data Integration**: Weather, tide, and advertising API integration
- **Ad Management**: Insert ads directly into livestreams with scheduling and rotation
- **JSON Export**: Export timelines as JSON segments for broadcast node execution

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

## Project Structure

```
cloud-editor/
├── timeline/           # Timeline editor components and state
├── components/         # React components
├── effects/           # Visual effects and overlays
├── utils/             # Utility functions
└── shared/            # Shared types and schemas
```

## Timeline Architecture

The timeline editor uses a time-domain model where all operations are based on time values (milliseconds) rather than pixel dimensions. This ensures consistent behavior across different zoom levels and screen sizes.

### Key Components

- **TimelineEngine**: Core timeline logic and state management
- **TimelineRenderer**: Visual timeline rendering
- **TimeScale**: Time-to-pixel conversion utilities
- **TracksSurface**: Track management and clip positioning

## Asset Management

- **Static Assets**: PNG/JPEG images uploaded to Firebase Storage
- **Dynamic Gadgets**: Weather boxes, tide tables with placeholder system
- **Ad Integration**: Static ad creatives and dynamic ad API integration

## Export Format

Timelines are exported as JSON segments containing:
- Track definitions with clips and timing
- Asset references and metadata
- API configurations for dynamic data
- Ad scheduling and rotation logic
