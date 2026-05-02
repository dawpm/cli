import pc from 'picocolors';

export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

const LEVELS: Record<LogLevel, number> = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 };

let currentLevel: LogLevel = 'info';
let asJson = false;
let useColor = process.stdout.isTTY === true && !process.env.NO_COLOR;

export function setLogLevel(l: LogLevel): void { currentLevel = l; }
export function setJsonMode(v: boolean): void { asJson = v; }
export function setUseColor(v: boolean): void { useColor = v; }

const c = {
  dim:    (s: string) => useColor ? pc.dim(s)    : s,
  bold:   (s: string) => useColor ? pc.bold(s)   : s,
  cyan:   (s: string) => useColor ? pc.cyan(s)   : s,
  green:  (s: string) => useColor ? pc.green(s)  : s,
  yellow: (s: string) => useColor ? pc.yellow(s) : s,
  red:    (s: string) => useColor ? pc.red(s)    : s,
  magenta:(s: string) => useColor ? pc.magenta(s): s,
  blue:   (s: string) => useColor ? pc.blue(s)   : s,
};

function emit(level: LogLevel, glyph: string, msg: string): void {
  if (LEVELS[level] > LEVELS[currentLevel]) return;
  if (asJson) return; // suppress prose in json mode
  const out = level === 'error' || level === 'warn' ? process.stderr : process.stdout;
  out.write(`${glyph} ${msg}\n`);
}

export const out = {
  step:    (m: string) => emit('info',  c.cyan('›'),    m),
  success: (m: string) => emit('info',  c.green('✓'),  m),
  added:   (slug: string) => emit('info', c.green('+'), c.bold(slug)),
  removed: (slug: string) => emit('info', c.red('-'),   c.bold(slug)),
  cached:  (slug: string) => emit('info', c.dim('•'),   `${slug} ${c.dim('(cached)')}`),
  warn:    (m: string) => emit('warn',  c.yellow('⚠'), m),
  error:   (m: string) => emit('error', c.red('✗'),    m),
  info:    (m: string) => emit('info',  c.dim('·'),    m),
  debug:   (m: string) => emit('debug', c.dim('»'),    c.dim(m)),

  /** Final summary line, e.g. "Done in 2.3s · 1 added · 0 cached · 0 failed". */
  summary(parts: { added: number; cached: number; failed: number; durationMs: number }) {
    if (asJson) return;
    const sec = (parts.durationMs / 1000).toFixed(1);
    const segments = [
      c.bold(`Done in ${sec}s`),
      `${c.green(String(parts.added))} added`,
      `${c.dim(String(parts.cached))} cached`,
      `${parts.failed > 0 ? c.red(String(parts.failed)) : c.dim('0')} failed`,
    ];
    process.stdout.write(c.dim('—').repeat(0) + segments.join(c.dim(' · ')) + '\n');
  },
};

/** Emit JSON when --json is set, otherwise call the prose fallback. */
export function emitJson(data: unknown, fallback: () => void): void {
  if (asJson) {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
  } else {
    fallback();
  }
}

export const colors = c;
