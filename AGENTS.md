# Repository Guidelines

Welcome to the Vistter Studio monorepo. Use this guide as your quick reference for keeping the editor, API, and timeline tooling consistent across workspaces.

## Project Structure & Module Organization
- `cloud-editor/frontend` hosts the Vite React UI; UI tests reside in `timeline/viewport/__tests__` alongside timeline code.
- `cloud-editor/backend` delivers the Express API, with Node test suites under `cloud-editor/backend/__tests__`.
- `broadcast-node` runs the headless timeline service; shared utilities compile from `shared/src` to `shared/dist`.
- Segment fixtures live in `data/segments`; historical references remain in `legacy`; diagrams and proposals belong in `docs/`.

## Build, Test, and Development Commands
- Install dependencies once with `npm run install-all`; use `npm run clean` when swapping branches to purge stale `dist` output.
- Start local development via `npm run dev:frontend` (Vite) and `npm run dev:backend` (API + nodemon); the root `npm run dev` targets the frontend only.
- Build shared helpers with `npm run build --workspace=@vistterstudio/shared` or keep the watcher running using `npm run dev --workspace=@vistterstudio/shared`.
- Run the monorepo pipeline with `npm run build`; validate behavior with `npm run test` before opening a PR.

## Coding Style & Naming Conventions
- Follow two-space indentation, preserve existing semicolon usage, and prefer single quotes in React modules.
- Frontend modules stay ES Modules; backend code remains CommonJS; lint UI changes with `npm run lint --workspace=cloud-editor/frontend`.
- Segment JSON IDs must match `SEGMENT_ID_PATTERN` from `shared/utils/segments.ts`; keep naming consistent with the owning workspace.

## Testing Guidelines
- Backend uses Node’s built-in test runner; add `*.test.js` suites beside features in `cloud-editor/backend`.
- Frontend interaction tests sit near timeline code as `*.test.tsx`; refresh fixtures in `data/segments` when scenarios change.
- Always execute `npm run test`; document any skipped cases and consider fixture impacts on downstream tools.

## Commit & Pull Request Guidelines
- Write short, imperative commit subjects (emoji optional) and scope each commit to a single workspace when feasible; mention cross-cutting impact in the body.
- PRs should describe user-facing effects, enumerate touched workspaces, reference related issues, and attach UI screenshots or recordings when visuals change.
- Note configuration updates for broadcast-node operators so deployments remain predictable; summarize testing status in the PR description.

## Environment & Configuration
- Duplicate `env.example` to `.env` to mirror production; never commit secrets—store operational notes in `docs/`.
- The backend honors `SEGMENTS_PATH` for custom segment storage; align local paths before running API tests.
- Update `docs/CONTAINERIZED_SETUP.md` when container ports or expectations shift so contributors stay coordinated.
