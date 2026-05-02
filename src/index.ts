import { Command } from 'commander';
import { setLogLevel, setJsonMode, type LogLevel } from './util/output.js';
import { initCommand } from './commands/init.js';
import { installCommand } from './commands/install.js';
import { uninstallCommand } from './commands/uninstall.js';
import { searchCommand, infoCommand } from './commands/search.js';
import { listCommand, scanCommand } from './commands/list.js';
import { buildCommand } from './commands/build.js';
import { configCommand } from './commands/config.js';
import { out } from './util/output.js';

export async function main(argv: string[] = process.argv): Promise<void> {
  const program = new Command();
  program
    .name('dawpm')
    .description('Package manager for DAW plugins.')
    .version('1.0.0')
    .option('--json', 'output machine-readable JSON', false)
    .option('--log <level>', 'log level: silent|error|warn|info|debug', 'info')
    .option('--registry <url>', 'override registry URL')
    .option('--cwd <path>', 'run as if from this directory')
    .hook('preAction', cmd => {
      const o = cmd.optsWithGlobals();
      setJsonMode(Boolean(o.json));
      setLogLevel((o.log ?? 'info') as LogLevel);
    });

  const globals = () => program.opts();

  program
    .command('init <name>')
    .description('Create a new dawpm project')
    .requiredOption('--daw <id>', 'target DAW (e.g. fl-studio)')
    .option('--force', 'overwrite existing dawpm.yaml')
    .action(async (name: string, opts) => initCommand(name, opts, globals()));

  program
    .command('install [slug]')
    .alias('i')
    .description('Install everything in dawpm.yaml, or add+install a single plugin')
    .option('--dry-run', 'plan only, do not download or install')
    .action(async (slug: string | undefined, opts) => installCommand(slug, opts, globals()));

  program
    .command('uninstall <slug>')
    .alias('rm')
    .description('Remove a plugin from dawpm.yaml and delete its files')
    .action(async (slug: string) => uninstallCommand(slug, globals()));

  program
    .command('search <query>')
    .description('Search the registry')
    .action(async (q: string) => searchCommand(q, globals()));

  program
    .command('info <slug>')
    .description('Show details for a single plugin')
    .action(async (slug: string) => infoCommand(slug, globals()));

  program
    .command('list')
    .alias('ls')
    .description('List declared dependencies and their install status')
    .action(async () => listCommand(globals()));

  program
    .command('scan')
    .description('Discover plugins already installed for the current DAW')
    .action(async () => scanCommand(globals()));

  program
    .command('build')
    .description('Render the project via the DAW')
    .option('-o, --output <path>', 'output path')
    .option('-f, --format <fmt>', 'wav | mp3 | flac | midi', 'wav')
    .action(async opts => buildCommand(opts, globals()));

  program
    .command('config')
    .description('Print the resolved config')
    .action(async () => configCommand(globals()));

  try {
    await program.parseAsync(argv);
  } catch (err) {
    out.error((err as Error).message);
    process.exit(1);
  }
}

await main();
