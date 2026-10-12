// Version shown in the game: package.json version + git commit + build time.
// Used by both Vite configs; the main build also writes it to version.json
// so a running game can tell when a newer release has been deployed.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

function commit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return (process.env.GITHUB_SHA ?? 'dev').slice(0, 7);
  }
}

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export const buildInfo = { version: pkg.version, build: commit(), date: new Date().toISOString() };

/** Compile-time constants for the game code (see src/env.d.ts). */
export const buildDefines = {
  __APP_VERSION__: JSON.stringify(buildInfo.version),
  __APP_BUILD__: JSON.stringify(buildInfo.build),
  __APP_DATE__: JSON.stringify(buildInfo.date),
};

/** Writes version.json next to the game so it can check for updates. */
export function versionFile(): Plugin {
  return {
    name: 'sunny-spoon-version-file',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify(buildInfo) });
    },
  };
}
