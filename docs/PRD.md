# Product Requirements Document (PRD): VistterStudio Cloud Editor + Broadcast Node

This document outlines the product requirements for VistterStudio, a two-component system for professional video production and broadcasting workflows with cloud-based editing and edge-based execution.

## 1. Elevator Pitch

VistterStudio transforms beautiful, static camera views into engaging, monetizable live broadcasts. Turn your existing security cameras, webcams, and IP cameras into active digital windows that inform, inspire, and advertise. Whether it's a surf shop showcasing beach conditions with real-time tide data, a marina displaying weather overlays and local promotions, or a restaurant broadcasting sunset views with live menu updates—VistterStudio automates place-based visual broadcasting that keeps audiences engaged and drives business value. No person-led broadcasting required—just passive cameras turned into compelling livestreams with real-time info overlays, contextual data, and community promotions that make your location a destination worth watching.

## 2. Target Audience

*   **Location-Based Businesses:** Surf shops, marinas, restaurants, hotels, and retail stores with scenic views who want to transform their existing security cameras into engaging live broadcasts that showcase their location, weather conditions, and local promotions to drive foot traffic and online engagement.
*   **Tourism & Hospitality:** Hotels, resorts, tourist attractions, and visitor centers that want to create compelling live streams of their scenic locations with real-time weather data, local information, and promotional content to attract visitors and enhance their digital presence.
*   **Community Organizations:** Local chambers of commerce, visitor bureaus, and community groups that want to create automated live streams showcasing their area's beauty, events, and local businesses with real-time overlays and community information.
*   **Weather & Environmental Monitoring:** Organizations monitoring beaches, parks, wildlife areas, or environmental conditions who want to create informative live streams with real-time data overlays, weather information, and educational content for public awareness.
*   **Local Media & Content Creators:** Small-scale broadcasters, local news outlets, and content creators who want to create automated live streams from multiple scenic locations with professional overlays, real-time data, and community-focused content.
*   **Property Managers & Real Estate:** Property managers, real estate agencies, and vacation rental owners who want to showcase their properties with live streams that highlight the location's appeal, weather conditions, and local amenities.

## 3. Functional Requirements

### Cloud Editor Requirements

**User Authentication & Collaboration:**
*   **Multi-User Authentication:** Firebase Auth integration with email/password, Google OAuth, and custom token support
*   **Project Sharing:** Users can share projects with team members and control access permissions
*   **Real-Time Collaboration:** Multiple users can edit the same timeline simultaneously with conflict resolution
*   **User Management:** Admin controls for team management and project permissions

**Timeline-Based Editing:**
*   **Drag-and-Drop Interface:** Users can drag cameras and assets from the sidebar directly onto timeline tracks
*   **Multi-Track Timeline:** Support for multiple video, audio, and overlay tracks with proper layering
*   **Static Thumbnail Preview:** Timeline preview using static thumbnails (no live streaming required for editing)
*   **Timeline Playback Controls:** Play, pause, stop, and seek functionality with looping support
*   **Timeline Export:** Export completed timelines as JSON segments for broadcast node execution

**Asset Management:**
*   **Static Asset Library:** Support for PNG/JPEG images, promotional graphics, logos, and overlay assets with Firebase Storage integration
*   **Asset Upload System:** Built-in asset upload with progress tracking and validation for static images
*   **Asset Timeline Integration:** Drag-and-drop static assets onto timeline tracks with automatic duration handling
*   **Thumbnail Generation:** Automatic thumbnail generation for video assets, camera feeds, and static overlays
*   **Asset Export Pipeline:** Static assets are exported as PNG/JPEG files and packaged with timeline JSON for broadcast nodes

