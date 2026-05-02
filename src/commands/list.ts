import { readManifest, readLockfile, getDawAdapter, FlStudioConfigError } from '@dawpm/core';
import { out, emitJson, colors } from '../util/output.js';
import { resolveConfig, dawConfig, type CliGlobals } from '../util/config.js';
import { displaySlug } from '../util/slug.js';

export async function listCommand(globals: CliGlobals): Promise<void> {
  const cwd = globals.cwd ?? process.cwd();
  const manifest = await readManifest(cwd);
  const lock = await readLockfile(cwd);
  const data = manifest.dependencies.map(slug => ({
    slug,
    installed: Boolean(lock?.packages[slug]),
    sha256: lock?.packages[slug]?.sha256,
  }));
  emitJson(data, () => {
    if (data.length === 0) { out.info('no dependencies'); return; }
    for (const d of data) {
      const status = d.installed ? colors.green('●') : colors.dim('○');
      process.stdout.write(`${status} ${colors.bold(displaySlug(d.slug))}${d.sha256 ? colors.dim(`  ${d.sha256.slice(0, 8)}`) : ''}\n`);
    }
  });
}

export async function scanCommand(globals: CliGlobals): Promise<void> {
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
  const found = await adapter.discover();
  emitJson(found, () => {
    if (found.length === 0) { out.info('no plugins found'); return; }
    for (const p of found) {
      process.stdout.write(`${colors.dim(p.format.padEnd(4))} ${colors.bold(p.name)}  ${colors.dim(p.path)}\n`);
    }
  });
}
