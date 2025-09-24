# Quality Assurance (QA) Plan: VistterStudio Cloud Editor + Broadcast Node

This document outlines the Quality Assurance (QA) plan for the VistterStudio two-component system. The focus is on automated testing and validation to ensure both the cloud editor and broadcast node components work as expected.

## 1. QA Objectives

### Cloud Editor Objectives
*   **Verify User Authentication:** Ensure Firebase Auth integration works correctly for scenic business owners with multiple authentication methods
*   **Validate Visual Storytelling Timeline Editing:** Confirm that place-based visual storytelling timeline creation, editing, and collaboration features function properly
*   **Test Promotional Media Management:** Verify that local event flyers, menu updates, weather widgets, and promotional graphics upload, storage, and retrieval work correctly with Firebase Storage
*   **Ensure JSON Export:** Validate that visual storytelling timeline data exports correctly as JSON segments for scenic location broadcast nodes
*   **Confirm Real-Time Sync:** Verify that collaborative visual storytelling editing and real-time synchronization work across multiple business team members

### Broadcast Node Objectives
*   **Verify Visual Storytelling Execution:** Ensure that broadcast nodes at scenic business locations can download and execute visual storytelling JSON segments correctly
*   **Validate Scenic Camera Integration:** Confirm that existing security cameras, webcams, and IP cameras at scenic business locations work properly
*   **Test Cloud Synchronization:** Verify that scenic location nodes can sync with cloud and report visual storytelling status correctly
*   **Ensure Offline Operation:** Confirm that scenic location nodes continue operating with cached visual storytelling segments when offline
*   **Validate Scenic Video Processing:** Verify that FFmpeg-based video processing works according to visual storytelling segment specifications for scenic locations

## 2. Test Strategy

The test strategy is based on **comprehensive testing** of both cloud editor and broadcast node components using multiple testing approaches:

### Cloud Editor Testing
*   **Unit Tests:** Jest and React Testing Library for component and function testing
*   **Integration Tests:** Firebase emulator for testing cloud services integration
*   **End-to-End Tests:** Cypress or Playwright for full user workflow testing
*   **Performance Tests:** Load testing for collaborative editing and real-time sync

### Broadcast Node Testing
*   **Unit Tests:** Jest for individual component testing
*   **Integration Tests:** Docker container testing with mock services
*   **Hardware Tests:** Raspberry Pi testing with actual camera hardware
*   **Network Tests:** Offline/online scenario testing and sync validation

### Cross-Component Testing
*   **API Testing:** RESTful API validation between cloud and broadcast nodes
*   **Data Flow Testing:** JSON segment export/import validation
*   **Security Testing:** Authentication and authorization validation
*   **Performance Testing:** End-to-end system performance under load

## 3. Test Plan

The test plan is a series of automated checks that can be run to validate both cloud editor and broadcast node components. These tests map directly to the functional requirements outlined in the PRD.

### Cloud Editor Test Cases

| PRD Requirement             | Test Case ID | Validation Method                                     |
| --------------------------- | ------------ | ----------------------------------------------------- |
| User Authentication         | `TC-CE-001`  | Test Firebase Auth login/logout with multiple providers |
| Timeline Creation           | `TC-CE-002`  | Create timeline, add tracks, and verify data persistence |
| Media Upload                | `TC-CE-003`  | Upload media to Firebase Storage and verify accessibility |
| JSON Export                 | `TC-CE-004`  | Export timeline as JSON segment and validate format |
| Real-Time Collaboration    | `TC-CE-005`  | Test multi-user editing with conflict resolution |
| Camera Configuration        | `TC-CE-006`  | Configure RTMP cameras and verify static thumbnail generation |

### Broadcast Node Test Cases

