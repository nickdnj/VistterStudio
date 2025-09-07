# Support & Maintenance: VistterStudio + Wyze Bridge

This document outlines the support and maintenance strategy for the VistterStudio project.

## 1. Support Philosophy

VistterStudio is a community-driven, open-source project. Our support philosophy is **"community-first and self-service-oriented."** We aim to provide users with all the documentation and tools they need to get up and running smoothly. When issues do arise, we rely on the community to help each other, with the project maintainers stepping in to address bugs and guide the project's direction.

## 2. Support Channels

*   **Primary Channel: GitHub Issues:** This is the main channel for all support requests, bug reports, and feature proposals. Using GitHub Issues allows us to track all issues publicly and build a searchable knowledge base for the community.
    *   **Bug Reports:** Users should use the "Bug Report" template to provide detailed information about the issue, including logs and steps to reproduce.
    *   **Feature Requests:** Users can submit ideas for new features using the "Feature Request" template.
*   **Secondary Channel: GitHub Discussions:** For general questions, sharing projects, and having conversations that don't fit the structure of a bug report or feature request, users are encouraged to use GitHub Discussions.

There are no private support channels like email or chat. All communication is done in the open to benefit the entire community.

## 3. Response Times

As a community-supported project, we do not offer guaranteed response times. However, we will do our best to address issues in a timely manner. Issues will be prioritized as follows:

1.  **Critical Bugs:** Issues that prevent the core functionality of the application from working for a majority of users (e.g., a change in the Wyze API breaks the bridge).
2.  **Minor Bugs:** Issues that affect a smaller subset of users or have a viable workaround.
3.  **Feature Requests:** New ideas and enhancements will be considered for future releases based on community interest and alignment with the project's goals.

## 4. Self-Service Resources

Our goal is to empower users to solve their own problems whenever possible. We will provide the following self-service resources:

*   **Comprehensive README:** The `README.md` file is the first place users should look for information on how to set up and use the project.
*   **Project Documentation:** The `/docs` directory contains detailed documents about the project's architecture, requirements, and design, which can help users understand how the system works.
*   **Frequently Asked Questions (FAQ):** A dedicated `FAQ.md` file will be created to address common questions and problems.
*   **Sample Configurations:** The `docker-compose.yml` file and examples in the documentation will serve as a starting point for users' own setups.

## 5. Escalation Paths

There is no formal escalation path for support requests. If a user is not getting a response on a GitHub Issue, they can try to provide more information, such as logs or a more detailed description of the problem, to help the community diagnose the issue.

## 6. Maintenance & Updates

*   **Dependency Updates:** The project's primary dependency, `docker-wyze-bridge`, is actively maintained. We will regularly update the `docker-compose.yml` file to point to the latest stable version of the Wyze Bridge image.
*   **VistterStudio Updates:** As new features are developed for VistterStudio itself (such as the Phase 2 web UI), they will be released with version tags on GitHub.
*   **Security:** Any security vulnerabilities discovered in the project or its dependencies will be addressed as a top priority.