**Dynamic Data Integration:**
*   **Weather API Integration:** Real-time weather data from external APIs (temperature, wind, forecast, conditions)
*   **Tide API Integration:** NOAA/NOAA-compatible tide data (high/low tide times, water levels, moon phase)
*   **Advertising API Integration:** Custom ad service APIs for dynamic ad content (creative, copy, links, rotation schedules)
*   **Gadget Creation System:** Users can design weather boxes, tide tables, and other data-driven overlays
*   **Ad Placeholder System:** Dynamic ads use placeholders (e.g., `{ad_creative}`, `{ad_copy}`, `{ad_link}`) for real-time content
*   **Placeholder System:** Dynamic gadgets use placeholders (e.g., `{temp}`, `{wind}`, `{tide}`) for real-time data
*   **API Configuration:** Cloud editor allows users to configure API endpoints and data mapping for dynamic overlays and ads

**Camera Configuration:**
*   **RTMP Camera Support:** Support for RTMP IP cameras (Reolink, Hikvision, Dahua, etc.) with secure credential management
*   **Camera Ingest Integration:** Support for IP cameras through camera ingest container
*   **Camera Management:** Users can add, configure, and manage multiple cameras through a dedicated UI
*   **Static Thumbnail Display:** Camera feeds display as static thumbnails in the editor (no live streaming)

### Broadcast Node Requirements

**Segment Execution:**
*   **JSON Segment Processing:** Interpret and execute video segments defined in JSON format with asset references
*   **Schedule Management:** Execute segments based on predefined schedules and timing
*   **Camera Integration:** Connect to local RTMP cameras and camera ingest containers for live video feeds
*   **Video Processing:** FFmpeg-based video processing with static overlays, dynamic gadgets, and effects

**Asset Management:**
*   **Static Asset Sync:** Download PNG/JPEG assets from cloud and cache locally for timeline execution
*   **Dynamic Asset Resolution:** Fetch real-time data for weather/tide gadgets using API instructions from JSON
*   **Ad Asset Management:** Download static ad creatives and fetch dynamic ad content from ad APIs
*   **Ad Rotation Handling:** Process ad rotation schedules and time-bound ad slots (e.g., 6-9 PM only)
*   **Asset Rendering:** Render dynamic overlays with live data (weather, tide, time, ads) as overlay images
*   **Asset Caching:** Cache both static and dynamically generated assets (including ads) for offline operation

**Cloud Synchronization:**
*   **Segment Download:** Periodically sync with cloud to download new segments, assets, and API configurations
*   **Status Reporting:** Report execution status, camera health, asset sync status, and system metrics to cloud
*   **Authentication:** Secure authentication with Firebase using service account credentials
*   **Offline Operation:** Continue operation with cached segments and assets when cloud connectivity is unavailable

**Camera Management:**
*   **RTMP Camera Support:** Connect to and manage RTMP IP cameras with credential storage
*   **Camera Ingest Integration:** Integrate with camera ingest container for IP camera access
*   **Camera Status Monitoring:** Real-time monitoring of camera connection status and stream health
*   **Stream Processing:** Process live camera feeds according to segment specifications

### Security & Authentication
*   **Cloud Security:** Firebase Auth with Firestore security rules for data access control
*   **Credential Storage:** Secure storage of camera credentials and API keys in environment variables
*   **API Security:** RESTful APIs with proper authentication and authorization
*   **Data Encryption:** Encrypted data transmission between cloud and broadcast nodes

## 4. User Stories

### Cloud Editor - Place-Based Visual Storytelling
*   **As a marina owner,** I want to create automated livestreams showcasing my harbor view with real-time tide data and local weather so that I can attract boaters and drive business to my marina.
*   **As a surf shop manager,** I want to broadcast beach conditions with surf height, wind speed, and local event information so that I can engage the surfing community and promote my shop.
*   **As a restaurant owner,** I want to showcase my scenic view with sunset timers, daily specials, and local promotions so that I can create an engaging digital presence that drives foot traffic.

### Cloud Editor - Asset Management
*   **As a business owner,** I want to upload promotional graphics, local event flyers, and menu updates so that I can overlay them on my scenic camera feed.
*   **As a location manager,** I want to drag weather widgets, tide charts, and time displays onto my timeline so that I can create informative overlays for my live stream.
*   **As a marketing coordinator,** I want to see thumbnails of all my promotional assets so that I can quickly update my live stream with current offers and events.