| PRD Requirement             | Test Case ID | Validation Method                                     |
| --------------------------- | ------------ | ----------------------------------------------------- |
| Segment Download            | `TC-BN-001`  | Download JSON segments from cloud and verify parsing |
| Camera Integration          | `TC-BN-002`  | Connect to RTMP cameras and verify stream access |
| Camera Ingest Integration   | `TC-BN-003`  | Test camera ingest container and camera connectivity |
| Segment Execution           | `TC-BN-004`  | Execute JSON segments and verify video processing |
| Cloud Synchronization       | `TC-BN-005`  | Test periodic sync with cloud and status reporting |
| Offline Operation           | `TC-BN-006`  | Verify operation with cached segments when offline |
| Media Sync                  | `TC-BN-007`  | Test static media download and caching on broadcast node |
| Dynamic Overlay Rendering   | `TC-BN-008`  | Test weather/tide gadget rendering with live API data |
| Mixed Media Timeline        | `TC-BN-009`  | Test timeline execution with both static and dynamic overlays |
| Ad Media Sync               | `TC-BN-010`  | Test static ad creative download and dynamic ad API fetching |
| Ad Rotation & Scheduling    | `TC-BN-011`  | Test ad rotation schedules and time-bound ad slots |
| Ad Timeline Integration     | `TC-BN-012`  | Test timeline execution with ad overlays and monetization |

## 4. Test Cases

These test cases can be run manually or automated using testing frameworks and scripts.

### Cloud Editor Test Cases

### TC-CE-001: Verify User Authentication

1.  **Objective:** Verify that Firebase Auth integration works correctly with multiple authentication methods.
2.  **Steps:**
    ```bash
    # Start cloud editor in development mode
    npm run dev

    # Test authentication endpoints
    curl -X POST http://localhost:3000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"test@example.com","password":"testpass"}'
    ```
3.  **Expected Result:** Successful authentication response with valid JWT token.

### TC-CE-002: Verify Timeline Creation

1.  **Objective:** Verify that timeline creation, editing, and data persistence work correctly.
2.  **Steps:**
    ```bash
    # Create new timeline via API
    curl -X POST http://localhost:3000/api/projects \
      -H "Authorization: Bearer <token>" \
      -H "Content-Type: application/json" \
      -d '{"name":"Test Timeline","tracks":[]}'

    # Verify timeline data in Firebase
    curl -X GET http://localhost:3000/api/projects \
      -H "Authorization: Bearer <token>"
    ```
3.  **Expected Result:** Timeline created successfully and retrievable from database.

### TC-CE-003: Verify Media Upload

1.  **Objective:** Verify that media upload to Firebase Storage works correctly.
2.  **Steps:**
    ```bash
    # Upload test media
    curl -X POST http://localhost:3000/api/media/upload \
      -H "Authorization: Bearer <token>" \
      -F "file=@test-image.jpg"
    ```
3.  **Expected Result:** Media uploaded successfully with valid download URL.

### TC-CE-004: Verify JSON Export

1.  **Objective:** Verify that timeline data exports correctly as JSON segments.
2.  **Steps:**
    ```bash
    # Export timeline as JSON segment
    curl -X POST http://localhost:3000/api/projects/{id}/export \
      -H "Authorization: Bearer <token>"
    ```
3.  **Expected Result:** Valid JSON segment with proper structure and media references.

### Broadcast Node Test Cases

### TC-BN-001: Verify Segment Download

1.  **Objective:** Verify that broadcast nodes can download JSON segments from cloud.
2.  **Steps:**
    ```bash
    # Start broadcast node container
    docker-compose -f docker-compose.broadcast.yml up -d

    # Test segment download
    curl http://localhost:8080/api/sync/segments
    ```
3.  **Expected Result:** JSON segments downloaded and parsed successfully.

### TC-BN-002: Verify Camera Integration

1.  **Objective:** Verify that RTMP camera connections work properly.
2.  **Steps:**
    ```bash
    # Test camera connectivity
    curl -X POST http://localhost:8080/api/cameras/test \
      -H "Content-Type: application/json" \
      -d '{"host":"192.168.1.100","port":1935,"channel":0}'
    ```
3.  **Expected Result:** Camera connection successful with valid stream URL.

### TC-BN-003: Verify Camera Ingest Integration

1.  **Objective:** Verify that camera ingest container integration works correctly.
2.  **Steps:**
    ```bash
    # Start camera ingest container
    docker-compose -f docker-compose.camera.yml up -d

    # Test camera connectivity
    curl http://localhost:5000/cameras
    ```
3.  **Expected Result:** IP cameras detected and accessible via ingest container.

### TC-BN-004: Verify Segment Execution

