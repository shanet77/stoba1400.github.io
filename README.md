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

### Plausible Analytics (Optional)

Keep your Plausible domain/script out of committed source by storing it in `.env`:

```sh
cp .env.example .env
```

Then set:

```sh
PUBLIC_PLAUSIBLE_SCRIPT_SRC=https://plausible.your-domain.com/js/pa-your-script-id.js
```

If `PUBLIC_PLAUSIBLE_SCRIPT_SRC` is empty, no analytics script is injected.

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

One-time RackNerd prep:

```sh
mkdir -p /home/deployer/sites/personal-site
```

If `DEPLOY_SSH_KEY` is omitted, the workflow falls back to `/home/shane/.ssh/forgejo_deploy` on the runner.
