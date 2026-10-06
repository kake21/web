import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import SearchSelect from './SearchSelect.svelte'
import type { SelectOption } from './field'

const options: SelectOption[] = [
    { value: 'no', label: 'Norway' },
    { value: 'se', label: 'Sweden' },
    { value: 'dk', label: 'Denmark' },
    { value: 'is', label: 'Iceland', disabled: true },
]

describe('SearchSelect', () => {
    const open = async () => {
        const user = userEvent.setup()
        render(SearchSelect, { label: 'Country', options })
        const input = screen.getByRole('combobox', { name: 'Country' })
        await user.click(input)
        return { user, input }
    }

    it('names the combobox with its label and starts closed', () => {
        render(SearchSelect, { label: 'Country', options })

        const input = screen.getByRole('combobox', { name: 'Country' })
        expect(input).toHaveAttribute('aria-expanded', 'false')
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
        expect(screen.getByText('Country')).toHaveAttribute('data-floated', 'false')
    })

    it('opens the full list on focus and floats the label', async () => {
        const { input } = await open()

        expect(input).toHaveAttribute('aria-expanded', 'true')
        expect(screen.getByRole('listbox')).toBeInTheDocument()
        expect(screen.getAllByRole('option')).toHaveLength(options.length)
        expect(screen.getByText('Country')).toHaveAttribute('data-floated', 'true')
    })

    it('filters the list as you type, case-insensitively', async () => {
        const { user, input } = await open()

        // Upper case, and a substring that is not a prefix - "Denmark" matches on both counts
        // while "Sweden" (which does contain "den") does not.
        await user.type(input, 'MARK')

        expect(screen.getAllByRole('option').map((o) => o.textContent?.trim())).toEqual([
            'Denmark',
        ])
    })

    it('reports an empty result rather than an empty list', async () => {
        const { user, input } = await open()

        await user.type(input, 'zzz')

        expect(screen.queryAllByRole('option')).toHaveLength(0)
        expect(screen.getByText('No matches')).toBeInTheDocument()
    })

    it('selects on click, closes, and shows the chosen label', async () => {
        const { user, input } = await open()

        await user.click(screen.getByRole('option', { name: 'Sweden' }))

        expect(input).toHaveValue('Sweden')
        expect(input).toHaveAttribute('aria-expanded', 'false')
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('selects with the arrow keys and Enter, skipping disabled options', async () => {
        const { user, input } = await open()

        // Up from closed-then-opened wraps to the bottom, which is the disabled Iceland - so it
        // should land on Denmark instead.
        await user.keyboard('{ArrowUp}')
        await user.keyboard('{Enter}')

        expect(input).toHaveValue('Denmark')
    })

    it('pre-highlights the top match so Enter picks it', async () => {
        const { user, input } = await open()

        await user.type(input, 'nor')
        await user.keyboard('{Enter}')

        expect(input).toHaveValue('Norway')
    })

    it('points aria-activedescendant at the highlighted option', async () => {
        const { user, input } = await open()

        await user.keyboard('{ArrowDown}')

        const active = input.getAttribute('aria-activedescendant')
        expect(active).toBeTruthy()
        expect(screen.getByRole('option', { name: 'Norway' })).toHaveAttribute('id', active)
    })

    it('will not select a disabled option', async () => {
        const { user, input } = await open()

        await user.click(screen.getByRole('option', { name: 'Iceland' }))

        expect(input).toHaveValue('')
        expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    it('closes on Escape without selecting', async () => {
        const { user, input } = await open()

        await user.keyboard('{ArrowDown}{Escape}')

        expect(input).toHaveAttribute('aria-expanded', 'false')
        expect(input).toHaveValue('')
    })

    it('shows the selection when given a value up front', () => {
        render(SearchSelect, { label: 'Country', options, value: 'dk' })

        expect(screen.getByRole('combobox', { name: 'Country' })).toHaveValue('Denmark')
        expect(screen.getByText('Country')).toHaveAttribute('data-floated', 'true')
    })

    it('reopens on the full list, with the selection marked', async () => {
        const user = userEvent.setup()
        render(SearchSelect, { label: 'Country', options, value: 'dk' })

        await user.click(screen.getByRole('combobox', { name: 'Country' }))

        expect(screen.getAllByRole('option')).toHaveLength(options.length)
        expect(screen.getByRole('option', { name: 'Denmark' })).toHaveAttribute(
            'aria-selected',
            'true',
        )
    })
})
