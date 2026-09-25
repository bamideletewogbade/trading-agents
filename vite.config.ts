import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in the ignored `.dev.vars`.
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import('@cloudflare/vite-plugin');

  return {
    css: { postcss: { plugins: [tailwindcss()] } },
    plugins: [
      vinext(),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        config: {
          /*
           * The Worker Cloudflare created when the repository was connected
           * (Workers & Pages › trading-agents, 25 Sep 2026). Every deploy,
           * from Workers Builds or `pnpm run deploy`, must name the same one.
           */
          name: 'trading-agents',
          main: 'vinext/server/fetch-handler',
          compatibility_flags: ['nodejs_compat'],
          // Keep https://trading-agents.bishoptewogbade.workers.dev on, and a
          // preview URL per version, whatever the dashboard was last set to.
          workers_dev: true,
          preview_urls: true,
          vars: {
            SITE_URL: 'https://trading-agents.bishoptewogbade.workers.dev',
          },
          // Values added in the dashboard (Settings › Variables and Secrets)
          // survive deploys instead of being replaced by this file's vars.
          keep_vars: true,
          // No bindings yet. R2 (share cards, spoken lines) arrives in Phase
          // 1, Queues and Cron Triggers with WhatsApp in Phase 5. See
          // docs/implementation-plan.md, section 2.
        },
      }),
    ],
  };
});
