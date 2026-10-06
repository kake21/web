import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import TextInput from './TextInput.svelte'

// Assertions go through roles and accessible names, as in Hero.svelte.test.ts, with one
// exception: where the label sits is the whole point of the component, and that is carried by
// `data-floated` rather than by a Tailwind class precisely so a test can pin it without pinning
// the styling.
describe('TextInput', () => {
    const floatedState = (label: string) => screen.getByText(label).getAttribute('data-floated')

    it('names the input with its label', () => {
        render(TextInput, { label: 'Full name' })
        expect(screen.getByRole('textbox', { name: 'Full name' })).toBeInTheDocument()
    })

    it('rests with the label centred and floats it on focus', async () => {
        const user = userEvent.setup()
        render(TextInput, { label: 'Full name' })

        expect(floatedState('Full name')).toBe('false')

        await user.click(screen.getByRole('textbox'))
        expect(floatedState('Full name')).toBe('true')
    })

    it('drops the label back to centre on blur while empty', async () => {
        const user = userEvent.setup()
        render(TextInput, { label: 'Full name' })

        await user.click(screen.getByRole('textbox'))
        await user.tab()

        expect(floatedState('Full name')).toBe('false')
    })

    it('keeps the label floated on blur once there is a value', async () => {
        const user = userEvent.setup()
        render(TextInput, { label: 'Full name' })

        await user.type(screen.getByRole('textbox'), 'Vegard')
        await user.tab()

        expect(screen.getByRole('textbox')).toHaveValue('Vegard')
        expect(floatedState('Full name')).toBe('true')
    })

    it('starts floated when given a value up front', () => {
        render(TextInput, { label: 'Full name', value: 'Vegard' })
        expect(floatedState('Full name')).toBe('true')
    })

    it('describes the input with its hint, and marks an invalid one', () => {
        render(TextInput, { label: 'Email', hint: 'Not an email address', invalid: true })

        const input = screen.getByRole('textbox', { name: 'Email' })
        expect(input).toHaveAttribute('aria-invalid', 'true')
        expect(input).toHaveAccessibleDescription('Not an email address')
    })

    it('passes native input attributes through', () => {
        render(TextInput, { label: 'Email', type: 'email', name: 'email', maxlength: 80 })

        const input = screen.getByRole('textbox', { name: 'Email' })
        expect(input).toHaveAttribute('type', 'email')
        expect(input).toHaveAttribute('name', 'email')
        expect(input).toHaveAttribute('maxlength', '80')
    })
})
