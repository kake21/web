/**
 * Adds jest-dom's DOM matchers (toBeInTheDocument, toHaveAttribute, ...) to Vitest's expect.
 * Cleanup between tests is registered by svelteTesting() in vitest.config.ts, not here.
 */
import '@testing-library/jest-dom/vitest'
