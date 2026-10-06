<script lang="ts">
    import Field from './Field.svelte'
    import { fieldControl, type SelectOption } from './field'

    /**
     * A dropdown you search by typing, in the same 64px field box as TextInput: fills its
     * container, label centred until the field is active, then in the top-left corner with the
     * selection or the query below it.
     *
     *     <SearchSelect label="Country" options={countries} bind:value={country} />
     *
     * Active here means open *or* holding a selection.
     *
     * One <input> does both jobs, as a combobox rather than a text field with a list under it.
     * Closed it shows the selected option's label; open it shows what the user is typing and the
     * list filters down to the matches. Opening clears the query so the whole list is there to
     * browse - the selection is still marked, and is where the keyboard starts from.
     */
    /**
     * A per-instance id, so several of these on one page do not collide. Declared out here
     * because `$props.id()` is only allowed as a top-level variable initializer, not as a
     * default inside the destructuring below.
     */
    const uid = $props.id()

    let {
        value = $bindable(null),
        options,
        label,
        id = `search-select-${uid}`,
        disabled = false,
        invalid = false,
        hint,
        searchPlaceholder = 'Type to search',
        emptyText = 'No matches',
    }: {
        /** The selected option's `value`, or null for no selection. */
        value?: string | null
        options: SelectOption[]
        label: string
        /** Generated per instance; pass one only to point an outside <label> or test at it. */
        id?: string
        disabled?: boolean
        invalid?: boolean
        /** Helper line under the box; the error message when `invalid`. */
        hint?: string
        /** Shown in place of the value while the list is open and the query is empty. */
        searchPlaceholder?: string
        /** Shown in the list when nothing matches the query. */
        emptyText?: string
    } = $props()

    let open = $state(false)
    let focused = $state(false)
    let query = $state('')
    /** Index into `matches`, not into `options`. -1 means nothing is highlighted yet. */
    let activeIndex = $state(-1)
    let inputEl: HTMLInputElement | undefined = $state()
    let listEl: HTMLUListElement | undefined = $state()
    let rootEl: HTMLDivElement | undefined = $state()

    const listboxId = $derived(`${id}-listbox`)

    const selected = $derived(options.find((option) => option.value === value) ?? null)

    const matches = $derived.by(() => {
        const needle = query.trim().toLowerCase()
        if (needle === '') return options
        return options.filter((option) => option.label.toLowerCase().includes(needle))
    })

    const floated = $derived(focused || open || selected !== null)

    /**
     * Not `bind:value`: which string the input shows depends on the mode it is in, so it is driven
     * from state rather than driving it. `oninput` writes to `query`, and this writes back.
     */
    const shown = $derived(open ? query : (selected?.label ?? ''))

    /** Next selectable index, wrapping and stepping over disabled options. -1 if there are none. */
    function step(from: number, delta: number): number {
        const count = matches.length
        let index = from
        for (let i = 0; i < count; i++) {
            index = (index + delta + count) % count
            if (!matches[index].disabled) return index
        }
        return -1
    }

    function openList() {
        if (disabled || open) return
        open = true
        query = ''
        // `matches` is now the full list again, so the selection's index in it is its index in
        // `options` - but it is read through `matches` anyway, since that is what the keyboard
        // walks and `aria-activedescendant` names.
        activeIndex = matches.findIndex((option) => option.value === value)
    }

    function closeList() {
        open = false
        query = ''
        activeIndex = -1
    }

    function select(option: SelectOption) {
        if (option.disabled) return
        value = option.value
        closeList()
        inputEl?.focus()
    }

    function onkeydown(event: KeyboardEvent) {
        if (disabled) return

        switch (event.key) {
            case 'ArrowDown':
            case 'ArrowUp': {
                event.preventDefault()
                const delta = event.key === 'ArrowDown' ? 1 : -1
                if (!open) {
                    openList()
                    // From closed, down starts at the top and up at the bottom: step() wraps, so
                    // stepping back off index 0 lands on the last selectable option.
                    activeIndex = delta === 1 ? step(-1, 1) : step(0, -1)
                    return
                }
                activeIndex = step(activeIndex, delta)
                return
            }

            case 'Enter': {
                const option = open ? matches[activeIndex] : undefined
                if (!option) return
                // Only swallowed when it actually picks something, so Enter still submits the
                // surrounding form when the list is closed.
                event.preventDefault()
                select(option)
                return
            }

            case 'Escape':
                if (!open) return
                event.preventDefault()
                closeList()
                return

            case 'Home':
                if (!open) return
                event.preventDefault()
                activeIndex = step(-1, 1)
                return

            case 'End':
                if (!open) return
                event.preventDefault()
                activeIndex = step(0, -1)
                return

            case 'Tab':
                // Let focus leave; just do not leave the list hanging open behind it.
                closeList()
                return
        }
    }

    function oninput(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
        open = true
        query = event.currentTarget.value
        // Pre-highlight the top match so Enter picks it without an arrow key first.
        activeIndex = step(-1, 1)
    }

    /**
     * Closes on a click or a Tab that lands outside. A click on an option never gets here: the
     * option's pointerdown is prevented, so focus never leaves the input in the first place.
     */
    function onfocusout(event: FocusEvent) {
        if (rootEl?.contains(event.relatedTarget as Node | null)) return
        focused = false
        closeList()
    }

    // Keep the highlighted option in view while arrowing through a list longer than the popup.
    $effect(() => {
        if (!open || activeIndex < 0) return
        listEl
            ?.querySelector(`[data-index='${activeIndex}']`)
            ?.scrollIntoView({ block: 'nearest' })
    })
