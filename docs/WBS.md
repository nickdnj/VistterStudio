# Work Breakdown Structure (WBS)

**Progress**: Phase 1 (Local Development Foundation) • Tasks [4/4] • Last update: 2025-01-04 by Codex

## Phase 1: Local Development Foundation
Status: IN_PROGRESS  
Owner: Codex  
Start: 2025-01-03  
Due: 2025-01-10

**Description**  
Stabilise the reorganised repository so contributors can develop and test locally. Align npm workspaces with the new frontend/backend split, restore the Vite + Tailwind toolchain, and document the commands required to verify the Express services and React UI.

**Acceptance Criteria**
- [x] Root workspaces map to `cloud-editor/frontend`, `cloud-editor/backend`, `broadcast-node`, and `shared`
- [x] Frontend builds successfully with `npm run build --workspace=cloud-editor/frontend`
- [x] Backend service starts with `npm run dev:backend` and documents environment expectations
- [x] Backend APIs have a repeatable local test (`npm run test --workspace=cloud-editor/backend`)
- [x] README/WBS list the Phase 1 verification commands for future contributors

**Verification Plan**
- Automated:
  - cmd: `npm run build --workspace=cloud-editor/frontend`
  - cmd: `npm run lint --workspace=cloud-editor/frontend` (optional once lint script exists)
- Manual:
  1. `npm run dev:backend` → verify Express health at `http://localhost:4000/api/health`
  2. `npm run dev:frontend` → confirm Vite dev server serves the timeline editor without console errors

**To-Dos**
- [x] [P1-T1] Align npm workspace configuration and convenience scripts | type: dev | test: cmd: `npm run dev:frontend`
- [x] [P1-T2] Restore Tailwind + Vite build pipeline and relocate `src` entrypoints | type: dev | test: cmd: `npm run build --workspace=cloud-editor/frontend`
- [x] [P1-T3] Document backend `.env` template and startup instructions | type: doc | test: manual
- [x] [P1-T4] Capture Phase 1 verification checklist in `README.md` | type: doc | test: manual

**Run Log**
- 2025-01-04 14:05 Action: Updated root workspace mapping and npm scripts • Result: pass
- 2025-01-04 14:20 Action: Restored Vite/Tailwind toolchain and validated production build • Result: pass
- 2025-01-04 15:10 Action: Hardened backend/broadcast segment path handling and added local node:test coverage • Result: pass
- 2025-01-04 16:00 Action: Published shared segment helpers and refactored services to consume the package exports • Result: pass

## Phase 2: Docker Testing Environments
Status: NOT_STARTED  
Owner: TBD  
Start: 2025-01-10 (tentative)  
Due: 2025-01-17 (tentative)

**Description**  
Create reproducible Docker Compose stacks that emulate the Raspberry Pi appliance and the managed cloud environment (Firebase emulator suite, mock external APIs). These environments will unblock automated test runs ahead of real hardware deployments.

**Acceptance Criteria**
- [ ] ARM-compatible Docker image for the on-site appliance scenario
- [ ] Cloud emulator stack exposing Firebase Auth/Firestore stand-ins
- [ ] CI workflow capable of spinning up both environments for integration tests

## Phase 3: Firestore Deployment Enablement
Status: NOT_STARTED

**Description**  
Migrate persistence from local JSON files to Firestore, define security rules, and expose APIs that align with the PRD data model.

## Phase 4: Raspberry Pi Appliance Deployment
Status: NOT_STARTED

**Description**  
Package the broadcast runtime for Raspberry Pi, add health telemetry, and verify end-to-end synchronisation with the cloud backend.
