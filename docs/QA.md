# Quality Assurance (QA) Plan: VistterStudio + Wyze Bridge

This document outlines the Quality Assurance (QA) plan for the VistterStudio project. The focus is on automated testing and validation to ensure the system is working as expected.

## 1. QA Objectives

*   **Verify Core Functionality:** Ensure that the VistterStudio system can successfully connect to the Wyze Bridge and that video streams are accessible.
*   **Validate Configuration:** Confirm that the system correctly uses the user-provided Wyze credentials from the `.env` file.
*   **Ensure Stream Accessibility:** Verify that the RTSP, RTMP, and HLS streams are available on the correct ports.
*   **Maintain Stability:** Ensure that the Docker containers run without crashing.
*   **Confirm Documentation Accuracy:** Ensure that the instructions in the `README.md` and other documents are accurate and easy to follow.

## 2. Test Strategy

The test strategy is primarily based on **black-box testing** of the running Docker containers. We will use command-line tools like `curl` and `docker` to interact with the system and validate its outputs. This approach allows us to test the system from the user's perspective without needing to delve into the internal code of the Wyze Bridge.

For the future VistterStudio web UI (Phase 2), a separate strategy involving end-to-end testing frameworks like Cypress or Playwright will be developed.

## 3. Test Plan

The test plan is a series of automated checks that can be run to validate a new release or a change in the configuration. These tests map directly to the functional requirements outlined in the PRD.

| PRD Requirement             | Test Case ID | Validation Method                                     |
| --------------------------- | ------------ | ----------------------------------------------------- |
| Stream Ingest               | `TC-001`     | Check the Wyze Bridge API for a list of active cameras. |
| Docker Deployment           | `TC-002`     | Run `docker-compose up` and check for running containers. |
| Configuration               | `TC-003`     | Intentionally use invalid credentials and check for errors. |
| Multi-Protocol Support      | `TC-004`     | Check that the RTSP, RTMP, and HLS ports are open.      |
| Stream Health Monitoring    | `TC-005`     | Query the Wyze Bridge `/status` API endpoint.           |

## 4. Test Cases

These test cases can be run manually or automated in a shell script.

### TC-001: Verify Stream Ingest

1.  **Objective:** Verify that the Wyze Bridge successfully connects to the Wyze API and detects the user's cameras.
2.  **Steps:**
    ```bash
    # Ensure the containers are running
    docker-compose up -d

    # Query the Wyze Bridge API for a list of cameras
    curl http://localhost:5000/cams
    ```
3.  **Expected Result:** A JSON response containing a list of the user's Wyze cameras.

### TC-002: Verify Docker Deployment

1.  **Objective:** Verify that the Docker containers start without errors.
2.  **Steps:**
    ```bash
    # Start the containers
    docker-compose up -d

    # Check the status of the containers
    docker-compose ps
    ```
3.  **Expected Result:** The `wyze-bridge` container should be listed with a status of "Up" or "Running".

### TC-003: Verify Configuration Error Handling

1.  **Objective:** Verify that the system provides a clear error message when Wyze credentials are not set.
2.  **Steps:**
    ```bash
    # Stop any running containers
    docker-compose down

    # Run docker-compose without a .env file
    docker-compose up
    ```
3.  **Expected Result:** The logs for the `wyze-bridge` container should show an error message indicating that the `WYZE_EMAIL` and `WYZE_PASSWORD` environment variables are not set.

### TC-004: Verify Port Accessibility

1.  **Objective:** Verify that the streaming ports are open and accessible on the host machine.
2.  **Steps:**
    ```bash
    # Ensure the containers are running
    docker-compose up -d

    # Check if the ports are open (using netcat)
    nc -z localhost 1935 # RTMP
    nc -z localhost 8554 # RTSP
    nc -z localhost 8888 # HLS
    ```
3.  **Expected Result:** All three `nc` commands should return a success code, indicating that the ports are open.

### TC-005: Verify Stream Health Monitoring

1.  **Objective:** Verify that the Wyze Bridge API provides a status endpoint.
2.  **Steps:**
    ```bash
    # Ensure the containers are running
    docker-compose up -d

    # Query the status endpoint
    curl http://localhost:5000/status
    ```
3.  **Expected Result:** A JSON response containing health and status information for the camera streams.

## 5. Defect Tracking

*   **Tracking Tool:** All defects, bugs, and issues will be tracked using **GitHub Issues**.
*   **Bug Report Template:** A standardized bug report template will be used to ensure that all necessary information is provided.
*   **Labels:** Issues will be labeled with `bug`, `enhancement`, `documentation`, etc., to allow for easy filtering and prioritization.

## 6. Acceptance Criteria

A new release of VistterStudio will be considered "accepted" and ready for a stable release when:

*   All automated test cases pass.
*   The `README.md` provides clear and accurate instructions.
*   The `docker-compose.yml` file is stable and uses a recent, tested version of the `docker-wyze-bridge` image.
*   There are no known critical, show-stopping bugs.