### Cloud Editor - Dynamic Data Integration
*   **As a marina owner,** I want to add real-time tide information to my harbor view so that boaters can see current water levels and tide times.
*   **As a surf shop manager,** I want to display live weather conditions and surf height on my beach camera feed so that surfers know the current conditions.
*   **As a restaurant owner,** I want to show sunset times and current temperature on my scenic view so that diners know the best time to visit.
*   **As a hotel manager,** I want to create weather gadgets that automatically update with current conditions so that guests can see the weather at my location.
*   **As a business owner,** I want to configure API endpoints for weather and tide data so that my overlays always show current information.

### Cloud Editor - Advertising Integration
*   **As a surf shop owner,** I want to insert local business ads into my livestream so that I can monetize my scenic beach view.
*   **As a restaurant owner,** I want happy hour ads to appear automatically between 5-7 PM so that I can promote my specials during peak hours.
*   **As a marina manager,** I want to schedule boat rental ads during weekend hours so that I can drive business to my marina.
*   **As a hotel owner,** I want to rotate different local attraction ads throughout the day so that I can promote area businesses and earn ad revenue.
*   **As a business owner,** I want to configure ad API endpoints so that my livestream can display dynamic ad content from external ad services.
*   **As a location operator,** I want to upload static ad creatives and schedule them on my timeline so that I can promote my own business or local partners.

### Cloud Editor - Camera Configuration
*   **As a property owner,** I want to connect my existing security cameras to the cloud editor so that I can transform them into engaging live broadcasts.
*   **As a business manager,** I want to see static thumbnails of my camera views so that I can select the best angles for my automated livestream.
*   **As a location operator,** I want to configure multiple camera angles so that I can create dynamic visual storytelling that showcases different aspects of my property.

### Cloud Editor - Export & Publishing
*   **As a scenic business owner,** I want to export my visual storytelling timeline as a JSON segment so that it can run automatically on my broadcast node.
*   **As a location manager,** I want to set up automated schedules so that my livestream updates with different content throughout the day.
*   **As a business operator,** I want to publish segments to my local broadcast node so that I can showcase my location 24/7 without manual intervention.

### Broadcast Node - Setup & Configuration
*   **As a scenic business owner,** I want to deploy a broadcast node at my location so that I can automatically showcase my view to the world.
*   **As a property manager,** I want to connect my existing security cameras to the broadcast node so that I can transform passive monitoring into active visual storytelling.
*   **As a location operator,** I want to monitor my broadcast node status so that I can ensure my scenic livestream is always running and engaging viewers.

### Broadcast Node - Execution & Monitoring
*   **As a business owner,** I want my broadcast node to automatically run my visual storytelling segments so that my location is always showcased without manual operation.
*   **As a marina manager,** I want to see real-time execution status so that I can ensure my harbor view is always compelling and informative.
*   **As a location operator,** I want to receive alerts when my scenic livestream fails so that I can quickly restore my digital presence.

### Broadcast Node - Asset Management
*   **As a broadcast node operator,** I want my node to automatically download static assets (PNG/JPEG) from the cloud so that overlays display correctly.
*   **As a marina owner,** I want my broadcast node to fetch real-time tide data and render it as an overlay so that boaters see current water levels.
*   **As a surf shop manager,** I want my broadcast node to get live weather data and display it on my beach camera feed so that surfers see current conditions.
*   **As a business owner,** I want my broadcast node to cache assets locally so that my scenic livestream continues working even when offline.
*   **As a location operator,** I want my broadcast node to report asset sync status so that I can ensure all overlays are up to date.

### Broadcast Node - Advertising Management
*   **As a broadcast node operator,** I want my node to fetch dynamic ad content from ad APIs so that my livestream displays current advertisements.
*   **As a restaurant owner,** I want my broadcast node to rotate different ads every 5 minutes so that I can showcase multiple local businesses.
*   **As a marina manager,** I want my broadcast node to only show boat rental ads during weekend hours so that I can target the right audience.
*   **As a hotel owner,** I want my broadcast node to cache ad creatives locally so that ads continue displaying even when offline.
*   **As a business operator,** I want my broadcast node to handle ad rotation schedules so that different ads appear at the right times throughout the day.

