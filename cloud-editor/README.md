# VistterStudio Cloud Editor

The cloud editor provides the configuration surface for building timeline segments that the broadcast node can execute. It currently exposes a lightweight React UI backed by an Express API, and will expand into the collaborative workflow described in the product docs.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS (workspace: `cloud-editor/frontend`)
- **Backend**: Node.js + Express (workspace: `cloud-editor/backend`)
- **Shared Types**: Reusable schemas and interfaces in the `shared` workspace

## Development

### Prerequisites

- Node.js ≥ 18
- npm ≥ 8

### Setup

All commands below are executed from the repository root so npm can orchestrate the workspaces.

```bash
# install dependencies for every workspace
npm install

# start the backend API (port 4000 by default)
npm run dev:backend

# in a second terminal, start the frontend dev server (port 5173)
npm run dev:frontend
```

### Available Scripts

- `npm run dev:frontend` – Launch the Vite dev server
- `npm run dev:backend` – Launch the Express API with nodemon
- `npm run build --workspace=cloud-editor/frontend` – Build the production frontend bundle
- `npm run test --workspaces --if-present` – Run any registered workspace test suites

## Project Structure

```
cloud-editor/
├── backend/
│   ├── package.json
│   └── server.js       # Express routes for segment CRUD + health check
└── frontend/
    ├── package.json
    ├── index.html
    └── src/
        ├── App.jsx
        ├── components/
        │   └── TimelineEditor.jsx
        ├── index.css
        └── main.jsx
```

## Current Capabilities

- Timeline segment CRUD backed by local JSON files
- Basic timeline form for capturing name, duration, and clip metadata
- REST API at `http://localhost:4000` for `GET/POST/PUT/DELETE /api/segments`
- Health endpoint at `GET /api/health`

## Planned (per PRD)

- Multi-user collaboration via Firebase Auth/Firestore
- Real-time timeline playback engine with thumbnail previews
- Dynamic data gadgets (weather, tide, ad placeholders)
- Broadcast node orchestration and scheduling from the cloud editor

## Configuration

Environment variables (backend):

- `PORT` – API port (`4000` default)
- `SEGMENTS_PATH` – Directory containing JSON segments (`../../data/segments` default)

Environment variables (frontend):

- `VITE_API_URL` – Base URL for the API (`http://localhost:4000` default)