1.  **Objective:** Verify that JSON segments execute correctly with video processing.
2.  **Steps:**
    ```bash
    # Start segment execution
    curl -X POST http://localhost:8080/api/execute/start \
      -H "Content-Type: application/json" \
      -d '{"segmentId":"test-segment-001"}'

    # Check execution status
    curl http://localhost:8080/api/execute/status
    ```
3.  **Expected Result:** Segment executes successfully with proper video output.

### TC-BN-005: Verify Cloud Synchronization

1.  **Objective:** Verify that nodes can sync with cloud and report status.
2.  **Steps:**
    ```bash
    # Test sync with cloud
    curl -X POST http://localhost:8080/api/sync/status \
      -H "Content-Type: application/json" \
      -d '{"nodeId":"test-node-001","status":"online"}'
    ```
3.  **Expected Result:** Status reported successfully to cloud.

### TC-BN-006: Verify Offline Operation

1.  **Objective:** Verify that nodes continue operating with cached segments when offline.
2.  **Steps:**
    ```bash
    # Disconnect network
    # Test cached segment execution
    curl -X POST http://localhost:8080/api/execute/start \
      -H "Content-Type: application/json" \
      -d '{"segmentId":"cached-segment-001"}'
    ```
3.  **Expected Result:** Cached segments execute successfully without cloud connectivity.

### TC-BN-007: Verify Media Sync

1.  **Objective:** Verify that broadcast nodes can download and cache static media from the cloud.
2.  **Steps:**
    ```bash
    # Upload test media to cloud
    curl -X POST http://localhost:3000/api/media/upload \
      -H "Content-Type: multipart/form-data" \
      -F "file=@test-logo.png" \
      -F "type=overlay"
    
    # Test media sync on broadcast node
    curl -X POST http://localhost:8080/api/sync/media \
      -H "Content-Type: application/json" \
      -d '{"segmentId":"test-segment-001"}'
    
    # Verify media are cached locally
    ls -la /app/cache/media/
    ```
3.  **Expected Result:** Static PNG/JPEG media are downloaded and cached locally on broadcast node.

### TC-BN-008: Verify Dynamic Overlay Rendering

1.  **Objective:** Verify that weather/tide gadgets render correctly with live API data.
2.  **Steps:**
    ```bash
    # Configure weather API endpoint
    curl -X POST http://localhost:8080/api/config/weather \
      -H "Content-Type: application/json" \
      -d '{"apiKey":"test-key","endpoint":"https://api.weather.com/v1/current"}'
    
    # Test dynamic overlay rendering
    curl -X POST http://localhost:8080/api/render/gadget \
      -H "Content-Type: application/json" \
      -d '{"type":"weather","template":"weather-box","placeholders":{"temp":"{temp}","wind":"{wind}"}}'
    
    # Verify rendered overlay image
    ls -la /app/cache/rendered/
    ```
3.  **Expected Result:** Dynamic overlays are rendered as PNG images with live weather data.

### TC-BN-009: Verify Mixed Media Timeline

1.  **Objective:** Verify that timelines with both static and dynamic overlays execute correctly.
2.  **Steps:**
    ```bash
    # Create timeline with mixed media
    curl -X POST http://localhost:3000/api/timeline/create \
      -H "Content-Type: application/json" \
      -d '{"media":[{"type":"static","file":"logo.png"},{"type":"dynamic","gadget":"weather-box"}]}'
    
    # Execute mixed media timeline
    curl -X POST http://localhost:8080/api/execute/start \
      -H "Content-Type: application/json" \
      -d '{"segmentId":"mixed-media-timeline-001"}'
    
    # Verify video output contains both static and dynamic overlays
    ffprobe -v quiet -show_streams output.mp4
    ```
3.  **Expected Result:** Timeline executes successfully with both static logo and dynamic weather overlay visible in output.

### TC-BN-010: Verify Ad Media Sync

