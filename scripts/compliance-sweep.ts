/**
 * Scans the static build output for stack, tool, host, or vendor names on any surface a
 * person can read (CLAUDE.md §1.1).
 *
 * What this checks and what it deliberately does not:
 *   - CHECKED: the visible text of every page, plus any documentation file that ships.
 *     This is what appears on screen, in a screenshot, and in a printed page.
 *   - NOT CHECKED: minified framework bundles and the router's serialised payloads.
 *     Those are machine surfaces. A build tool's own name is unavoidably inside its own
 *     output, and pretending otherwise would make this check fail forever while proving
 *     nothing — anyone able to read a minified chunk can read the network tab anyway.
 *
 * Run after `npm run build`: `npm run sweep`
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { STACK_WORD_BLOCKLIST } from './lib/reference';

/**
 * Files a human can read. Everything under `_next/` is machine output, and every
 * `index.txt` beside a page is the router's serialised payload for that page, not a
 * document anyone opens.
 */
function isReadableSurface(file: string): boolean {
  if (file.split(path.sep).includes('_next')) return false;
  if (path.basename(file).toLowerCase() === 'index.txt') return false;
  return /\.(html|txt|md|xml|svg)$/i.test(file);
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (isReadableSurface(full)) files.push(full);
  }
  return files;
}

/**
 * Reduces a page to the words a reader actually sees: no scripts, no styles, no markup,
 * no attributes. Script contents carry chunk filenames and serialised module ids, none
 * of which appear on screen.
 */
function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ');
}

/** Whole-word match, so a hex hash containing "d3" is not a violation. */
function mentions(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(text);
}

function main(): void {
  const outDir = path.resolve(process.cwd(), 'out');
  let files: string[];
  try {
    files = walk(outDir);
  } catch {
    console.error('No out/ directory. Run `npm run build` first.');
    process.exit(1);
  }

  const hits: { file: string; word: string; excerpt: string }[] = [];

  for (const file of files) {
    const raw = readFileSync(file, 'utf8');
    const text = /\.html$/i.test(file) ? visibleText(raw) : raw;

    for (const word of STACK_WORD_BLOCKLIST) {
      if (!mentions(text, word)) continue;
      const at = text.toLowerCase().indexOf(word.toLowerCase());
      hits.push({
        file: path.relative(outDir, file),
        word,
        excerpt: text.slice(Math.max(0, at - 40), at + word.length + 40).trim(),
      });
    }
  }

  console.log(
    `Scanned ${files.length} reader-facing files in out/ for ${STACK_WORD_BLOCKLIST.length} forbidden terms.`,
  );

  if (hits.length === 0) {
    console.log('No stack, tool, host, or vendor name appears on any readable surface. ✓');
    return;
  }

  console.error('\nForbidden terms found on a readable surface:\n');
  for (const hit of hits) {
    console.error(`  ${hit.word} → ${hit.file}`);
    console.error(`      …${hit.excerpt}…`);
  }
  process.exit(1);
}

main();
