import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import {
  writeManifest, manifestExists, listDaws, getDawAdapter, type Manifest, type DawId,
  FlStudioConfigError,
} from '@dawpm/core';
import { out, emitJson } from '../util/output.js';
import { resolveConfig, dawConfig, type CliGlobals } from '../util/config.js';

export interface InitOptions {
  daw?: string;
  force?: boolean;
}

export async function initCommand(name: string, opts: InitOptions, globals: CliGlobals): Promise<void> {
  if (!opts.daw) {
    throw new Error(`--daw is required. Available: ${listDaws().join(', ')}`);
  }
  const cwd = globals.cwd ?? process.cwd();
  const dir = path.resolve(cwd, name);
  await fs.mkdir(dir, { recursive: true });

  if (await manifestExists(dir) && !opts.force) {
    throw new Error(`dawpm.yaml already exists in ${dir}. Use --force to overwrite.`);
  }

  const projectFile = `${name}.flp`;
  const manifest: Manifest = {
    name,
    daw: opts.daw as DawId,
    project: projectFile,
    dependencies: [],
  };
  await writeManifest(dir, manifest);

  // Best-effort: create the empty project file. Skip if the adapter isn't configured.
  try {
    const cfg = await resolveConfig({ ...globals, cwd: dir });
    const adapter = getDawAdapter(opts.daw, { config: dawConfig(cfg, opts.daw) });
    await adapter.initProject(path.join(dir, projectFile));
    out.success(`created empty project ${projectFile}`);
  } catch (err) {
    if (err instanceof FlStudioConfigError) {
      out.warn(`skipped creating ${projectFile} — DAW not configured (${err.message.split('\n')[0]})`);
    } else {
      out.warn(`could not create ${projectFile}: ${(err as Error).message}`);
    }
  }

  emitJson({ dir, manifest }, () => {
    out.success(`initialized dawpm project at ${dir}`);
    out.info(`daw: ${opts.daw}`);
    out.info(`next: cd ${name} && dawpm install @<ns>/<name>`);
  });
}
