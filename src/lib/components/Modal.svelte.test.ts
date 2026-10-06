import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { createRawSnippet } from 'svelte'
import { describe, expect, it, vi } from 'vitest'
import Modal from './Modal.svelte'

/**
 * Assertions go through roles and accessible names, as in the other component tests.
 *
 * `queryByRole('dialog')` is the check for "closed" rather than looking for the element: the
 * <dialog> is always in the document, and what closing does is take it out of the accessibility
 * tree - which is exactly the distinction a role query makes. See tests/setup-client.ts for how
 * much of <dialog> jsdom actually provides.
 */
describe('Modal', () => {
    /** The caller's content. Required, so every render needs one. */
    const body = (text: string) =>
        createRawSnippet(() => ({ render: () => `<p>${text}</p>` }))

    const props = (overrides: Record<string, unknown> = {}) => ({
        title: 'Delete this item?',
        children: body('The item will be removed.'),
        ...overrides,
    })

    it('stays out of the accessibility tree while closed', () => {
        render(Modal, props())
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(screen.queryByText('The item will be removed.')).not.toBeVisible()
    })

    it('opens named by its title, and describes itself with the description', () => {
        render(Modal, props({ open: true, description: 'This cannot be undone.' }))

        const dialog = screen.getByRole('dialog', { name: 'Delete this item?' })
        expect(dialog).toHaveAccessibleDescription('This cannot be undone.')
        expect(screen.getByText('The item will be removed.')).toBeVisible()
    })

    it('opens when the prop flips', async () => {
        const { rerender } = render(Modal, props())
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

        await rerender(props({ open: true }))
        expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('closes on the ✕ button and reports it', async () => {
        const user = userEvent.setup()
        const onclose = vi.fn()
        render(Modal, props({ open: true, onclose }))

        await user.click(screen.getByRole('button', { name: 'Close' }))

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(onclose).toHaveBeenCalledOnce()
    })

    it('closes on Escape', async () => {
        const user = userEvent.setup()
        const onclose = vi.fn()
        render(Modal, props({ open: true, onclose }))

        await user.keyboard('{Escape}')

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(onclose).toHaveBeenCalledOnce()
    })

    it('closes on a click outside the panel, but not on one inside it', async () => {
        const user = userEvent.setup()
        render(Modal, props({ open: true }))

        // Inside first: a click that lands on the content must not be mistaken for the backdrop.
        await user.click(screen.getByText('The item will be removed.'))
        expect(screen.getByRole('dialog')).toBeInTheDocument()

        // The backdrop is the dialog element's own ::backdrop, so a click on it targets the
        // dialog - which is what the component keys on.
        await user.click(screen.getByRole('dialog'))
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('refuses to be dismissed when it is not dismissible', async () => {
        const user = userEvent.setup()
        render(Modal, props({ open: true, dismissible: false }))

        expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()

        await user.keyboard('{Escape}')
        await user.click(screen.getByRole('dialog'))

        expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('renders the footer actions', async () => {
        const user = userEvent.setup()
        const onclose = vi.fn()
        render(
            Modal,
            props({
                open: true,
                onclose,
                footer: createRawSnippet(() => ({
                    render: () => '<button type="button">Cancel</button>',
                })),
            }),
        )

        const cancel = screen.getByRole('button', { name: 'Cancel' })
        expect(cancel).toBeVisible()

        // The footer's buttons are the caller's, so this one does not close anything by itself.
        await user.click(cancel)
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(onclose).not.toHaveBeenCalled()
    })

    it('names the close button with closeLabel', () => {
        render(Modal, props({ open: true, closeLabel: 'Lukk' }))
        expect(screen.getByRole('button', { name: 'Lukk' })).toBeInTheDocument()
    })

    it('locks the page behind it from scrolling while open', async () => {
        const { rerender } = render(Modal, props({ open: true }))
        expect(document.body.style.overflow).toBe('hidden')

        await rerender(props({ open: false }))
        expect(document.body.style.overflow).toBe('')
    })
})
