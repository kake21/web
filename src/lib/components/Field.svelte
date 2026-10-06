<script lang="ts">
    import type { Snippet } from 'svelte'

    /**
     * The chrome every field in this set shares: a box 64px tall that fills the width of its
     * container, and a label that rests centred in the middle of it and flies to the top-left
     * corner once the field is active.
     *
     * Field renders the box, the label and an optional trailing icon. The control itself comes in
     * through the `control` snippet - see ./field for why it is the caller that positions it.
     *
     * "Active" is the caller's call, because the two fields disagree about what it means: a text
     * input is active while focused or holding a value, a select while open or holding a
     * selection. Field only takes the answer as `floated`.
     */
    let {
        id,
        label,
        floated,
        focused,
        disabled = false,
        invalid = false,
        hint,
        control,
        trailing,
    }: {
        /** Ties the <label> to the control; also the stem of the hint's id. */
        id: string
        label: string
        /** Label up in the corner (true) or centred at rest (false). */
        floated: boolean
        /** Draws the focus border and ring. */
        focused: boolean
        disabled?: boolean
        /** Recolours the border, ring, label and hint to --danger. */
        invalid?: boolean
        /** Helper line under the box. Carries the error message when `invalid`. */
        hint?: string
        control: Snippet
        trailing?: Snippet
    } = $props()

    const tone = $derived.by(() => {
        if (disabled) return 'border-(--border) bg-(--surface-raised) opacity-60'
        if (invalid) return 'border-(--danger) bg-(--surface-raised)'
        if (focused) return 'border-(--accent-blue) bg-(--surface-hover)'
        return 'border-(--border) bg-(--surface-raised) hover:bg-(--surface-hover)'
    })

    const labelTone = $derived(
        invalid
            ? 'text-(--danger)'
            : focused
              ? 'text-(--accent-blue)'
              : 'text-(--text-secondary)',
    )
</script>

<div class="w-full">
    <!--
        data-* rather than a class for the two states: these drive the <style> block below and are
        what the tests assert on, so neither can be broken by rewriting a Tailwind class.
    -->
    <div
        class="shell relative h-14 w-full rounded-lg border transition-[background-color,border-color,box-shadow] duration-150 {tone}"
        data-focused={focused}
        data-invalid={invalid}
    >
        <label
            for={id}
            class="label pointer-events-none absolute max-w-[calc(100%-2rem)] overflow-hidden text-base/6 font-medium text-ellipsis whitespace-nowrap select-none {labelTone}"
            data-floated={floated}
        >
            {label}
        </label>

        {@render control()}

        {#if trailing}
            <div
                class="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-(--text-secondary)"
            >
                {@render trailing()}
            </div>
        {/if}
    </div>

    {#if hint}
        <p id="{id}-hint" class="mt-1.5 px-4 text-xs {invalid ? 'text-(--danger)' : 'text-(--text-secondary)'}">
            {hint}
        </p>
    {/if}
</div>

<style>
    /*
     * The label's two positions, and the move between them.
     *
     * The horizontal half is the part worth explaining. Sliding text from centred to left-aligned
     * cannot be done with `text-align`, `justify-content` or `width: max-content`, because none of
     * those interpolate - the label would snap sideways while sliding up. So the label is sized to
     * its own text with `width: max-content` and centred the one way that is made of animatable
     * properties: its left edge is pinned to the middle of the box and then pulled back by half
     * its own width.
     *
     * Floating it is then just `left: 50% -> 1rem` and `translateX(-50% -> 0)`. `left` interpolates
     * between a percentage and a length as a calc(), and both transforms are written with the same
     * function list in the same order so the transition interpolates them component-wise instead
     * of falling back to matrix decomposition.
     *
     * The size change is `scale(0.75)` rather than `font-size: 0.75rem` - same 12px result, but on
     * the compositor, and already part of the transform that is animating anyway.
     */
    .label {
        /*
       50  * Explicit, not the shrink-to-fit an absolutely positioned box gets on its own: with
         * `left: 50%` and no `right`, the available width is only half the box, so shrink-to-fit
         * would cap a long label at 50% and wrap it. max-content ignores the available width;
         * the max-width in the markup is what clamps it, and nowrap + overflow then ellipsise it.
         */
        width: max-content;
        top: 50%;
        left: 1rem;
        transform: translate(-0%, -50%) scale(1);
        transform-origin: left top;
        transition:
            top 200ms ease,
            left 200ms ease,
            transform 200ms ease,
            color 150ms ease;
    }

    .label[data-floated='true'] {
        top: 0.425rem;
        left: 1rem;
        transform: translate(0, 0) scale(0.75);
    }

    /*
     * The focus ring. A box-shadow rather than Tailwind's `ring-*` so the colour can be mixed down
     * from the accent token with color-mix, the way app.css mixes the page gradient.
     */
    .shell[data-focused='true'] {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-blue) 25%, transparent);
    }

    .shell[data-focused='true'][data-invalid='true'] {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger) 25%, transparent);
    }
</style>
