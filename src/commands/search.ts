import { RegistryClient } from '@dawpm/core';
import { out, emitJson, colors } from '../util/output.js';
import { resolveConfig, type CliGlobals } from '../util/config.js';

export async function searchCommand(query: string, globals: CliGlobals): Promise<void> {
  const cfg = await resolveConfig(globals);
  const registry = new RegistryClient({ baseUrl: cfg.registry });
  const results = await registry.search(query);
  emitJson(results, () => {
    if (results.length === 0) {
      out.info(`no plugins match "${query}"`);
      return;
    }
    for (const p of results) {
      const tags = p.tags.length ? colors.dim(`  [${p.tags.join(', ')}]`) : '';
      process.stdout.write(`${colors.bold(p.slug)}  ${colors.dim(p.name)}${tags}\n`);
      process.stdout.write(`  ${p.description}\n`);
    }
  });
}

export async function infoCommand(slug: string, globals: CliGlobals): Promise<void> {
  const cfg = await resolveConfig(globals);
  const registry = new RegistryClient({ baseUrl: cfg.registry });
  const p = await registry.get(slug);
  emitJson(p, () => {
    process.stdout.write(`${colors.bold(p.name)} ${colors.dim(`(${p.slug})`)}\n`);
    process.stdout.write(`${p.description}\n\n`);
    process.stdout.write(`${colors.dim('author:')}   ${p.author}\n`);
    process.stdout.write(`${colors.dim('license:')}  ${p.license}\n`);
    if (p.homepage) process.stdout.write(`${colors.dim('homepage:')} ${p.homepage}\n`);
    process.stdout.write(`${colors.dim('size:')}     ${(p.download.size / 1024 / 1024).toFixed(1)} MiB\n`);
    process.stdout.write(`${colors.dim('formats:')}  ${p.install.map(i => i.format).join(', ')}\n`);
    if (p.tags.length) process.stdout.write(`${colors.dim('tags:')}     ${p.tags.join(', ')}\n`);
    process.stdout.write(`\n${colors.dim('install:')} ${colors.cyan(`dawpm install ${p.slug}`)}\n`);
  });
}
