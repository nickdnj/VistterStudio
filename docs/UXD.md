# User Experience Design Document (UXD): VistterStudio + Wyze Bridge Integration

This document outlines the user experience and design for VistterStudio. As the project is divided into two phases, the UXD will also be presented in two parts.

## Phase 1: Configuration-Based Experience

In its initial release, VistterStudio is a headless application. The user experience is centered around the command line and configuration files.

### 1. Layout Structure

There is no graphical layout in Phase 1. The "layout" is the structure of the project directory and the configuration files.

*   `docker-compose.yml`: The main entry point for configuring the services.
*   `.env`: The file where users input their sensitive credentials.
*   `README.md`: The primary source of instructions and information.
*   Stream URLs: The final output that the user interacts with.

### 2. Core Components

*   **Terminal/Command Prompt:** The primary interface for starting and stopping the service.
*   **Text Editor:** Used to modify the `.env` file.
*   **Streaming Software (e.g., OBS, VLC):** The end-user application where the camera streams are consumed.

### 3. Interaction Patterns

1.  **Onboarding:** The user clones the repository from GitHub.
2.  **Configuration:** The user opens the project in a text editor, creates a `.env` file, and enters their Wyze email and password.
3.  **Activation:** The user opens a terminal and runs `docker-compose up`.
4.  **Usage:** The user consults the `README.md` to find the correct stream URL for their camera, then pastes it into their streaming software.
5.  **Deactivation:** The user stops the service by pressing `Ctrl+C` or running `docker-compose down` in the terminal.

### 4. Visual Design & Color Scheme

Not applicable in Phase 1, as there is no graphical interface.

### 5. Platform Considerations

*   **Operating System:** The user can be on any OS that supports Docker (Windows, macOS, Linux).
*   **Terminal:** A standard command-line interface is required.

### 6. Accessibility

Accessibility in Phase 1 is determined by the accessibility of the tools the user brings:

*   **Terminal:** Modern terminals (like Windows Terminal, iTerm2, or GNOME Terminal) have good support for screen readers and customizable color schemes.
*   **Text Editor:** Users can choose a text editor that meets their accessibility needs (e.g., VS Code with its extensive accessibility features).

---

## Phase 2: Web-Based User Interface (Future Goal)

Phase 2 introduces a web-based UI to simplify the management of cameras and overlays.

### 1. Layout Structure

A clean, single-page application (SPA) layout is proposed.

*   **Header:** Contains the VistterStudio logo and a primary navigation menu.
*   **Main Content Area:** A two-column layout.
    *   **Left Column (Camera List):** A scrollable list of all detected Wyze cameras. Each item will show the camera name, its status (online/offline), and a thumbnail preview.
    *   **Right Column (Detail View):** When a camera is selected, this area will display its live video feed, stream URLs, and overlay controls.
*   **Footer:** Links to documentation and the GitHub repository.

### 2. Core Components

*   **Camera List Item:** A clickable card with camera name, status indicator, and thumbnail.
*   **Video Player:** A web-based video player (e.g., Video.js or a simple `<video>` tag) to display the HLS stream.
*   **"Copy to Clipboard" Button:** Buttons next to each stream URL for easy copying.
*   **Overlay Manager:** A section with controls to add, edit, and remove overlays. This will include file inputs for images, text inputs for titles, and color pickers.
*   **Toggle Switches:** To enable or disable overlays on a stream.

### 3. Interaction Patterns

*   **Viewing a Stream:** User clicks on a camera in the list -> The detail view updates with the live feed and stream URLs.
*   **Adding an Overlay:** User clicks "Add Overlay" -> A modal or form appears -> User uploads an image or enters text -> Clicks "Save" -> The overlay is now available to be applied.
*   **Applying an Overlay:** User selects a camera -> In the detail view, they see a list of available overlays -> They toggle a switch next to an overlay's name -> The overlay appears on the video feed.

### 4. Visual Design & Color Scheme

*   **Theme:** A clean, dark theme suitable for broadcasting environments to reduce eye strain.
*   **Primary Colors:** A simple color palette, e.g., Dark Gray (#1a1a1a), Medium Gray (#2a2a2a), a bright accent color like Blue (#007bff) for interactive elements, and Green (#28a745) for online status indicators.
*   **Typography:** A clear, sans-serif font like Inter or Lato for readability.

### 5. Platform Considerations

*   **Browser-based:** The UI will be a web application, accessible from any modern desktop browser (Chrome, Firefox, Safari, Edge).
*   **Responsive (Optional):** While designed for desktop, the layout could be made responsive for tablet use.

### 6. Accessibility

*   **Keyboard Navigation:** All interactive elements (buttons, links, form fields) will be navigable using the Tab key.
*   **ARIA Roles:** Proper ARIA roles and attributes will be used to ensure screen readers can interpret the interface.
*   **Color Contrast:** The color scheme will be designed to meet WCAG AA standards for color contrast.
*   **Labels:** All form fields will have clear, descriptive labels.
