# Domain structure

Each product capability lives in its own directory. Add folders only when a
domain needs them:

- `pages/`: route-level composition and UI.
- `components/`: UI used only by that domain.
- `services/`: browser APIs, HTTP clients, storage, and other I/O.
- `utils/`: pure domain transformations.
- `common/`: domain-local types, constants, and messages.

Cross-domain code belongs in `src/shared`. Application bootstrapping and route
composition belong in `src/app`. A domain must not import another domain's
internal modules; promote genuinely shared behavior to `shared` instead.
