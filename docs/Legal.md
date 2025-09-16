# Legal & Compliance: VistterStudio Cloud Editor + Broadcast Node

This document outlines the legal and compliance considerations for the VistterStudio two-component place-based visual storytelling system.

## 1. Terms of Service (ToS)

As an open-source project, VistterStudio does not have a formal Terms of Service agreement between the project maintainers and its users. The use of the software is governed by its software license (see Section 5).

Users are responsible for their own compliance with the terms of service of any third-party services they use in conjunction with VistterStudio, including but not limited to:

*   **Firebase/Google Cloud:** Users must adhere to Google's Terms of Service and Firebase usage policies when using the cloud editor and authentication services.
*   **Camera Manufacturers:** Users must adhere to the terms of service of their camera manufacturers, particularly regarding the use of their accounts and camera hardware.
*   **Streaming Platforms:** Users who broadcast their video streams to platforms like YouTube, Twitch, or Facebook Live must comply with the terms of service of those platforms.
*   **Cloud Infrastructure:** Users deploying broadcast nodes must comply with their cloud provider's terms of service (Google Cloud Run, AWS, etc.).

## 2. Privacy Policy

VistterStudio operates as a distributed system with both cloud and local components, each with different privacy considerations.

### Cloud Editor Privacy
*   **Data Storage:** Timeline data, asset metadata, and user preferences are stored in Firebase Firestore. User authentication data is managed by Firebase Auth.
*   **Data Transmission:** Timeline data and assets are transmitted between the cloud editor and Firebase services. Video streams are not transmitted to the cloud during editing.
*   **User Responsibility:** Users are responsible for the content they create and share in the cloud editor. Project sharing and collaboration features require users to manage their own privacy settings.

### Broadcast Node Privacy
*   **Data Storage:** Camera credentials and segment data are stored locally on the broadcast node. No personal data is transmitted to the project maintainers.
*   **Data Transmission:** Video streams are processed locally on the broadcast node. Only segment metadata and status information are transmitted to the cloud.
*   **User Responsibility:** Users are solely responsible for the privacy of the video streams they manage. If a user chooses to broadcast a stream publicly, they are responsible for ensuring they are not violating anyone's privacy.

### Third-Party Services
*   **Firebase/Google Cloud:** User data stored in Firebase is subject to Google's privacy policy and data processing terms.
*   **Camera Integration:** Camera streams are processed through camera manufacturers' servers as per their respective privacy policies.
*   **Cloud Infrastructure:** Users deploying to cloud platforms are subject to their provider's privacy policies.

## 3. Compliance Statements

### Firebase/Google Cloud Services

VistterStudio's cloud editor relies on Firebase services for authentication, data storage, and real-time synchronization. Users must comply with Google's Terms of Service and Firebase usage policies. Service availability and functionality are subject to Google's service level agreements.

### Camera Integration APIs

VistterStudio integrates with various camera manufacturers through their respective APIs and protocols. These integrations may use official or unofficial APIs depending on the camera manufacturer. API availability and functionality are subject to change or discontinuation by the respective manufacturers at any time. There is no formal guarantee of continued functionality for any specific camera integration.

## 4. Disclaimers & Limitations

*   **No Warranty:** VistterStudio is provided "as is," without any warranty of any kind, express or implied. The project maintainers are not responsible for any damages or losses that may result from its use.
*   **Streaming Liability:** Users are solely responsible for the content they stream. The maintainers of VistterStudio are not liable for any legal issues that may arise from the content of a user's video streams.
*   **Cloud Security:** Users are responsible for securing their cloud deployments and managing access to their Firebase projects. Proper authentication and authorization must be configured for production use.
*   **Network Security:** While broadcast nodes are designed to run in local environments, users are responsible for securing their networks. Exposing broadcast node ports to the public internet is not recommended and should be done with caution.
*   **Data Security:** Users are responsible for implementing appropriate security measures for their data, including encryption in transit and at rest, access controls, and regular security updates.
*   **Not Affiliated with Third Parties:** VistterStudio is not an official product of Google, camera manufacturers, or any other third-party service provider and is not affiliated with, endorsed by, or sponsored by these companies.

## 5. License

The VistterStudio project, including all of its documentation and source code, is licensed under the **MIT License**. This allows for broad usage and modification while maintaining attribution requirements.
