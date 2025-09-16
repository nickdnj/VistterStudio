# Support & Maintenance: VistterStudio Cloud Editor + Broadcast Node

This document outlines the support and maintenance strategy for the VistterStudio two-component video production system.

## 1. Support Philosophy

VistterStudio is a community-driven, open-source project that helps scenic business owners transform their locations into compelling digital destinations. Our support philosophy is **"community-first and self-service-oriented."** We aim to provide scenic business owners with all the documentation and tools they need to get their visual storytelling up and running smoothly. When issues do arise, we rely on the community to help each other, with the project maintainers stepping in to address bugs and guide the project's direction.

## 2. Support Channels

*   **Primary Channel: GitHub Issues:** This is the main channel for all support requests, bug reports, and feature proposals. Using GitHub Issues allows us to track all issues publicly and build a searchable knowledge base for the community.
    *   **Bug Reports:** Users should use the "Bug Report" template to provide detailed information about the issue, including logs and steps to reproduce.
    *   **Feature Requests:** Users can submit ideas for new features using the "Feature Request" template.
    *   **Component-Specific Issues:** Issues should be labeled with `cloud-editor` or `broadcast-node` to help categorize and prioritize support requests.
*   **Secondary Channel: GitHub Discussions:** For general questions, sharing projects, and having conversations that don't fit the structure of a bug report or feature request, users are encouraged to use GitHub Discussions.
*   **Documentation:** Comprehensive documentation is available at [docs.vistterstudio.com](https://docs.vistterstudio.com) covering both cloud editor and broadcast node deployment.

There are no private support channels like email or chat. All communication is done in the open to benefit the entire community.

## 3. Response Times

As a community-supported project, we do not offer guaranteed response times. However, we will do our best to address issues in a timely manner. Issues will be prioritized as follows:

1.  **Critical Bugs:** Issues that prevent the core functionality of either component from working for a majority of users (e.g., Firebase authentication failures, broadcast node execution failures).
2.  **Cloud Editor Issues:** Problems with timeline editing, collaboration features, or JSON export functionality.
3.  **Broadcast Node Issues:** Problems with segment execution, camera integration, or cloud synchronization.
4.  **Minor Bugs:** Issues that affect a smaller subset of users or have a viable workaround.
5.  **Feature Requests:** New ideas and enhancements will be considered for future releases based on community interest and alignment with the project's goals.

## 4. Self-Service Resources

Our goal is to empower users to solve their own problems whenever possible. We will provide the following self-service resources:

*   **Comprehensive README:** The `README.md` file is the first place users should look for information on how to set up and use both components.
*   **Project Documentation:** The `/docs` directory contains detailed documents about the project's architecture, requirements, and design, which can help users understand how the system works.
*   **Cloud Editor Guide:** Step-by-step instructions for setting up and using the cloud editor, including Firebase configuration and user management.
*   **Broadcast Node Guide:** Detailed instructions for deploying broadcast nodes on Raspberry Pi, including camera configuration and cloud synchronization.
*   **API Documentation:** Complete API reference for both cloud editor and broadcast node components.
*   **Frequently Asked Questions (FAQ):** A dedicated `FAQ.md` file will be created to address common questions and problems for both components.
*   **Sample Configurations:** Docker Compose files and configuration examples for both cloud editor and broadcast node deployments.

## 5. Escalation Paths

There is no formal escalation path for support requests. If a user is not getting a response on a GitHub Issue, they can try to provide more information, such as logs or a more detailed description of the problem, to help the community diagnose the issue.

## 6. Maintenance & Updates

*   **Cloud Editor Updates:** Regular updates to the cloud editor will be deployed automatically via Google Cloud Run. Users will be notified of major updates through GitHub releases.
*   **Broadcast Node Updates:** Docker images for broadcast nodes will be updated regularly. Users can pull the latest images to get updates.
*   **Dependency Updates:** The project's dependencies, including camera ingest containers and Firebase SDKs, are actively maintained. We will regularly update to the latest stable versions.
*   **Security:** Any security vulnerabilities discovered in the project or its dependencies will be addressed as a top priority. Critical security updates will be released immediately.
*   **Feature Releases:** New features for both cloud editor and broadcast node components will be released with version tags on GitHub.
*   **Breaking Changes:** Any breaking changes will be clearly documented in release notes and migration guides.
