# Product Requirements Document (PRD): VistterStudio + Wyze Bridge Integration

This document outlines the product requirements for VistterStudio, a system for integrating Wyze cameras into professional streaming and broadcasting workflows.

## 1. Elevator Pitch

VistterStudio bridges the gap between affordable Wyze cameras and professional streaming setups. It's a Dockerized, easy-to-deploy solution that transforms your Wyze cameras into versatile streaming sources, complete with real-time overlay capabilities. Whether you're a local broadcaster, a streamer, or a developer, VistterStudio gives you the power to integrate high-quality, low-cost cameras into your workflow with minimal effort.

## 2. Target Audience

*   **Local Broadcasters & Community TV:** Small-scale broadcasters who need affordable camera solutions for live events, weather cams, or local sports.
*   **Live Streamers:** Content creators on platforms like Twitch, YouTube, and Facebook Live who want to incorporate multiple camera angles without expensive hardware.
*   **Developers & Hobbyists:** Tech enthusiasts who want to build custom applications with live video feeds, such as home automation dashboards, security systems, or creative coding projects.
*   **Event Teams:** Organizers of small to medium-sized events (workshops, meetups, local concerts) who need a simple way to stream their events live.

## 3. Functional Requirements

*   **Stream Ingest:** The system must ingest video streams from Wyze cameras via the Wyze Bridge.
*   **Multi-Protocol Support:** It must provide streams in RTSP, RTMP, and HLS formats to ensure compatibility with a wide range of client applications (OBS, VLC, web browsers, etc.).
*   **Camera Selection:** Users must be able to select from a list of their available Wyze cameras.
*   **Docker Deployment:** The entire system must be deployable via a single `docker-compose` command.
*   **Configuration:** Users must be able to configure their Wyze credentials securely, without hardcoding them into files.
*   **Real-time Overlays (Phase 2):** The system will support adding real-time graphical overlays (e.g., lower thirds, logos, weather information) to the video streams.
*   **Stream Health Monitoring:** The system should provide a way to check the status and health of the camera streams.

## 4. User Stories

*   **As a live streamer,** I want to easily connect my Wyze V3 camera to OBS so that I can use it as a secondary camera angle in my broadcast.
*   **As a developer,** I want to access the RTSP stream from my Wyze Pan Cam to build a custom motion detection system with OpenCV.
*   **As a community TV operator,** I want to set up a 24/7 live "scenic view" camera using a Wyze Cam Outdoor, so I can embed it on our town's website.
*   **As a user,** I want to see a list of all my connected Wyze cameras and their current status (online/offline) in a simple interface.
*   **As a user,** I want to run the entire system with a single command (`docker-compose up`) for a hassle-free setup.

## 5. User Interface (Conceptual)

The primary user interface for the initial phase will be the configuration files (`docker-compose.yml` and `.env`) and the stream URLs themselves. A future web-based UI (Phase 2) will provide a more user-friendly experience.

### Phase 1: Configuration-based UI

1.  **Setup:** The user clones the repository and creates a `.env` file with their Wyze credentials.
2.  **Execution:** The user runs `docker-compose up`.
3.  **Access:** The user consults the `README.md` to find the correct URL format for their camera's stream.
4.  **Integration:** The user pastes the stream URL into their desired application (e.g., OBS, VLC).

### Phase 2: Web-based UI (Future Goal)

A web interface will be developed to provide a more intuitive way to manage the system.

*   **Dashboard:** A main dashboard will display a list of all available cameras and their status.
*   **Camera View:** Clicking on a camera will show a live preview of its stream.
*   **Stream URLs:** The UI will display the ready-to-use URLs for each stream protocol.
*   **Overlay Management:** A section for creating, managing, and applying overlays to the camera streams.
