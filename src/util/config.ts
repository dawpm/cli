import { loadConfig, type DawpmConfig } from '@dawpm/core';

const DEFAULT_REGISTRY = 'https://dawpm-registry.vercel.app';

const DEFAULTS: DawpmConfig = {
  registry: DEFAULT_REGISTRY,
  log: 'info',
};

export interface CliGlobals {
  registry?: string;
  log?: string;
  json?: boolean;
  cwd?: string;
}

export interface ResolvedConfig extends DawpmConfig {
  registry: string;
}

export async function resolveConfig(globals: CliGlobals): Promise<ResolvedConfig> {
  const cli: DawpmConfig = {};
  if (globals.registry) cli.registry = globals.registry;
  if (globals.log) cli.log = globals.log as DawpmConfig['log'];
  const cfg = await loadConfig({ cwd: globals.cwd ?? process.cwd(), cli, defaults: DEFAULTS });
  return { ...cfg, registry: cfg.registry ?? DEFAULT_REGISTRY };
}

/**
 * Look up the per-DAW config block from .dawpmrc, e.g. cfg.daw['fl-studio'].
 */
export function dawConfig(cfg: DawpmConfig, dawId: string): Record<string, string> {
  const all = cfg.daw ?? {};
  return (all as Record<string, Record<string, string>>)[dawId] ?? {};
}
