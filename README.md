# Personal Site
### Using Template
Based on [ThoughtLite template](https://astro.build/themes/details/thoughtlite/)

1. [Use this template](https://github.com/new?template_name=astro-theme-thought-lite&template_owner=tuyuritio) to create a new repository or [fork](https://github.com/tuyuritio/astro-theme-thought-lite/fork) this repository.
2. Run the following commands:

```sh
git clone <your-repo-url>
cd <your-repo-name>
pnpm install
pnpm dev
```

## Configuration

Customize site configuration and internationalization (i18n) by modifying the following files:

- `.env`
- `astro.config.ts`
- `site.config.ts`

For basic configuration, refer to the [Site Configuration Guide](src/content/note/en/configuration.md).

For i18n configuration, refer to the [Internationalization Configuration Guide](src/content/note/en/internationalization.md).

### Umami Analytics (Optional)

Keep your Umami website ID out of committed source by storing it in `.env`:

```sh
cp .env.example .env
```

Then set:

```sh
PUBLIC_UMAMI_WEBSITE_ID=f84a92b0-dfb9-481b-85e1-9b3143061c91
```

The script is sourced from `https://cloud.umami.is/script.js`. If `PUBLIC_UMAMI_WEBSITE_ID` is empty, no analytics script is injected.

## Commands

The theme provides the following commonly used commands:

| Command | Action |
| --- | --- |
| `pnpm install` | Install project dependencies |
| `pnpm update` | Update project dependencies |
| `pnpm new` | Create a new content file |
| `pnpm dev` | Start the local development server (default: `http://localhost:4321`) |
| `pnpm check` | Run Astro type checking |
| `pnpm build` | Build the production version |
| `pnpm preview` | Preview the built site |
| `pnpm format` | Format code |
| `pnpm lint` | Lint code |


## Content

Content creation is centralized in the `src/content` directory, mainly including:

- `note` - Focused on carefully crafted and detailed long-form works
- `jotting` - Lightweight and immediate content recording
- `preface` - Displayed on the homepage as the first impression
- `information` - Containing various descriptive content

For details, refer to the [Content Creation Guide](src/content/note/en/content.md).

## Forgejo Deploy (RackNerd)

This repo includes a Forgejo Actions workflow at `.forgejo/workflows/deploy.yml` that:

1. Runs on pushes to `main`.
2. Bootstraps Node.js in user space (no root required on the runner).
3. Builds the Astro site with `pnpm build`.
4. Deploys `dist/` to your RackNerd VPS over SSH.

Configure these repository secrets in Forgejo:

| Secret | Example |
| --- | --- |
| `DEPLOY_HOST` | `your.vps.host.or.ip` |
| `DEPLOY_PORT` | `22` |
| `DEPLOY_USER` | `shane` |
| `DEPLOY_PATH` | `/home/deployer/sites/personal-site` |
| `DEPLOY_SSH_KEY` | optional private key used by the runner to SSH to RackNerd |
| `DEPLOY_HOST_KEY` | optional pinned host key line from `ssh-keyscan -H <host>` |
| `PUBLIC_UMAMI_WEBSITE_ID` | optional, e.g. `f84a92b0-dfb9-481b-85e1-9b3143061c91` |

One-time RackNerd prep:

```sh
mkdir -p /home/deployer/sites/personal-site
```

If `DEPLOY_SSH_KEY` is omitted, the workflow falls back to `/home/shane/.ssh/forgejo_deploy` on the runner.

## Local `/play` Development (HoopNerd Embed)

The `/play` page embeds the HoopNerd CPU game in a sandboxed iframe.
To test it locally you need HoopNerd running (see the
[HoopNerd README](https://github.com/shanet77/hoopnerd)
“Local Development” section — Postgres + seed, then `pnpm dev`).

```sh
# Terminal 1 — HoopNerd (from the hoopnerd repo).
# The env var lets the embed's ready/game-over messages reach your
# local Astro page instead of only the production domain.
NEXT_PUBLIC_EMBED_PARENT_ORIGINS=http://localhost:4321 pnpm dev

# Terminal 2 — this site, pointed at local HoopNerd.
PUBLIC_HOOPNERD_EMBED_ORIGIN=http://localhost:3000 pnpm dev
```

Then open <http://localhost:4321/play> and play a full game vs the CPU.

Notes:

- Without `PUBLIC_HOOPNERD_EMBED_ORIGIN`, `/play` points at
  `https://hoopnerd.xyz/embed/cpu` (the production default).
- Without `NEXT_PUBLIC_EMBED_PARENT_ORIGINS` on the HoopNerd side, the
  game still plays, but the parent page never receives the `ready` ping —
  so the loader spins for 15s and shows the “unavailable” fallback. Set
  the var; it is dev-only and never deployed.
- `/play` is excluded from Swup transitions (`ignore` in
  `astro.config.ts`), so visiting it is always a full page load — the
  iframe socket state is never half-preserved across navigation.

## Forgejo Contribution Heatmap Snapshot

This repo now includes a scheduled workflow at `.forgejo/workflows/refresh-heatmap.yml` that runs hourly and updates:

- `public/data/forgejo-heatmap.json`

The snapshot is generated from:

- `https://forge.shanenet.xyz/api/v1/users/shane/heatmap`

You can regenerate locally with:

```sh
pnpm generate:heatmap
```

Optional environment overrides for the generator:

- `FORGEJO_HEATMAP_URL`
- `FORGEJO_HEATMAP_TIMEZONE`
- `FORGEJO_HEATMAP_MONTHS`
- `FORGEJO_HEATMAP_WEEKS`
- `FORGEJO_HEATMAP_OUTPUT`
- `FORGEJO_HEATMAP_TIMEOUT_MS`
- `FORGEJO_HEATMAP_FAIL_ON_ERROR`

For caching, keep the path stable (`/data/forgejo-heatmap.json`) and configure short TTL headers at your reverse proxy / CDN layer.