</script>

<div bind:this={rootEl} class="relative w-full" {onfocusout}>
    <Field {id} {label} {floated} {focused} {disabled} {invalid} {hint}>
        {#snippet control()}
            <input
                bind:this={inputEl}
                {id}
                {disabled}
                {onkeydown}
                {oninput}
                value={shown}
                class="{fieldControl} pr-12 pl-4"
                role="combobox"
                aria-expanded={open}
                aria-controls={open ? listboxId : undefined}
                aria-autocomplete="list"
                aria-activedescendant={open && activeIndex >= 0
                    ? `${id}-option-${activeIndex}`
                    : undefined}
                aria-invalid={invalid || undefined}
                aria-describedby={hint ? `${id}-hint` : undefined}
                autocomplete="off"
                spellcheck="false"
                placeholder={open ? searchPlaceholder : undefined}
                onfocus={() => {
                    focused = true
                    openList()
                }}
                onclick={openList}
            />
        {/snippet}

        {#snippet trailing()}
            <svg
                class="size-5 transition-transform duration-200 {open ? 'rotate-180' : ''}"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path d="M6 8l4 4 4-4" />
            </svg>
        {/snippet}
    </Field>

    <!--
        No `top`/`left`: an absolutely positioned box with auto offsets stays at its static
        position, which is directly below the field - and below the hint line too when there is
        one, which is where it belongs rather than on top of it.
    -->
    {#if open}
        <ul
            bind:this={listEl}
            id={listboxId}
            role="listbox"
            aria-label={label}
            class="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto overscroll-contain rounded-2xl border border-(--border) bg-(--surface-base) py-2 shadow-xl"
        >
            {#each matches as option, index (option.value)}
                <!--
                    The keyboard handler belongs on the input, not here: in a combobox the options
                    are never focused - the input keeps focus and names the highlighted option with
                    aria-activedescendant - so there is nothing for a key event on an <li> to fire
                    on, and making it a <button> would put every option in the tab order.
                -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <li
                    id="{id}-option-{index}"
                    role="option"
                    data-index={index}
                    aria-selected={option.value === value}
                    aria-disabled={option.disabled || undefined}
                    class="px-4 py-2.5 text-base/6
                        {option.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                        {index === activeIndex ? 'bg-(--surface-hover)' : ''}
                        {option.value === value ? 'font-medium text-(--accent-blue)' : 'text-(--text)'}"
                    onpointerdown={(event) => event.preventDefault()}
                    onclick={() => select(option)}
                    onpointerenter={() => {
                        if (!option.disabled) activeIndex = index
                    }}
                >
                    {option.label}
                </li>
            {:else}
                <!-- role="presentation" so it is not announced as a 0-of-0 option. -->
                <li role="presentation" class="px-4 py-2.5 text-base/6 text-(--text-secondary)">
                    {emptyText}
                </li>
            {/each}
        </ul>
    {/if}
</div>
