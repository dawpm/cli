import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';

const BIN = path.resolve(__dirname, '..', 'bin', 'dawpm.mjs');

function run(args: string[], cwd: string) {
  const r = spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } });
  return { code: r.status ?? 0, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

describe('cli smoke', () => {
  it('--version prints 1.0.0', () => {
    const r = run(['--version'], process.cwd());
    expect(r.code).toBe(0);
    expect(r.stdout.trim()).toBe('1.0.0');
  });

  it('--help mentions install and search', () => {
    const r = run(['--help'], process.cwd());
    expect(r.code).toBe(0);
    expect(r.stdout).toMatch(/install/);
    expect(r.stdout).toMatch(/search/);
    expect(r.stdout).toMatch(/info/);
  });

  it('init creates a versionless dawpm.yaml', async () => {
    const work = await fs.mkdtemp(path.join(tmpdir(), 'dawpm-cli-'));
    try {
      const r = run(['init', 'demo', '--daw', 'fl-studio', '--cwd', work], work);
      expect(r.code).toBe(0);
      const txt = await fs.readFile(path.join(work, 'demo', 'dawpm.yaml'), 'utf8');
      expect(txt).toMatch(/name: demo/);
      expect(txt).toMatch(/daw: fl-studio/);
      expect(txt).not.toMatch(/version:/);
      expect(txt).toMatch(/dependencies: \[\]/);
    } finally {
      await fs.rm(work, { recursive: true, force: true });
    }
  });
});
