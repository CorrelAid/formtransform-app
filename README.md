# FormTransform

[![AI-Assisted](https://img.shields.io/badge/AI--assisted-Claude%20Code-blueviolet?logo=anthropic&logoColor=white)](./AI_DISCLOSURE.md)

A SvelteKit static site for converting [XLSForm](https://xlsform.org/) questionnaires to the [LimeSurvey TSV format](https://www.limesurvey.org/manual/Tab_Separated_Value_survey_structure).

## Prerequisites

- [Bun](https://bun.sh/) (package manager and runtime)
- [Node.js](https://nodejs.org/) >= 20

## Setup

```sh
# Install dependencies
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

## Deployment

The app is deployed via [Coolify](https://coolify.io/) using [nixpacks](https://nixpacks.com/). The `nixpacks.toml` pins the bun version used in the build container.
