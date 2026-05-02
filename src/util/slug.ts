/**
 * Slug helpers shared by the CLI commands.
 *
 * Internally a slug is "ns/name" — that's what's stored in dawpm.yaml,
 * the lockfile, and the registry URLs. Users type "@ns/name" (npm-style)
 * on the command line and we display it the same way.
 */

const SLUG_RE = /^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*$/;

/** Parse user input ("dsk/overture" or "@dsk/overture") into the canonical slug. */
export function parseSlug(input: string): string {
  const slug = input.trim().replace(/^@/, '');
  if (!SLUG_RE.test(slug)) {
    throw new Error(`invalid plugin slug: "${input}" (expected "@ns/name")`);
  }
  return slug;
}

/** Format a canonical slug for display ("dsk/overture" -> "@dsk/overture"). */
export function displaySlug(slug: string): string {
  return slug.startsWith('@') ? slug : `@${slug}`;
}