### Multi-User & Collaboration
*   **As a business owner,** I want to manage access to my location's visual storytelling so that I can control who can update my livestream content.
*   **As a marketing team member,** I want to collaborate on my business's scenic livestream so that we can coordinate promotional overlays and local information.
*   **As a location manager,** I want to work on my visual storytelling timeline offline so that I can continue updating my scenic broadcast when connectivity is limited.

## 5. User Interface Design

VistterStudio provides two distinct interfaces: a cloud-based editor for timeline creation and a headless broadcast node for execution.

### Cloud Editor Interface

**Main Interface Layout**

**Header Bar**
- User authentication and profile management
- Project selection and sharing controls
- Global settings and help

**Left Sidebar**
- **Asset Library:** Upload and manage images, videos, and audio files
- **Camera Configuration:** RTMP camera and camera ingest container setup (static thumbnails only)
- **Effects Gallery:** Overlay templates, transitions, and visual effects
- **Project Browser:** List of user's projects and shared projects

**Main Content Area**
- **Timeline Editor:** Multi-track timeline with drag-and-drop functionality
- **Static Preview:** Thumbnail-based preview of timeline composition (no live streaming)
- **Transport Controls:** Play, pause, stop, and seek functionality

**Right Panel**
- **Properties Panel:** Real-time control of selected timeline elements
- **Export Controls:** Segment export and scheduling options
- **Collaboration Panel:** User presence and real-time editing indicators

### Camera Configuration Interface

**Camera Management Section**
- Camera list showing: name, type (RTMP/IP), static thumbnail, configuration status
- "Add Camera" button with configuration forms
- Drag handles for timeline integration
- Edit/delete buttons for camera management

**RTMP Camera Configuration Form**
- Camera name (user-friendly identifier)
- Host/IP address input with validation
- Port number (default: 1935)
- Channel and stream parameters
- Username and password fields (securely stored in cloud)
- Static thumbnail generation

**IP Camera Configuration**
- Camera ingest container connection settings
- Camera selection from available IP devices
- Static thumbnail generation from IP camera feeds

### Timeline Interface

**Track Management**
- Video tracks for main camera content and video assets
- Overlay tracks for graphics, images, and secondary cameras
- Audio tracks for sound sources and background music
- Track controls: visibility, mute, lock, delete

**Clip Manipulation**
- Drag cameras/assets from sidebar to timeline tracks
- Visual clip representation with static thumbnails
- Trim handles for duration adjustment
- Context menus for clip operations

### Export & Publishing Interface

**Segment Export Panel**
- Timeline to JSON conversion controls
- Segment metadata and naming
- Scheduling and timing configuration
- Broadcast node assignment

**Broadcast Node Management**
- List of registered broadcast nodes
- Node status and health monitoring
- Segment distribution controls
- Remote configuration options

### Broadcast Node Interface (Optional Web UI)

**Status Dashboard**
- Real-time execution status
- Camera connectivity indicators
- Segment queue and progress
- System health metrics

**Configuration Panel**
- Camera connection settings
- Sync preferences and schedules
- Log viewing and filtering
- Emergency controls (stop/start)

### JSON Segment Format

**Segment Structure**
```json
{
  "id": "segment_001",
  "name": "Morning News Intro",
  "duration": 30000,
  "tracks": [
    {
      "type": "video",
      "source": "camera_rtmp_001",
      "startTime": 0,
      "duration": 30000,
      "position": { "x": 0, "y": 0 },
      "scale": 1.0,
      "opacity": 1.0
    },
    {
      "type": "overlay",
      "source": "logo_asset_001",
      "startTime": 5000,
      "duration": 25000,
      "position": { "x": 50, "y": 50 },
      "scale": 0.5,
      "opacity": 0.8
    }
  ]
}
```

