import { describe, it, expect } from 'vitest'
import { createUnifiedDiff } from './diffUtils'

describe('diffUtils', () => {
  describe('createUnifiedDiff', () => {
    it('generates a unified diff for simple changes', () => {
      const original = 'Hello World'
      const modified = 'Hello Universe'

      const diff = createUnifiedDiff(original, modified)

      expect(diff).toContain('Hello')
      expect(diff).toContain('-Hello World')
      expect(diff).toContain('+Hello Universe')
    })

    it('generates a unified diff for multiline changes', () => {
      const original = `line 1
line 2
line 3
line 4`

      const modified = `line 1
line 2 modified
line 3
line 4`

      const diff = createUnifiedDiff(original, modified)

      expect(diff).toContain('-line 2')
      expect(diff).toContain('+line 2 modified')
    })

    it('generates a unified diff for added lines', () => {
      const original = `line 1
line 2`

      const modified = `line 1
line 2
line 3`

      const diff = createUnifiedDiff(original, modified)

      expect(diff).toContain('+line 3')
    })

    it('generates a unified diff for removed lines', () => {
      const original = `line 1
line 2
line 3`

      const modified = `line 1
line 3`

      const diff = createUnifiedDiff(original, modified)

      expect(diff).toContain('-line 2')
    })

    it('returns no changes for identical content', () => {
      const content = 'Same content'
      const diff = createUnifiedDiff(content, content)

      // Patch will still contain headers but no actual changes
      expect(diff).toContain('file')
      expect(diff).not.toContain('-Same content')
      expect(diff).not.toContain('+Same content')
    })

    it('uses custom filename in diff', () => {
      const original = 'original'
      const modified = 'modified'
      const filename = 'test.ts'

      const diff = createUnifiedDiff(original, modified, filename)

      expect(diff).toContain('test.ts')
    })

    it('uses default filename when not provided', () => {
      const original = 'original'
      const modified = 'modified'

      const diff = createUnifiedDiff(original, modified)

      expect(diff).toContain('file')
    })

    it('handles empty strings', () => {
      const diff = createUnifiedDiff('', '')

      expect(diff).toBeTruthy()
      expect(typeof diff).toBe('string')
    })

    it('generates diff when adding content to empty string', () => {
      const original = ''
      const modified = 'new content'

      const diff = createUnifiedDiff(original, modified)

      expect(diff).toContain('+new content')
    })

    it('generates diff when removing all content', () => {
      const original = 'old content'
      const modified = ''

      const diff = createUnifiedDiff(original, modified)

      expect(diff).toContain('-old content')
    })

    it('shows context lines around changes', () => {
      const original = `line 1
line 2
line 3
line 4
line 5
line 6
line 7`

      const modified = `line 1
line 2
line 3
line 4 modified
line 5
line 6
line 7`

      const diff = createUnifiedDiff(original, modified)

      // Should show context (3 lines by default)
      expect(diff).toContain('line 3') // context before
      expect(diff).toContain('-line 4')
      expect(diff).toContain('+line 4 modified')
      expect(diff).toContain('line 5') // context after
    })

    it('handles multiple changes in different sections', () => {
      const original = `line 1
line 2
line 3
line 4
line 5
line 6
line 7
line 8
line 9
line 10`

      const modified = `line 1
line 2 modified
line 3
line 4
line 5
line 6
line 7
line 8 modified
line 9
line 10`

      const diff = createUnifiedDiff(original, modified)

      expect(diff).toContain('-line 2')
      expect(diff).toContain('+line 2 modified')
      expect(diff).toContain('-line 8')
      expect(diff).toContain('+line 8 modified')
    })

    it('handles code with special characters', () => {
      const original = 'function test() { return "hello"; }'
      const modified = 'function test() { return "world"; }'

      const diff = createUnifiedDiff(original, modified)

      expect(diff).toContain('-function test() { return "hello"; }')
      expect(diff).toContain('+function test() { return "world"; }')
    })

    it('handles unicode characters', () => {
      const original = 'Hello 世界'
      const modified = 'Hello 🌍'

      const diff = createUnifiedDiff(original, modified)

      expect(diff).toContain('-Hello 世界')
      expect(diff).toContain('+Hello 🌍')
    })

    it('handles tabs and spaces', () => {
      const original = '\tindented with tab'
      const modified = '    indented with spaces'

      const diff = createUnifiedDiff(original, modified)

      expect(diff).toContain('-\tindented with tab')
      expect(diff).toContain('+    indented with spaces')
    })

    it('generates valid unified diff format', () => {
      const original = 'line 1\nline 2'
      const modified = 'line 1\nline 2 modified'

      const diff = createUnifiedDiff(original, modified, 'test.ts')

      // Check for standard unified diff markers
      expect(diff).toMatch(/---/) // original file marker
      expect(diff).toMatch(/\+\+\+/) // modified file marker
      expect(diff).toMatch(/@@ -\d+,\d+ \+\d+,\d+ @@/) // hunk header
    })

    it('handles Windows line endings', () => {
      const original = 'line 1\r\nline 2\r\n'
      const modified = 'line 1\r\nline 2 modified\r\n'

      const diff = createUnifiedDiff(original, modified)

      expect(diff).toBeTruthy()
      expect(diff).toContain('-line 2')
      expect(diff).toContain('+line 2 modified')
    })

    it('handles real code example', () => {
      const original = `function greet(name: string) {
  console.log("Hello " + name);
  return true;
}`

      const modified = `function greet(name: string) {
  console.log(\`Hello \${name}\`);
  return true;
}`

      const diff = createUnifiedDiff(original, modified, 'greet.ts')

      expect(diff).toContain('greet.ts')
      expect(diff).toContain('-  console.log("Hello " + name);')
      expect(diff).toContain('+  console.log(`Hello ${name}`);')
    })
  })
})
