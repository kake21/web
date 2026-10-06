<script lang="ts">
    import type { HTMLInputAttributes } from 'svelte/elements'
    import Field from './Field.svelte'
    import { fieldControl } from './field'

    /**
     * A single-line text input in the shared 64px field box: fills its container, label centred
     * until the field is active, then tucked into the top-left corner with the value below it.
     *
     *     <TextInput label="Full name" bind:value={name} />
     *
     * Active here means focused *or* holding a value - the label cannot drop back over a value the
     * user has typed, so a filled field keeps its label floated after blur.
     *
     * The value stays left-aligned in both states. Only the label is centred: centring the value
     * too would make it jump sideways on every focus, and would truncate from both ends at once.
     */
    /**
     * A per-instance id, so several of these on one page do not collide. Declared out here
     * because `$props.id()` is only allowed as a top-level variable initializer, not as a
     * default inside the destructuring below.
     */
    const uid = $props.id()

    let {
        value = $bindable(''),
        label,
        id = `text-input-${uid}`,
        disabled = false,
        invalid = false,
        hint,
        ...rest
    }: {
        value?: string
        label: string
        /** Generated per instance; pass one only to point an outside <label> or test at it. */
        id?: string
        disabled?: boolean
        invalid?: boolean
        /** Helper line under the box; the error message when `invalid`. */
        hint?: string
        /** Anything else an <input> takes - type, name, autocomplete, inputmode, maxlength, ... */
    } & Omit<HTMLInputAttributes, 'value' | 'id' | 'disabled' | 'class'> = $props()

    let focused = $state(false)

    const floated = $derived(focused || value !== '')
</script>

<Field {id} {label} {floated} {focused} {disabled} {invalid} {hint}>
    {#snippet control()}
        <!--
            `{...rest}` goes first so the attributes below win over it, and focus is then composed
            rather than replaced: the float depends on knowing about focus, so a caller passing
            onfocus/onblur has to be chained to instead of allowed to clobber it.
        -->
        <input
            {...rest}
            {id}
            {disabled}
            bind:value
            class="{fieldControl} pr-4 pl-4"
            aria-invalid={invalid || undefined}
            aria-describedby={hint ? `${id}-hint` : undefined}
            onfocus={(event) => {
                focused = true
                rest.onfocus?.(event)
            }}
            onblur={(event) => {
                focused = false
                rest.onblur?.(event)
            }}
        />
    {/snippet}
</Field>