**Camera Source References**
- RTMP cameras: `rtmp://<host>:<port>/bcs/channel<channel>_ext.bcs?channel=<channel>&stream=<stream>&user=<username>&password=<password>`
- IP cameras: `ip://<device_id>/<stream_type>`
- Asset files: `asset://<asset_id>/<filename>`

## 6. Timeline Architecture (v2)

### Time Domain Model

The timeline operates on a **time-first principle** where all positioning and scaling is calculated based on time values, not pixel dimensions.

#### TimeScale Class

The `TimeScale` class handles all time↔pixel conversions:

```typescript
class TimeScale {
  constructor(
    public msPerPx: number,        // Milliseconds per pixel
    public viewStartMs: number,    // Start time of visible area
    public contentOffsetPx: number // Width of labels column (192px)
  )
  
  xOf(timeMs: number): number     // Convert time to pixel position
  tOf(pixelX: number): number     // Convert pixel to time
  setVisibleDuration(durationMs: number, anchorPx?: number): TimeScale
  panByPixels(deltaX: number): TimeScale
}
```

**Key Benefits:**
- Consistent positioning at all zoom levels
- No CSS transform scaling hacks
- Precise time calculations
- Easy snapping and alignment

### Timeline State Management

Uses Zustand for centralized state management with Firebase Firestore for cloud synchronization:

```typescript
interface TimelineState {
  // Time domain
  currentTimeMs: number;
  isPlaying: boolean;
  playbackRate: PlaybackRate;
  
  // Viewport
  viewport: TimelineViewport;
  timeScale: TimeScale;
  
  // Content
  tracks: Track[];
  clips: Clip[];
  selectedClipId: string | null;
  
  // Interaction state
  dragState: DragState;
  
  // Cloud collaboration
  collaborators: Collaborator[];
  syncStatus: SyncStatus;
  offlineMode: boolean;
}
```

**Store Features:**
- Real-time playback engine using `requestAnimationFrame`
- Firebase Firestore integration for cloud synchronization
- Real-time collaboration with conflict resolution
- Offline mode with local state persistence
- Optimized updates with selective subscriptions
- Undo/redo capability with cloud sync

### Timeline Component Architecture

#### Timeline (Main Container)
- Handles viewport management and scrolling
- Coordinates all child components
- Manages wheel events for zoom/pan
- Provides resize observer for responsive behavior

#### HeaderRuler
- Generates "nice" tick intervals based on zoom level
- Renders time labels at consistent font sizes
- Updates automatically when viewport changes
- Supports multiple time formats

#### Playhead
- Draggable red line indicating current time
- Keyboard navigation (←/→ for nudge, Home/End for jump)
- Smooth scrubbing with snapping
- Visual feedback during drag operations

#### TracksSurface
- Renders track headers with controls (visibility, mute, lock)
- Handles drag-and-drop from sidebar
- Manages track ordering and layout
- Provides visual drop zones

#### ClipView
- Individual clip rendering and interaction
- Drag to move, resize handles for duration editing
- Visual feedback for selection and hover states
- Context menu for clip operations

#### TimelineTransport
- Play/pause/stop controls
- Playback rate selection (0.5x, 1x, 2x)
- Zoom preset buttons
- Timecode display
- Keyboard shortcuts (Space, J/K/L)

#### PropertiesDock
- Live editing of selected clip properties
- Time values (start, duration, end)
- Visual properties (opacity, name)
- Source information display
- Clip operations (duplicate, delete)

### Data Models

#### Track
```typescript
interface Track {
  id: string;
  name: string;
  kind: 'video' | 'overlay' | 'audio';
  order: number;
  color: string;        // Tailwind class
  isVisible: boolean;
  isMuted: boolean;
  isLocked: boolean;
}
```

#### Clip
```typescript
interface Clip {
  id: string;
  trackId: string;
  kind: 'video' | 'overlay' | 'audio';
  sourceId: string;     // Camera ID or asset ID
  startMs: number;
  durationMs: number;
  opacity?: number;
  enabled?: boolean;
  name?: string;
  
  // Legacy compatibility
  cameraId?: string;
  camera?: any;
  asset?: any;
}
```

