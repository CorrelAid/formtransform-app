# FormTransform

[![AI-Assisted](https://img.shields.io/badge/AI--assisted-Claude%20Code-blueviolet?logo=anthropic&logoColor=white)](./AI_DISCLOSURE.md)

A SvelteKit static site offering two browser-side conversion tools:

1. **XLSForm → LimeSurvey TSV** — convert [XLSForm](https://xlsform.org/) questionnaires to the [LimeSurvey TSV format](https://www.limesurvey.org/manual/Tab_Separated_Value_survey_structure). Powered by [xlsform2lstsv](https://github.com/CorrelAid/xlsform2lstsv).
2. **Kobo → DDI** — emit DDI-Codebook 2.5 XML (and optional response CSV) from an XLSForm plus a raw KoboToolbox CSV export. Metadata-only mode supported (XLSForm alone). Powered by [survey2ddi](https://github.com/CorrelAid/survey2ddi) running in the browser via [Pyodide](https://pyodide.org/) (CPython compiled to WebAssembly).

The app is 100% client-side. No data leaves the browser.

## Prerequisites

- [Bun](https://bun.sh/) (package manager and runtime)
- [Node.js](https://nodejs.org/) >= 20

## Setup

```sh
# Install dependencies (postinstall stages Pyodide + survey2ddi wheel into static/)
bun install

# Copy the example env file and fill in values as needed
cp .env.example .env
```

The `postinstall` hook runs [`scripts/setup-pyodide.mjs`](./scripts/setup-pyodide.mjs), which:

- copies Pyodide core (`pyodide.js`, `pyodide.asm.wasm`, `python_stdlib.zip`, …) from `node_modules/pyodide` into `static/pyodide/`
- downloads the pinned `survey2ddi` wheel into `static/wheels/`

Both directories are gitignored. Bundled Pyodide packages (micropip, etc.) are still loaded from the jsdelivr CDN at runtime via Pyodide's `packageBaseUrl`.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `GITHUB_TOKEN` | No | GitHub personal access token. Avoids API rate limits (60 req/hour unauthenticated) when fetching content snippets during build. |

## Developing

```sh
bun run dev

# or start the server and open the app in a new browser tab
bun run dev -- --open
```

## Building

```sh
bun run build
```

Preview the production build locally:

```sh
bun run preview
```

## Testing

```sh
# Browser-mode unit tests (Pyodide + survey2ddi integration)
bun run test:unit

# Playwright e2e
bun test
```

The Pyodide integration test (`src/lib/pyodide.svelte.test.ts`) exercises survey2ddi end-to-end against a minimal XLSForm fixture (`tests/fixtures/minimal.xlsx`). First run is slow (~5s) due to Pyodide cold start; subsequent assertions reuse the singleton.

## Deployment

The app is deployed via [Coolify](https://coolify.io/) using [nixpacks](https://nixpacks.com/). The `nixpacks.toml` pins the bun version used in the build container.

The build output (`build/`) is fully static. `serve.js` is a tiny zero-dependency Node HTTP server used by the Coolify container; it serves `build/` and includes mime types for `.wasm` (required by Pyodide) and `.whl`.
