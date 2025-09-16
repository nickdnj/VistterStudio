# User Experience Design Document (UXD): VistterStudio Cloud Editor + Broadcast Node

This document outlines the user experience and design for VistterStudio's two-component architecture: a cloud-based editor for place-based visual storytelling timeline creation and a headless broadcast node for automated scenic location broadcasting.

## Cloud Editor: Web-Based Timeline Interface

The Cloud Editor is a modern web application that provides the primary user interface for creating, editing, and managing place-based visual storytelling timelines that showcase scenic business locations.

### 1. Layout Structure

A professional single-page application (SPA) designed for place-based visual storytelling workflows:

*   **Header Bar:** User authentication, project selection, and global controls
*   **Left Sidebar:** Asset library, camera management, and effects gallery
*   **Main Content Area:** Timeline editor with multi-track interface, time-domain precision, and advanced controls
*   **Right Panel:** Properties and settings for selected elements
*   **Bottom Panel:** Transport controls and timecode display

### 2. Core Components

**Authentication & Project Management:**
*   **Login/Register:** Firebase Auth integration with email/password and Google OAuth
*   **Project Dashboard:** List of user's projects with sharing and collaboration options
*   **User Profile:** Account settings, preferences, and team management

**Timeline Editor:**
*   **Multi-Track Timeline:** Drag-and-drop interface for video, overlay, audio, and ad tracks with time-domain precision
*   **Static Asset Library:** Upload and manage PNG/JPEG images, promotional graphics, logos, and overlay assets with automatic thumbnail generation
*   **Dynamic Gadget Creation:** Design weather boxes, tide tables, and time displays with placeholder system for real-time data
*   **Ad Track Management:** Dedicated ad track for inserting static ad creatives and dynamic ad placeholders
*   **Asset Drag & Drop:** Drag static assets, dynamic gadgets, and ad placeholders onto timeline canvas with resize and positioning controls
*   **Ad Scheduling Controls:** Set start/end times, rotation schedules, and time-bound ad slots (e.g., 6-9 PM only)
*   **Camera Management:** Configure RTMP cameras and camera ingest container connections with static thumbnail preview
*   **API Integration Panel:** Configure external APIs for weather, tide data, and ad services with data mapping interface
*   **Advanced Timeline Controls:** Zoom, pan, snap, and precise time editing with keyboard shortcuts

**Export & Publishing:**
*   **Segment Export:** Convert timelines to JSON segments for broadcast nodes
*   **Scheduling Interface:** Set up automated segment execution schedules
*   **Broadcast Node Management:** Monitor and configure remote broadcast nodes

### 3. Interaction Patterns

**Timeline Creation:**
1.  **Project Setup:** User creates new project and configures basic settings
2.  **Static Asset Upload:** User uploads PNG/JPEG images, promotional graphics, logos, and ad creatives to asset library
3.  **Dynamic Gadget Creation:** User designs weather boxes, tide tables, and time displays with placeholder system
4.  **Ad Configuration:** User configures ad API endpoints and creates ad placeholders with scheduling and rotation logic
5.  **API Configuration:** User configures external APIs for weather, tide data, and ad services with data mapping
6.  **Asset Placement:** User drags static assets, dynamic gadgets, and ad placeholders onto timeline canvas with resize and positioning
7.  **Ad Scheduling:** User sets start/end times, rotation schedules, and time-bound ad slots for monetizable overlays
8.  **Camera Configuration:** User configures camera sources and previews with static thumbnails
9.  **Timeline Editing:** User arranges timing and layering of assets, gadgets, and ads on timeline tracks
10. **Preview & Refinement:** User previews timeline using static thumbnails (no live streaming required)
11. **Export & Publish:** User exports timeline as JSON segment with asset references, API instructions, and ad scheduling metadata

**Collaborative Editing:**
*   **Real-time Sync:** Multiple users can edit the same timeline simultaneously
*   **User Presence:** Visual indicators show which users are currently editing
*   **Conflict Resolution:** Automatic merging of non-conflicting changes with manual resolution for conflicts

### 4. Visual Design & Color Scheme

**Theme:** Professional dark theme optimized for video production environments

