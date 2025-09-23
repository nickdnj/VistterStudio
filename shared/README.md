# VistterStudio Shared

Shared types, schemas, and utilities used across the VistterStudio ecosystem.

## Architecture

The shared package provides common interfaces and utilities for:

- **Timeline Data Structures**: Core timeline and segment definitions
- **Asset Management**: Asset and API configuration types
- **Data Schemas**: JSON schemas for validation
- **Utilities**: Common helper functions

## Development

### Prerequisites

- Node.js >= 18.0.0
- TypeScript >= 5.0.0

### Setup

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode for development
npm run dev
```

## Project Structure

```
shared/
├── types/             # TypeScript type definitions
│   └── index.ts       # Main type exports
├── schemas/           # JSON schemas
│   └── timeline.json  # Timeline schema
├── utils/             # Utility functions
└── tsconfig.json      # TypeScript configuration
```

## Exported Types

### Core Types

- `TimelineSegment` - Complete timeline segment structure
- `Track` - Timeline track definition
- `Clip` - Individual timeline clip
- `Asset` - Media asset definition
- `AssetReference` - Reference to asset in timeline

### Data Types

- `WeatherData` - Weather API data structure
- `TideData` - Tide information structure
- `AdData` - Advertisement data structure

### Configuration Types

- `ApiConfig` - External API configuration
- `TimeScale` - Timeline time scaling
- `Viewport` - Timeline viewport settings

## Usage

```typescript
import { TimelineSegment, Track, Clip } from '@vistterstudio/shared';

// Create a new timeline segment
const segment: TimelineSegment = {
  version: '1.0.0',
  metadata: {
    id: 'segment-1',
    name: 'My Timeline',
    duration: 60000,
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  },
  tracks: [],
  assets: [],
  apiConfigs: []
};
```

### Segment Utilities

Sanitise and resolve segment identifiers with the shared helper so every service applies identical validation rules:

```typescript
import { normalizeSegmentId, resolveSegmentPath } from '@vistterstudio/shared/utils/segments';

const id = normalizeSegmentId('intro.json');
const { filePath } = resolveSegmentPath('/app/data/segments', id);
```

## Schema Validation

The package includes JSON schemas for validating timeline data:

```typescript
import { validateTimelineSegment } from '@vistterstudio/shared';

const isValid = validateTimelineSegment(segmentData);
```
