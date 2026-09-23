import { describe, expect, it } from 'vitest';
import { safeReturnPath } from '../src/lib/demo-session';

/**
 * The sign-in screen can send someone back to the page they asked for.
 * These checks make sure it only ever sends them somewhere inside the chosen portal.
 */
describe('safeReturnPath', () => {
  it('keeps a page inside the chosen portal, query included', () => {
    expect(safeReturnPath('/dars/queue/?filter=unassigned14', '/dars/')).toBe(
      '/dars/queue/?filter=unassigned14',
    );
  });

  it('drops a page from a different portal', () => {
    expect(safeReturnPath('/state/map/', '/dars/')).toBeNull();
  });

  it('drops anything that is not a path on this site', () => {
    expect(safeReturnPath('https://example.com/dars/', '/dars/')).toBeNull();
    expect(safeReturnPath('//example.com/dars/', '/dars/')).toBeNull();
    expect(safeReturnPath(null, '/dars/')).toBeNull();
  });
});