**Color Palette:**
*   **Primary:** Deep Blue (#1e3a8a) for interactive elements and branding
*   **Secondary:** Electric Blue (#3b82f6) for highlights and active states
*   **Background:** Dark Gray (#0f172a) for main interface areas
*   **Surface:** Medium Gray (#1e293b) for panels and cards
*   **Text:** Light Gray (#f1f5f9) for primary text, muted gray (#64748b) for secondary
*   **Success:** Green (#10b981) for online status and confirmations
*   **Warning:** Amber (#f59e0b) for alerts and pending states
*   **Error:** Red (#ef4444) for errors and critical alerts

**Typography:** Inter font family for excellent readability and modern appearance

### 5. Asset Management Interface Design

**Static Asset Library:**
*   **Asset Grid:** Thumbnail grid view of uploaded PNG/JPEG images with drag handles
*   **Upload Interface:** Drag-and-drop upload area with progress indicators and file validation
*   **Asset Properties:** Side panel showing asset dimensions, file size, and metadata
*   **Search & Filter:** Search by filename and filter by asset type (logos, overlays, promotional, ads)

**Dynamic Gadget Creation:**
*   **Gadget Templates:** Pre-built templates for weather boxes, tide tables, and time displays
*   **Placeholder Editor:** Visual editor for configuring placeholder variables (e.g., `{temp}`, `{wind}`, `{tide}`)
*   **API Configuration:** Form-based interface for setting up external API endpoints and data mapping
*   **Preview Mode:** Live preview of gadgets with sample data to test appearance

**Ad Management Interface:**
*   **Ad Track:** Dedicated timeline track for ad placement with visual indicators
*   **Ad Templates:** Pre-built templates for ad overlays with placeholder system for dynamic content
*   **Ad Scheduling Panel:** Time-based controls for start/end times, rotation schedules, and time-bound slots
*   **Ad API Configuration:** Interface for setting up ad service APIs and dynamic ad content delivery
*   **Ad Preview Mode:** Live preview of ad overlays with sample content and scheduling visualization

**Timeline Canvas:**
*   **Asset Drag & Drop:** Drag assets from library onto timeline canvas with visual feedback
*   **Resize Handles:** Corner and edge handles for resizing assets on canvas
*   **Positioning Controls:** Precise positioning with X/Y coordinates and alignment guides
*   **Layer Management:** Visual layer stack with drag-and-drop reordering
*   **Snap-to-Grid:** Optional grid snapping for precise asset alignment

### 6. Platform Considerations

*   **Browser Support:** Modern browsers (Chrome, Firefox, Safari, Edge) with WebRTC support
*   **Responsive Design:** Optimized for desktop and tablet use, with mobile support for basic functions
*   **Performance:** Optimized for smooth 60fps interactions and real-time collaboration

### 6. Accessibility

*   **Keyboard Navigation:** Full keyboard support for all timeline operations
*   **Screen Reader Support:** ARIA labels and semantic HTML for assistive technologies
*   **Color Contrast:** WCAG AA compliant color schemes and high contrast mode
*   **Focus Management:** Clear focus indicators and logical tab order
*   **Alternative Input:** Support for voice commands and alternative input methods

## 7. Timeline Interface Design (v2)

### Advanced Timeline Controls

**Time Domain Precision:**
*   **TimeScale System:** All positioning and scaling calculated based on time values, not pixels
*   **Precise Time Editing:** Millisecond-level accuracy for clip positioning and duration
*   **Zoom Controls:** Multiple zoom presets (30s, 1m, 2m, 5m, 10m) with smooth transitions
*   **Pan Navigation:** Horizontal scrolling with keyboard arrow keys and mouse wheel

**Interactive Elements:**
*   **Draggable Playhead:** Red line indicating current time with smooth scrubbing
*   **Clip Manipulation:** Drag to move, resize handles for duration editing
*   **Snap System:** Automatic alignment to grid and adjacent clips
*   **Keyboard Shortcuts:** Space (play/pause), J/K/L (scrub), ←/→ (nudge), Home/End (jump)

**Visual Feedback:**
*   **Selection States:** Clear visual indicators for selected clips and tracks
*   **Hover Effects:** Smooth transitions and visual feedback during interactions
*   **Drop Zones:** Visual indicators for valid drop targets during drag operations
*   **Progress Indicators:** Real-time feedback for long-running operations

### Timeline Component Layout

**Header Ruler:**
*   **Time Labels:** Consistent font sizes with automatic tick interval generation
*   **Zoom Indicators:** Visual representation of current zoom level
*   **Time Format:** Support for multiple time formats (HH:MM:SS, frames, etc.)

**Tracks Surface:**
*   **Track Headers:** Visibility, mute, and lock controls for each track
*   **Track Ordering:** Drag-and-drop reordering with visual feedback
*   **Track Types:** Distinct visual styling for video, overlay, and audio tracks
*   **Track Colors:** Customizable track colors for easy identification

**Clip Representation:**
*   **Visual Thumbnails:** Static thumbnails for all video content
*   **Duration Indicators:** Clear start and end time markers
*   **Opacity Controls:** Visual representation of clip opacity settings
*   **Source Information:** Clear indication of clip source (camera, asset, etc.)

**Properties Panel:**
*   **Real-Time Editing:** Live updates of selected clip properties
*   **Time Controls:** Precise start time, duration, and end time inputs
*   **Visual Properties:** Opacity, scale, and position controls
*   **Source Details:** Camera information, asset metadata, and configuration

### Collaboration Features

**Real-Time Synchronization:**
*   **User Presence:** Visual indicators showing active collaborators
*   **Conflict Resolution:** Automatic merging of non-conflicting changes
*   **Change Indicators:** Visual markers for recent changes and updates
*   **Offline Mode:** Local state persistence with sync when connectivity returns

**Multi-User Interface:**
*   **User Avatars:** Visual representation of active collaborators
*   **Change Attribution:** Clear indication of who made specific changes
*   **Permission Levels:** Different interface elements based on user permissions
*   **Notification System:** Real-time notifications for important changes

---

## Broadcast Node: Automated Scenic Location Broadcasting

The Broadcast Node operates as a headless system on Raspberry Pi hardware deployed at scenic business locations, with optional web-based monitoring interface for configuration and scenic broadcast status monitoring.

### 1. Layout Structure

**Primary Interface (Headless):**
*   **Docker Container:** Runs as a background service with no GUI
*   **Configuration Files:** Environment variables and JSON configs for setup
*   **Log Output:** Console logging for debugging and monitoring
*   **Status API:** RESTful API endpoints for health checks and status reporting

**Optional Web Interface (Kiosk Mode):**
*   **Status Dashboard:** Real-time display of execution status and camera health
*   **Configuration Panel:** Basic settings adjustment and camera testing
*   **Log Viewer:** Scrollable log display with filtering and search
*   **Segment Queue:** List of scheduled segments and execution progress

### 2. Core Components

**Headless Operation:**
*   **Visual Storytelling Executor:** Interprets JSON segments and executes automated scenic livestreams
*   **Scenic Camera Manager:** Manages existing security cameras, webcams, and IP cameras at scenic business locations
*   **Schedule Engine:** Handles timing and execution of scheduled visual storytelling segments
*   **Sync Service:** Periodically syncs with cloud for new visual storytelling content and status updates

**Web Monitoring Interface:**
*   **Status Cards:** Display scenic camera connectivity, visual storytelling execution, and system health
*   **Progress Indicators:** Visual feedback for scenic broadcast execution and sync operations
*   **Configuration Forms:** Scenic camera setup, network settings, and sync preferences
*   **Log Stream:** Real-time log display with color-coded severity levels for scenic broadcast monitoring

### 3. Interaction Patterns

**Initial Setup:**
1.  **Docker Deployment:** Business owner deploys broadcast node container at their scenic location
2.  **Authentication:** Node authenticates with Firebase using service account credentials
3.  **Scenic Camera Configuration:** Business owner connects existing security cameras, webcams, or IP cameras
4.  **Visual Storytelling Sync:** Node downloads available visual storytelling segments from cloud editor
5.  **Schedule Setup:** Business owner configures automated scenic broadcast schedule and timing preferences

**Runtime Operation:**
*   **Automatic Scenic Broadcasting:** Node automatically executes visual storytelling segments to showcase the scenic location
*   **Status Monitoring:** Optional web interface provides real-time scenic broadcast status updates
*   **Error Handling:** Automatic retry logic and error reporting to cloud for scenic broadcast issues
*   **Manual Override:** Emergency stop and manual scenic broadcast execution capabilities

### 4. Visual Design & Color Scheme

**Headless Interface:**
*   **Console Output:** Color-coded terminal output for different log levels
*   **Status Indicators:** Simple text-based status messages and progress bars
*   **Error Reporting:** Clear error messages with suggested resolution steps

**Web Interface (Optional):**
*   **Theme:** Minimalist dark theme optimized for monitoring displays
*   **Color Palette:** Consistent with cloud editor but simplified for kiosk use
*   **Typography:** Monospace fonts for log display, sans-serif for UI elements
*   **Layout:** Single-page dashboard with collapsible sections

### 5. Platform Considerations

*   **Raspberry Pi:** Optimized for ARM64 architecture with Docker support
*   **Resource Constraints:** Minimal memory and CPU usage for stable operation
*   **Network Requirements:** Reliable internet connection for cloud synchronization
*   **Storage:** Local SQLite database and segment caching with configurable limits

### 6. Accessibility

**Headless Interface:**
*   **Log Formatting:** Structured log output for parsing by external tools
*   **API Documentation:** Clear API endpoints for integration with monitoring systems
*   **Error Codes:** Standardized error codes and messages for troubleshooting

**Web Interface:**
*   **High Contrast:** Optimized for visibility on various display types
*   **Large Text:** Readable fonts and sizing for monitoring from a distance
*   **Simple Navigation:** Minimal interface complexity for reliable operation
*   **Status Indicators:** Clear visual indicators for system health and status