### Interaction System

#### Drag and Drop
**From Sidebar to Timeline:**
1. Sidebar items (cameras/assets) have `draggable` attribute
2. `onDragStart` sets `dataTransfer` with JSON payload
3. Track drop zones handle `onDrop` events
4. Drop position converted to time using `timeScale.tOf()`
5. New clip created with snapped start time

**Clip Movement:**
1. `ClipView` handles `onMouseDown` on clip body
2. Global mouse events track movement
3. Position updates calculated in time domain
4. Snapping applied to grid and adjacent clips
5. Store updated with new `startMs` value

**Clip Resizing:**
1. Resize handles on left/right edges of selected clips
2. Left handle adjusts both `startMs` and `durationMs`
3. Right handle adjusts only `durationMs`
4. Minimum duration enforced (500ms)
5. Visual feedback during resize operations

#### Zoom System
**Zoom Presets:**
- 30s, 1m, 2m, 5m, 10m visible duration
- Buttons in transport bar
- Maintains current playhead position when possible

**Mouse Wheel Zoom:**
- Ctrl/Cmd + wheel for zoom
- Anchored at mouse cursor position
- Smooth transitions with `requestAnimationFrame`
- Prevents browser page zoom

**Pan Navigation:**
- Horizontal scroll for timeline content
- Wheel events without modifiers
- Keyboard arrow keys for precise movement
- Automatic bounds checking (no negative time)

#### Playback Engine
**Real-time Updates:**
```typescript
// Playback loop using rAF
const tick = () => {
  if (!isPlaying) return;
  
  const deltaMs = (currentTime - lastTime) * playbackRate;
  setCurrentTime(currentTimeMs + deltaMs);
  
  requestAnimationFrame(tick);
};
```

**Features:**
- Smooth 60fps playback
- Variable playback rates (0.5x, 1x, 2x)
- Automatic pause at timeline end
- Preview updates follow playhead position

### Cloud Editor Integration

#### Static Thumbnail Preview
The cloud editor uses **static thumbnails** for timeline preview, eliminating the need for live streaming during editing:

```typescript
const { previewContent, overlays } = useTimelinePreview(assets, getThumbnailUrl);
```

**Preview Logic:**
1. Get all clips active at `currentTimeMs`
2. Find primary video content (first video track with active clip)
3. Collect overlay clips from overlay tracks
4. Return structured data for static thumbnail rendering

**Content Priority:**
1. Video tracks (cameras and video assets)
2. Overlay tracks (images and graphics)
3. Audio tracks (background audio)

**Thumbnail Integration:**
- Static thumbnails for all camera sources (RTMP and IP cameras)
- Automatic thumbnail generation for uploaded assets
- Cached thumbnails for performance optimization
- Fallback thumbnails for offline or unavailable sources

#### JSON Segment Export
Timelines are exported as JSON segments for broadcast node execution:

```typescript
interface TimelineSegment {
  id: string;
  name: string;
  duration: number;
  tracks: TrackSegment[];
  metadata: SegmentMetadata;
}

interface TrackSegment {
  type: 'video' | 'overlay' | 'audio';
  source: string; // Camera ID or asset ID
  startTime: number;
  duration: number;
  properties: ClipProperties;
}
```

**Export Process:**
1. Validate timeline for export compatibility
2. Convert timeline data to JSON segment format
3. Include asset references and camera configurations
4. Upload segment to Firebase for distribution
5. Notify broadcast nodes of new segment availability

### Performance Optimizations

#### Virtualization
- Only render clips within visible viewport
- Efficient culling of off-screen elements
- Lazy loading of clip thumbnails
- Debounced scroll updates

#### Memory Management
- Cleanup of event listeners on unmount
- Proper disposal of video elements
- Garbage collection of unused clips
- Store subscription optimization

#### Rendering Optimizations
- `requestAnimationFrame` for smooth animations
- CSS transforms for hardware acceleration
- Minimal DOM updates using React keys
- Batched state updates in Zustand