1.  **Objective:** Verify that broadcast nodes can download static ad creatives and fetch dynamic ad content from ad APIs.
2.  **Steps:**
    ```bash
    # Upload static ad creative to cloud
    curl -X POST http://localhost:3000/api/media/upload \
      -H "Content-Type: multipart/form-data" \
      -F "file=@restaurant-ad.png" \
      -F "type=ad" \
      -F "metadata={\"duration\":30,\"rotation\":300}"
    
    # Configure ad API endpoint
    curl -X POST http://localhost:3000/api/config/ads \
      -H "Content-Type: application/json" \
      -d '{"apiKey":"test-ad-key","endpoint":"https://api.ads.com/v1/creative","rotationInterval":300}'
    
    # Test ad media sync on broadcast node
    curl -X POST http://localhost:8080/api/sync/ads \
      -H "Content-Type: application/json" \
      -d '{"segmentId":"ad-timeline-001"}'
    
    # Verify ad media are cached locally
    ls -la /app/cache/ads/
    ```
3.  **Expected Result:** Static ad creatives are downloaded and dynamic ad content is fetched from ad APIs and cached locally.

### TC-BN-011: Verify Ad Rotation & Scheduling

1.  **Objective:** Verify that ad rotation schedules and time-bound ad slots work correctly.
2.  **Steps:**
    ```bash
    # Configure ad rotation schedule (every 5 minutes)
    curl -X POST http://localhost:8080/api/config/ads/rotation \
      -H "Content-Type: application/json" \
      -d '{"interval":300,"timeBound":{"start":"18:00","end":"21:00"}}'
    
    # Test ad rotation during scheduled time
    curl -X POST http://localhost:8080/api/ads/rotate \
      -H "Content-Type: application/json" \
      -d '{"currentTime":"19:30","adSlot":"happy-hour-ads"}'
    
    # Verify correct ad is selected based on time and rotation
    curl -X GET http://localhost:8080/api/ads/current
    ```
3.  **Expected Result:** Ad rotation works correctly with time-bound scheduling, showing appropriate ads during scheduled hours.

### TC-BN-012: Verify Ad Timeline Integration

1.  **Objective:** Verify that timelines with ad overlays execute correctly with monetization.
2.  **Steps:**
    ```bash
    # Create timeline with ad overlays
    curl -X POST http://localhost:3000/api/timeline/create \
      -H "Content-Type: application/json" \
      -d '{"media":[{"type":"static","file":"logo.png"},{"type":"ad","creative":"restaurant-ad.png","schedule":"18:00-21:00"}]}'
    
    # Execute ad timeline
    curl -X POST http://localhost:8080/api/execute/start \
      -H "Content-Type: application/json" \
      -d '{"segmentId":"ad-timeline-001"}'
    
    # Verify video output contains ad overlays
    ffprobe -v quiet -show_streams output.mp4
    
    # Check ad performance metrics
    curl -X GET http://localhost:8080/api/ads/metrics
    ```
3.  **Expected Result:** Timeline executes successfully with ad overlays visible in output and ad performance metrics tracked.

## 5. Defect Tracking

*   **Tracking Tool:** All defects, bugs, and issues will be tracked using **GitHub Issues**.
*   **Bug Report Template:** A standardized bug report template will be used to ensure that all necessary information is provided.
*   **Labels:** Issues will be labeled with `bug`, `enhancement`, `documentation`, `cloud-editor`, `broadcast-node`, etc., to allow for easy filtering and prioritization.
*   **Component-Specific Issues:** Separate issue tracking for cloud editor and broadcast node components.

## 6. Acceptance Criteria

A new release of VistterStudio will be considered "accepted" and ready for a stable release when:

### Cloud Editor Acceptance Criteria
*   All cloud editor test cases pass (TC-CE-001 through TC-CE-006)
*   Firebase integration works correctly with proper authentication
*   Timeline editing and collaboration features function properly
*   JSON export produces valid segments for broadcast nodes
*   Media upload and management work correctly

### Broadcast Node Acceptance Criteria
*   All broadcast node test cases pass (TC-BN-001 through TC-BN-006)
*   Docker containers deploy and run without errors
*   Camera integration works with both RTMP and IP cameras
*   Segment execution produces correct video output
*   Cloud synchronization and offline operation work properly

### Cross-Component Acceptance Criteria
*   JSON segment format is consistent between cloud editor and broadcast nodes
*   API communication between components works correctly
*   Security and authentication are properly implemented
*   Documentation is accurate and up-to-date
*   No known critical, show-stopping bugs exist