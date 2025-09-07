# Legal & Compliance: VistterStudio + Wyze Bridge

This document outlines the legal and compliance considerations for the VistterStudio project.

## 1. Terms of Service (ToS)

As an open-source project, VistterStudio does not have a formal Terms of Service agreement between the project maintainers and its users. The use of the software is governed by its software license (see Section 5).

Users are responsible for their own compliance with the terms of service of any third-party services they use in conjunction with VistterStudio, including but not limited to:

*   **Wyze Labs, Inc.:** Users must adhere to the Wyze Terms of Service, particularly regarding the use of their accounts and camera hardware.
*   **Streaming Platforms:** Users who broadcast their video streams to platforms like YouTube, Twitch, or Facebook Live must comply with the terms of service of those platforms.

## 2. Privacy Policy

VistterStudio is a self-hosted application and does not collect, store, or transmit any personal data or video streams to the project maintainers or any third party.

*   **Data Storage:** All data, including Wyze credentials and camera streams, is stored locally on the user's machine. Credentials are read from a local `.env` file and used by the Wyze Bridge container to authenticate with Wyze's servers.
*   **Data Transmission:** Video streams are transmitted from the Wyze cameras to the Wyze servers, then to the local Wyze Bridge container. VistterStudio only processes these streams on the user's local network.
*   **User Responsibility:** Users are solely responsible for the privacy of the video streams they manage. If a user chooses to broadcast a stream publicly, they are responsible for ensuring they are not violating anyone's privacy.

## 3. Compliance Statements

### Wyze Bridge Licensing

VistterStudio utilizes the `docker-wyze-bridge` project, which is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. The AGPL-3.0 is a strong copyleft license that requires any derivative works or applications that interact with it over a network to also be licensed under the AGPL-3.0.

Given that VistterStudio is designed to interact directly with the Wyze Bridge over a network (even if it's a local Docker network), **VistterStudio itself must also be licensed under the AGPL-3.0** to comply with the terms of its core dependency.

*Action Required:* The project's `LICENSE` file must be updated from MIT to AGPL-3.0.

### Wyze API

The `docker-wyze-bridge` project uses an unofficial, reverse-engineered API to communicate with Wyze servers. This is subject to change or discontinuation by Wyze at any time. VistterStudio, by extension, also relies on this unofficial API. There is no formal guarantee of its continued functionality.

## 4. Disclaimers & Limitations

*   **No Warranty:** VistterStudio is provided "as is," without any warranty of any kind, express or implied. The project maintainers are not responsible for any damages or losses that may result from its use.
*   **Streaming Liability:** Users are solely responsible for the content they stream. The maintainers of VistterStudio are not liable for any legal issues that may arise from the content of a user's video streams.
*   **Security:** While VistterStudio is designed to be run in a local environment, users are responsible for securing their own networks. Exposing the VistterStudio or Wyze Bridge ports to the public internet is not recommended and should be done with caution.
*   **Not Affiliated with Wyze:** VistterStudio is not an official Wyze product and is not affiliated with, endorsed by, or sponsored by Wyze Labs, Inc.

## 5. License

The VistterStudio project, including all of its documentation and source code, should be licensed under the **AGPL-3.0**, in accordance with the licensing requirements of the `docker-wyze-bridge` project. The `LICENSE` file in the root of the repository will be updated to reflect this.
