# FormTransform

[![AI-Assisted](https://img.shields.io/badge/AI--assisted-Claude%20Code-blueviolet?logo=anthropic&logoColor=white)](./AI_DISCLOSURE.md)

A SvelteKit static site offering two browser-side conversion tools:

1. **XLSForm → LimeSurvey TSV** — convert [XLSForm](https://xlsform.org/) questionnaires to the [LimeSurvey TSV format](https://www.limesurvey.org/manual/Tab_Separated_Value_survey_structure). Powered by [@correlaid/formtransform](https://github.com/CorrelAid/formtransform).
2. **Kobo → DDI** — emit DDI-Codebook 2.5 XML (and an optional response CSV) from an XLSForm plus a raw KoboToolbox CSV export. Metadata-only mode is supported (XLSForm alone). Powered by [@correlaid/formtransform](https://github.com/CorrelAid/formtransform).

The app is 100% client-side. No data leaves the browser.

## Prerequisites

- [Bun](https://bun.sh/) (package manager and runtime)
- [Node.js](https://nodejs.org/) >= 20

## Setup

```sh
# Install dependencies. The postinstall step copies the @correlaid/cdl-design
# favicons into static/; no Python or Pyodide setup is needed anymore.
bun install

# Copy the example env file and fill in values as needed
cp .env.example .env
```

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
# Browser-mode unit tests
bun run test:unit

# Playwright e2e
bun test
```

## Deployment

The app is deployed via [Coolify](https://coolify.io/) using [nixpacks](https://nixpacks.com/). The `nixpacks.toml` pins the bun version used in the build container.

The build output (`build/`) is fully static. `serve.js` is a tiny zero-dependency Node HTTP server used by the Coolify container; it serves `build/` and includes mime types for `.wasm` (required by Pyodide) and `.whl`.
