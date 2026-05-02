import * as path from 'node:path';
import { readManifest, getDawAdapter, FlStudioConfigError } from '@dawpm/core';
import { out, emitJson } from '../util/output.js';
import { resolveConfig, dawConfig, type CliGlobals } from '../util/config.js';

export interface BuildOptions {
  output?: string;
  format?: 'wav' | 'mp3' | 'flac' | 'midi';
}

export async function buildCommand(opts: BuildOptions, globals: CliGlobals): Promise<void> {
  const cwd = globals.cwd ?? process.cwd();
  const cfg = await resolveConfig(globals);
  const manifest = await readManifest(cwd);
  if (!manifest.project) {
    throw new Error('no `project` field in dawpm.yaml');
  }
  let adapter;
  try {
    adapter = getDawAdapter(manifest.daw, { config: dawConfig(cfg, manifest.daw) });
  } catch (err) {
    if (err instanceof FlStudioConfigError) { out.error(err.message); process.exit(1); }
    throw err;
  }
  const projectPath = path.resolve(cwd, manifest.project);
  out.step(`rendering ${manifest.project} → ${opts.format ?? 'wav'}`);
  const result = await adapter.build({ project: projectPath, output: opts.output, format: opts.format });
  emitJson(result, () => {
    for (const o of result.outputs) out.success(o);
  });
}
