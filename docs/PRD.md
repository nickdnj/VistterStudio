# Product Requirements Document (PRD): VistterStudio + RTMP Camera Integration

This document outlines the product requirements for VistterStudio, a comprehensive system for integrating RTMP IP cameras (such as Reolink) into professional streaming and broadcasting workflows with timeline-based editing capabilities.

## 1. Elevator Pitch

VistterStudio transforms IP cameras into professional streaming assets through a modern timeline-based interface. It provides seamless RTMP camera integration with real-time overlays, positioning controls, and professional editing capabilities. Whether you're a local broadcaster, content creator, or developer, VistterStudio gives you the power to create sophisticated multi-camera productions with affordable IP cameras and intuitive drag-and-drop editing.

## 2. Target Audience

*   **Local Broadcasters & Community TV:** Small-scale broadcasters who need affordable IP camera solutions for live events, weather monitoring, or local sports coverage with professional timeline editing.
*   **Live Streamers & Content Creators:** Creators on platforms like Twitch, YouTube, and Facebook Live who want to incorporate multiple RTMP camera angles with real-time editing and overlay capabilities.
*   **Security & Surveillance Teams:** Organizations using IP cameras who want to create professional video content from their existing RTMP camera infrastructure.
*   **Event Production Teams:** Organizers of events (workshops, meetups, concerts) who need sophisticated multi-camera production capabilities using IP cameras.
*   **Developers & System Integrators:** Tech professionals who want to build custom video production solutions using RTMP camera APIs and timeline-based editing.

## 3. Functional Requirements

### Core Camera Integration
*   **RTMP Camera Support:** The system must support RTMP IP cameras (Reolink, Hikvision, Dahua, etc.) with secure credential management.
*   **Camera Management:** Users must be able to add, configure, and manage multiple RTMP cameras through a dedicated UI.
*   **Authentication Handling:** The system must securely store and inject RTMP camera credentials into stream URLs.
*   **Camera Status Monitoring:** Real-time monitoring of camera connection status and stream health.

### Timeline-Based Editing
*   **Drag-and-Drop Interface:** Users can drag cameras from the Camera Drawer directly onto timeline tracks.
*   **Multi-Track Timeline:** Support for multiple video, audio, and overlay tracks with proper layering.
*   **Real-Time Preview:** Live preview of timeline composition showing active camera feeds and overlays.
*   **Timeline Playback Controls:** Play, pause, stop, and seek functionality with looping support.

### Camera Stream Controls  
*   **Positioning Controls:** X/Y coordinate adjustment for camera feed positioning within the frame.
*   **Zoom/Scale Controls:** Digital zoom and pan capabilities (50%-300% scale) for each camera feed.
*   **Opacity Control:** Per-camera opacity adjustment for overlay effects and transitions.
*   **Real-Time Updates:** All adjustments apply immediately to the live preview.

### Asset Management
*   **Media Library:** Support for images, videos, and audio assets alongside camera feeds.
*   **Asset Timeline Integration:** Drag-and-drop assets onto timeline tracks with automatic duration handling.
*   **File Upload System:** Built-in asset upload and management system.

### Security & Authentication
*   **Credential Storage:** Secure storage of RTMP camera usernames and passwords.
*   **Session Persistence:** Camera credentials persist between application sessions.
*   **URL Construction:** Dynamic RTMP URL generation with embedded authentication.

## 4. User Stories

### Camera Management
*   **As a content creator,** I want to add my Reolink camera by entering its IP address and credentials so that I can use it in my timeline production.
*   **As a broadcaster,** I want to see all my RTMP cameras in an organized list with their connection status so I can quickly identify which cameras are available.
*   **As a user,** I want my camera credentials to be saved securely so I don't have to re-enter them every time I open the application.

### Timeline Production
*   **As a live streamer,** I want to drag my IP camera from the camera drawer onto the timeline so that I can create a multi-camera production.
*   **As an event producer,** I want to position and scale my camera feeds in real-time so that I can create professional-looking compositions.
*   **As a broadcaster,** I want to add multiple camera angles to different timeline tracks so that I can create sophisticated productions.

### Stream Controls
*   **As a content creator,** I want to adjust the opacity of my camera overlay so that I can create transparency effects with background content.
*   **As a videographer,** I want to digitally pan and zoom my camera feed so that I can focus on specific areas even if my camera doesn't support PTZ.
*   **As a producer,** I want to reposition my camera feeds within the frame so that I can create picture-in-picture or side-by-side layouts.

### Workflow Integration
*   **As a developer,** I want to integrate VistterStudio with my existing RTMP camera infrastructure so that I can create custom video production workflows.
*   **As a system administrator,** I want to deploy VistterStudio in a Docker environment so that I can easily manage and scale the system.

## 5. User Interface Design

VistterStudio provides a modern, web-based interface optimized for professional video production workflows.

### Main Interface Layout

**Header Bar**
- Application title and branding
- Timeline playback controls (play, pause, stop, loop)
- Current time indicator and duration display

**Sidebar (Left Panel)**
- **Camera Drawer:** RTMP camera management with add/edit/delete capabilities
- **Media Library:** Asset management for images, videos, and audio files  
- **Effects Gallery:** Overlay and transition effects
- **Properties Panel:** Real-time control of selected timeline elements
- **Settings & Tools:** Export, project management, and system configuration

**Main Content Area**
- **Preview Window:** Real-time preview of timeline composition with 16:9 aspect ratio
- **Timeline Editor:** Multi-track timeline with drag-and-drop functionality

### Camera Drawer Interface

**RTMP Camera Section**
- Expandable/collapsible camera type sections
- "Add Camera" button with inline form for RTMP configuration
- Camera list showing: name, host:port, channel/stream info, connection status
- Drag handles for timeline integration
- Edit/delete buttons for camera management

**Camera Configuration Form**
- Camera name (user-friendly identifier)
- Host/IP address input with validation
- Port number (default: 1935)
- Channel and stream parameters
- Username and password fields (securely stored)
- Connection test functionality

### Timeline Interface

**Track Management**
- Video tracks for main camera content
- Overlay tracks for secondary cameras and graphics
- Audio tracks for sound sources
- Track controls: visibility, mute, lock, delete

**Clip Manipulation**
- Drag cameras/assets from sidebar to timeline tracks
- Visual clip representation with thumbnails
- Trim handles for duration adjustment
- Context menus for clip operations

### Properties Panel

**Camera Stream Controls** (when RTMP camera clip is selected)
- Position controls: X/Y coordinate sliders (-100 to +100)
- Zoom control: Scale slider (50% to 300%)
- Opacity control: Transparency slider (0% to 100%)
- Real-time preview updates

**General Clip Properties**
- Start time, duration, and end time inputs
- Clip name and metadata
- Transition effects (fade, slide, scale, zoom)
- Copy, delete, and duplicate actions

### Connection Management

**RTMP URL Format**
```
rtmp://<host>:<port>/bcs/channel<channel>_ext.bcs?channel=<channel>&stream=<stream>&user=<username>&password=<password>
```

**Example Configuration**
```
Host: 192.168.86.23
Port: 1935  
Channel: 0
Stream: 2
Username: Wharfside
Password: Wharfside2025!!
```

This generates: `rtmp://192.168.86.23:1935/bcs/channel0_ext.bcs?channel=0&stream=2&user=Wharfside&password=Wharfside2025!!`
