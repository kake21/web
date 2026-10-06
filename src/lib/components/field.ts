/**
 * Pieces shared by every field in this set.
 *
 * `Field.svelte` owns the box and the floating label, but deliberately does not own the control
 * inside it: the caller passes its own <input> in through a snippet. A snippet is compiled in the
 * *caller's* style scope, so Svelte's scoped CSS inside Field can never reach it - which is why
 * the control's geometry lives here, as a class string both callers apply, rather than as a rule
 * in Field's <style> block.
 */

/**
 * Fills the field box and reserves the top strip for the floated label.
 *
 * `pt-6` (24px) pushes the single line of text into the lower 40px of the 64px box; a single-line
 * <input> centres its text in its own content box, so the value lands around y=42 while the
 * floated label sits at y=10-25. No vertical centring is needed on the caller's side.
 *
 * Horizontal padding is left out on purpose. `pl-*`/`pr-*` are set by the caller instead of being
 * overridden on top of a `px-*` in here: Tailwind resolves a `px-4` vs `pr-12` conflict by CSS
 * source order, not by the order the classes appear in the attribute, so an override would be a
 * coin toss. TextInput uses `pl-4 pr-4`; a field with a trailing icon uses `pl-4 pr-12`.
 */
export const fieldControl =
    'absolute inset-0 h-full w-full appearance-none rounded-2xl bg-transparent pt-6 pb-1' +
    ' text-base/6 text-(--text) outline-none disabled:cursor-not-allowed'

/** One choice in a `SearchSelect`. */
export type SelectOption = {
    /** Stable identity, and what `SearchSelect`'s `value` binds to. */
    value: string
    /** What the user reads, and what the search filters against. */
    label: string
    /** Rendered dimmed, skipped by the keyboard and not selectable. */
    disabled?: boolean
}
