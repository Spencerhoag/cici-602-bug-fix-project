import axe from 'axe-core'
import type { RunOptions, AxeResults } from 'axe-core'

/**
 * Helper function to run axe accessibility tests on a DOM element
 * @param container - The DOM container to test
 * @param options - Optional axe configuration
 */
export async function runAxe(
  container: Element,
  options?: RunOptions
): Promise<AxeResults> {
  const results = await axe.run(container, options)
  return results
}

/**
 * Assert that there are no accessibility violations
 */
export function expectNoA11yViolations(results: AxeResults) {
  if (results.violations.length > 0) {
    const violationMessages = results.violations.map((violation) => {
      return `${violation.id}: ${violation.description}\n` +
        violation.nodes.map((node) =>
          `  - ${node.html}\n    ${node.failureSummary}`
        ).join('\n')
    }).join('\n\n')

    throw new Error(`Accessibility violations found:\n\n${violationMessages}`)
  }
}
