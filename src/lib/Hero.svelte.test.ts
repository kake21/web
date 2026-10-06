import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import Hero from './Hero.svelte'

// A smoke test, and a template for the rest: assertions go through roles and accessible names, so
// a Tailwind class can be rewritten without breaking a test, while a change that breaks the
// accessibility tree does break one.
//
// Note where this lives. Tests cannot sit next to a route: SvelteKit reserves the `+` prefix in
// src/routes, so `+page.svelte.test.ts` is rejected by `svelte-kit sync`. Components that want
// testing belong in src/lib, with the route left as composition.
describe('Hero', () => {
    it('renders the name as the page heading', () => {
        render(Hero, { name: 'Vegard Bauge', tagline: 'Anything' })
        expect(screen.getByRole('heading', { name: 'Vegard Bauge' })).toBeInTheDocument()
    })

    it('renders the tagline', () => {
        render(Hero, { name: 'Vegard Bauge', tagline: 'Builds things.' })
        expect(screen.getByText('Builds things.')).toBeInTheDocument()
    })
})
