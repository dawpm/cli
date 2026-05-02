import {
  readManifest, writeManifest, readLockfile, writeLockfile, emptyLockfile, uninstallPlugin,
} from '@dawpm/core';
import { out, emitJson } from '../util/output.js';
import { type CliGlobals } from '../util/config.js';
import { parseSlug, displaySlug } from '../util/slug.js';

export async function uninstallCommand(rawSlug: string, globals: CliGlobals): Promise<void> {
  const cwd = globals.cwd ?? process.cwd();
  const slug = parseSlug(rawSlug);
  const manifest = await readManifest(cwd);
  const lock = (await readLockfile(cwd)) ?? emptyLockfile(manifest);

  let removedFiles = 0;
  let missingFiles = 0;
  const entry = lock.packages[slug];
  if (entry) {
    const r = await uninstallPlugin(entry);
    removedFiles = r.removed.length;
    missingFiles = r.missing.length;
    delete lock.packages[slug];
    await writeLockfile(cwd, lock);
  }

  const wasInDeps = manifest.dependencies.includes(slug);
  if (wasInDeps) {
    manifest.dependencies = manifest.dependencies.filter(s => s !== slug);
    await writeManifest(cwd, manifest);
  }

  if (!entry && !wasInDeps) {
    out.warn(`${displaySlug(slug)} is not installed`);
    emitJson({ slug, removed: false }, () => undefined);
    return;
  }
  out.removed(slug);
  if (removedFiles > 0) out.info(`removed ${removedFiles} file${removedFiles === 1 ? '' : 's'} from disk`);
  if (missingFiles > 0) out.warn(`${missingFiles} file${missingFiles === 1 ? '' : 's'} were already gone`);
  emitJson({ slug, removed: true, removedFiles, missingFiles }, () => undefined);
}
