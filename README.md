# FormTransform

[![AI-Assisted](https://img.shields.io/badge/AI--assisted-Claude%20Code-blueviolet?logo=anthropic&logoColor=white)](./AI_DISCLOSURE.md)

A SvelteKit static site offering three browser-side conversion tools, all powered by [@correlaid/formtransform](https://github.com/CorrelAid/formtransform):

1. **XLSForm → LimeSurvey TSV** — convert [XLSForm](https://xlsform.org/) questionnaires to the [LimeSurvey TSV format](https://www.limesurvey.org/manual/Tab_Separated_Value_survey_structure).
2. **Kobo → DDI** — emit DDI-Codebook 2.5 XML from an XLSForm. With a raw KoboToolbox CSV export (`,`- or `;`-separated) added, it also emits a response-data CSV whose columns are the DDI variable names.
3. **LimeSurvey → DDI** — emit DDI-Codebook 2.5 XML from a LimeSurvey structure TSV.

The app is 100% client-side. No data leaves the browser.

FormTransform only covers the CDL survey ecosystem: forms using question types, appearances or expressions outside the [supported subset](https://github.com/CorrelAid/formtransform#supported-xlsform-subset) are rejected, not converted.

## Prerequisites

- [Bun](https://bun.sh/) (package manager and runtime)
- [Node.js](https://nodejs.org/) >= 20

## Setup

```sh
# Install dependencies. The postinstall step copies the @correlaid/cdl-design
# favicons into static/.
bun install

# Copy the example env file and fill in values as needed
cp .env.example .env
```

### Environment variables

| Variable       | Required | Description                                                                                                                     |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `GITHUB_TOKEN` | No       | GitHub personal access token. Avoids API rate limits (60 req/hour unauthenticated) when fetching content snippets during build. |

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
bun run test
```

The Playwright suite has four parts:

- `tests/golden.spec.ts` runs the library's own blessed fixtures through the GUI and compares the downloaded files with them. The fixtures come from the library release's `formtransform-fixtures-<version>.tar.gz` asset. `bun run test` downloads it first (`scripts/fetch-fixtures.mjs`), checks the sha256 pinned in `tests/formtransform-fixtures.json` and unpacks it to `node_modules/.cache/`. When you bump `@correlaid/formtransform`, update that pin too; the script refuses to run on a version mismatch. The fixtures cover every registered type (`registry/entities/*`: XLSForm → TSV, Kobo → DDI, LimeSurvey → DDI) and every whole-survey fixture (`tests/fixtures/surveys/*`).
- `tests/gui.spec.ts` checks UI behaviour: tab states, the Kobo mode switch, rejected forms, whether each option reaches the converter, keyboard use, and phone-width layout.
- `tests/accessibility.spec.ts` runs an axe-core WCAG 2.1 AA scan of every tab, in DE and EN, before and after a conversion.
- `tests/main.spec.ts` runs one upload smoke test per tab.

The dev server fetches the intro and liability snippets from the GitHub API when it starts. Without `GITHUB_TOKEN` you can hit the anonymous rate limit, and the imprint test then fails.

To diff the TSV tab's output against another version of the library, print it with `scripts/snapshot-tsv.mjs` (the second argument overrides the conversion config):

```sh
bun scripts/snapshot-tsv.mjs tests/fixtures/minimal.xlsx '{"hideNoAnswer":false}'
```

## Deployment

The app is deployed via [Coolify](https://coolify.io/) using [nixpacks](https://nixpacks.com/). The `nixpacks.toml` pins the bun version used in the build container.

The build output (`build/`) is fully static. `serve.js` is a tiny zero-dependency Node HTTP server used by the Coolify container; it serves `build/`. No special headers or WASM mime types are needed.
