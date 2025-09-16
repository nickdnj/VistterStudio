# VistterStudio Shared

Common types, schemas, and utilities shared between the cloud editor and broadcast node.

## Contents

- **Types**: TypeScript type definitions for timeline segments, assets, and API configurations
- **Schemas**: JSON schemas for timeline segments and data validation
- **Utils**: Common utility functions and constants
- **Constants**: Shared constants and configuration values

## Timeline Schema

The timeline JSON schema defines the format for timeline segments exported from the cloud editor to broadcast nodes. It includes:

- **Metadata**: Segment information and timing
- **Tracks**: Video, overlay, audio, and ad tracks
- **Assets**: Static and dynamic asset references
- **API Configs**: External API configurations for dynamic data

## Types

Common TypeScript interfaces used across both components:

- `TimelineSegment`: Complete timeline segment structure
- `Track`: Individual timeline tracks
- `Clip`: Timeline clips with timing and positioning
- `Asset`: Asset references and metadata
- `ApiConfig`: External API configuration

## Usage

Import types and utilities in both cloud-editor and broadcast-node:

```typescript
import { TimelineSegment, Track, Clip } from '../shared/types';
import timelineSchema from '../shared/schemas/timeline.json';
```

## Validation

Use the JSON schema to validate timeline segments:

```typescript
import Ajv from 'ajv';
import timelineSchema from './schemas/timeline.json';

const ajv = new Ajv();
const validate = ajv.compile(timelineSchema);
const isValid = validate(timelineSegment);
```
