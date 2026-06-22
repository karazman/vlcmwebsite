# Sanity Integration for Insights Blog

This project syncs blog posts from Sanity into Hugo markdown files under `content/insights`.

## 1) Install dependencies

Run in project root:

```bash
npm install
```

## 2) Configure environment

Create a `.env.local` file in the project root (or set environment variables in your shell):

```env
SANITY_PROJECT_ID=yourProjectId
SANITY_DATASET=production
SANITY_API_VERSION=2025-01-01
SANITY_API_TOKEN=optionalReadToken
```

Notes:
- `SANITY_API_TOKEN` is optional for public datasets.
- The sync script skips gracefully if `SANITY_PROJECT_ID` or `SANITY_DATASET` is missing.
- In GitHub Actions, set the same keys as repository secrets.

## 3) Add schema to your Sanity Studio

Copy the schema files from this repository into your Sanity Studio project and include `schemaTypes` in your studio config:

- `sanity/schemaTypes/insightArticle.ts`
- `sanity/schemaTypes/index.ts`

## 4) Create content in Sanity

Create documents of type `Insight Article` with fields:
- title
- slug
- excerpt
- coverImage
- author
- publishedAt
- category
- tags
- body
- seoTitle
- seoDescription

## 5) Sync content to Hugo

Run:

```bash
npm run sanity:sync-insights
```

This writes markdown files to `content/insights/<slug>.md`.

Only published Sanity documents are synced. Drafts remain unpublished until they are published in Sanity.

## 6) Build Hugo site

Run:

```bash
npm run build
```

Because `prebuild` is configured, Sanity sync runs automatically before Hugo build.

Build output is written to `dist` for GitHub Pages deployment.
