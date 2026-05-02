import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs, createReadStream, statSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import * as http from 'node:http';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';

/**
 * Full e2e: serves a fake registry + zip over HTTP, runs the real CLI,
 * verifies the dll lands in the fake FL Studio root.
 *
 * Skipped automatically if /tmp/dsk/DSK_Overture.zip isn't available.
 */
const ZIP = '/tmp/dsk/DSK_Overture.zip';
const BIN = path.resolve(__dirname, '..', 'bin', 'dawpm.mjs');
const HAS_ZIP = existsSync(ZIP);

let server: http.Server;
let port: number;
let work: string;
let sha: string;
let size: number;

function plugin() {
  return {
    slug: 'dsk/overture',
    name: 'DSK Overture',
    description: 'Free orchestral VSTi.',
    author: 'DSK Music',
    license: 'freeware',
    homepage: 'https://www.dskmusic.com/dsk-overture',
    tags: ['orchestra'],
    download: {
      url: `http://127.0.0.1:${port}/zip/dsk-overture.zip`,
      sha256: sha,
      size,
    },
    install: [{ format: 'vst', include: ['**/*.dll'], strip: 1 }],
  };
}

beforeAll(async () => {
  if (!HAS_ZIP) return;
  const buf = await fs.readFile(ZIP);
  sha = createHash('sha256').update(buf).digest('hex');
  size = statSync(ZIP).size;

  server = http.createServer((req, res) => {
    if (req.url === '/api/v1/plugins/dsk/overture') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(plugin()));
      return;
    }
    if (req.url === '/api/v1/plugins') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        count: 1,
        plugins: [plugin()],
      }));
      return;
    }
    if (req.url === '/zip/dsk-overture.zip') {
      res.writeHead(200, { 'content-type': 'application/zip', 'content-length': String(size) });
      createReadStream(ZIP).pipe(res);
      return;
    }
    res.writeHead(404); res.end();
  });
  await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
  port = (server.address() as { port: number }).port;
  work = await fs.mkdtemp(path.join(tmpdir(), 'dawpm-e2e-'));
});

afterAll(async () => {
  if (!HAS_ZIP) return;
  await new Promise<void>(r => server.close(() => r()));
  await fs.rm(work, { recursive: true, force: true });
});

function run(args: string[], cwd: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [BIN, '--registry', `http://127.0.0.1:${port}`, ...args], {
      cwd,
      env: { ...process.env, NO_COLOR: '1' },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk.toString('utf8'); });
    child.stderr.on('data', chunk => { stderr += chunk.toString('utf8'); });
    child.on('error', reject);
    child.on('close', code => {
      resolve({ code: code ?? 0, stdout, stderr });
    });
  });
}

describe.skipIf(!HAS_ZIP)('e2e: dawpm install dsk/overture', () => {
  it('downloads, verifies sha, extracts dll into fake FL root', async () => {
    const fakeFl = path.join(work, 'fake-fl');
    const proj = path.join(work, 'proj');
    const cache = path.join(work, 'cache');
    await fs.mkdir(fakeFl, { recursive: true });
    await fs.mkdir(proj, { recursive: true });

    await fs.writeFile(path.join(proj, 'dawpm.yaml'), `name: smoke\ndaw: fl-studio\ndependencies: []\n`);
    await fs.writeFile(path.join(proj, '.dawpmrc'),
      `cache = ${cache}\n[daw.fl-studio]\nroot = ${fakeFl}\n`,
    );

    const r = await run(['install', '@dsk/overture', '--cwd', proj], proj);
    if (r.code !== 0) {
      console.error('STDOUT:', r.stdout);
      console.error('STDERR:', r.stderr);
    }
    expect(r.code).toBe(0);

    // dll landed in <root>/Plugins/VST/
    const dll = path.join(fakeFl, 'Plugins', 'VST', 'DSK Overture.dll');
    const stat = await fs.stat(dll);
    expect(stat.size).toBeGreaterThan(1_000_000);

    // manifest now lists the slug
    const manifest = await fs.readFile(path.join(proj, 'dawpm.yaml'), 'utf8');
    expect(manifest).toMatch(/dsk\/overture/);

    // lockfile was written
    const lock = await fs.readFile(path.join(proj, 'dawpm.lock.yaml'), 'utf8');
    expect(lock).toMatch(/dsk\/overture/);
    expect(lock).toMatch(/lockfileVersion: 1/);

    // second run: cached
    const r2 = await run(['install', '@dsk/overture', '--cwd', proj], proj);
    expect(r2.code).toBe(0);
    expect(r2.stdout + r2.stderr).toMatch(/cached/);

    // uninstall removes the dll
    const r3 = await run(['uninstall', '@dsk/overture', '--cwd', proj], proj);
    expect(r3.code).toBe(0);
    await expect(fs.stat(dll)).rejects.toThrow();

    const manifest2 = await fs.readFile(path.join(proj, 'dawpm.yaml'), 'utf8');
    expect(manifest2).not.toMatch(/dsk\/overture/);
  }, 60_000);
});
