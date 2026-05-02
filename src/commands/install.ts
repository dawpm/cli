import {
  readManifest, writeManifest, writeLockfile, readLockfile, emptyLockfile,
  RegistryClient, getDawAdapter, installPlugin, defaultCacheDir,
  FlStudioConfigError,
} from '@dawpm/core';
import { out, emitJson } from '../util/output.js';
import { resolveConfig, dawConfig, type CliGlobals } from '../util/config.js';

export interface InstallOptions {
  dryRun?: boolean;
}

export async function installCommand(
  slug: string | undefined,
  opts: InstallOptions,
  globals: CliGlobals,
): Promise<void> {
  const cwd = globals.cwd ?? process.cwd();
  const cfg = await resolveConfig(globals);
  const manifest = await readManifest(cwd);

  let adapter;
  try {
    adapter = getDawAdapter(manifest.daw, { config: dawConfig(cfg, manifest.daw) });
  } catch (err) {
    if (err instanceof FlStudioConfigError) { out.error(err.message); process.exit(1); }
    throw err;
  }

  const registry = new RegistryClient({ baseUrl: cfg.registry });
  const lock = (await readLockfile(cwd)) ?? emptyLockfile(manifest);

  // Targets: a single slug if provided, otherwise everything in dawpm.yaml.
  const targets: string[] = slug ? [slug] : [...manifest.dependencies];
  if (targets.length === 0) {
    out.info('no dependencies to install');
    emitJson({ added: [], cached: [], failed: [] }, () => undefined);
    return;
  }

  const t0 = Date.now();
  const added: string[] = [];
  const cached: string[] = [];
  const failed: { slug: string; error: string }[] = [];

  for (const target of targets) {
    out.step(`resolving ${target}`);
    let plugin;
    try {
      plugin = await registry.get(target);
    } catch (err) {
      const msg = (err as Error).message;
      out.error(`${target}: ${msg}`);
      failed.push({ slug: target, error: msg });
      continue;
    }
    if (opts.dryRun) {
      out.info(`would install ${plugin.slug} (${plugin.download.size} bytes)`);
      continue;
    }
    out.step(`downloading ${plugin.slug}`);
    try {
      const { entry, result } = await installPlugin({
        plugin, adapter, cacheDir: cfg.cache ?? defaultCacheDir(),
      });
      lock.packages[plugin.slug] = entry;
      if (result.fromCache) {
        cached.push(plugin.slug);
        out.cached(plugin.slug);
      } else {
        added.push(plugin.slug);
        out.added(plugin.slug);
      }
    } catch (err) {
      const msg = (err as Error).message;
      out.error(`${target}: ${msg}`);
      failed.push({ slug: target, error: msg });
      continue;
    }
  }

  // Add new slug to manifest if it wasn't there yet.
  if (slug && !manifest.dependencies.includes(slug) && !failed.find(f => f.slug === slug)) {
    manifest.dependencies = [...manifest.dependencies, slug].sort();
    await writeManifest(cwd, manifest);
  }
  if (!opts.dryRun) await writeLockfile(cwd, lock);

  out.summary({
    added: added.length,
    cached: cached.length,
    failed: failed.length,
    durationMs: Date.now() - t0,
  });
  emitJson({ added, cached, failed }, () => undefined);
  if (failed.length > 0) process.exit(1);
}
