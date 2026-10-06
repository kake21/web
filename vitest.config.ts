import { svelteTesting } from '@testing-library/svelte/vite'
import { defineConfig } from 'vitest/config'

/**
 * Test configuration, deliberately separate from vite.config.ts so the build config stays about
 * the build. Vitest prefers this file when both exist; `vite build` never reads it.
 *
 * Two projects rather than one, because the two kinds of test need opposite module resolution.
 * A component test has to get Svelte's *client* build - the one that mounts into a DOM - which
 * only the 'browser' export condition selects. A helper test wants plain Node. Running both as
 * one project would force one of the two to lie about where it thinks it is.
 *
 * Both extend vite.config.ts, which is what supplies the `@/lib` and `$lib` aliases: those come
 * from the sveltekit() plugin and svelte.config.js, not from tsconfig.
 */
export default defineConfig({
    test: {
        projects: [
            {
                extends: './vite.config.ts',
                plugins: [
                    // Puts 'browser' ahead of 'node' in resolve.conditions and registers DOM
                    // cleanup between tests.
                    svelteTesting(),
                ],
                test: {
                    name: 'client',
                    environment: 'jsdom',
                    // Anything that mounts a component is named *.svelte.test.ts. That suffix is a
                    // routing signal for this glob, not Svelte 5's .svelte.ts rune-module
                    // extension - these files end in .test.ts, so the compiler leaves them alone.
                    include: ['src/**/*.svelte.test.ts'],
                    setupFiles: ['./tests/setup-client.ts'],
                    clearMocks: true,
                    // Transforming the component graph dominates this project's runtime; caching
                    // it makes a rerun a fraction of a cold run.
                    fsModuleCache: true,
                },
                resolve: {
                    // svelteTesting() only inserts 'browser' when 'node' is already listed, so the
                    // condition is set here too rather than relying on it.
                    conditions: ['browser'],
                },
            },
            {
                extends: './vite.config.ts',
                test: {
                    name: 'unit',
                    environment: 'node',
                    include: ['src/**/*.test.ts'],
                    exclude: ['src/**/*.svelte.test.ts'],
                    // No pure helpers exist yet; this keeps `npm test` honest about what it
                    // found rather than failing on an empty glob. Drop it once there are some.
                    passWithNoTests: true,
                    fsModuleCache: true,
                },
            },
        ],
    },
})
