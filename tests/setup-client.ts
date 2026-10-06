/**
 * Adds jest-dom's DOM matchers (toBeInTheDocument, toHaveAttribute, ...) to Vitest's expect.
 * Cleanup between tests is registered by svelteTesting() in vitest.config.ts, not here.
 */
import '@testing-library/jest-dom/vitest'

/**
 * jsdom implements no layout, so it ships no Element.scrollIntoView at all - calling it throws
 * rather than doing nothing. Anything that keeps a highlighted item in view (SearchSelect's
 * listbox) would take the whole test down with it, so it is stubbed here rather than guarded at
 * every call site. There is nothing to assert about it in jsdom either way.
 */
Element.prototype.scrollIntoView ??= () => {}
