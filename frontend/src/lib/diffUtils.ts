import { createPatch } from 'diff';

/**
 * Generate a unified diff from original and modified code
 * Using the battle-tested 'diff' library
 */
export function createUnifiedDiff(
  originalCode: string,
  modifiedCode: string,
  filename: string = 'file'
): string {
  // Use the diff library to create a proper unified diff
  const patch = createPatch(
    filename,
    originalCode,
    modifiedCode,
    '', // old header (empty)
    '', // new header (empty)
    { context: 3 } // 3 lines of context
  );

  return patch;
}
