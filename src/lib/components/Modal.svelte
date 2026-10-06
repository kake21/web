<script lang="ts">
    import type { Snippet } from 'svelte'

    /**
     * A modal popup: a titled panel centred over a dimmed page, with the rest of the page inert
     * behind it.
     *
     *     <button onclick={() => open = true}>Delete</button>
     *
     *     <Modal bind:open title="Delete this item?" description="This cannot be undone.">
     *         <p>The item and everything attached to it will be removed.</p>
     *
     *         {#snippet footer()}
     *             <button onclick={() => (open = false)}>Cancel</button>
     *             <button onclick={remove}>Delete</button>
     *         {/snippet}
     *     </Modal>
     *
     * Built on a native <dialog> opened with showModal(), which is doing a lot of work that is
     * tedious and easy to get subtly wrong by hand:
     *
     *   - The dialog goes in the *top layer*, above every stacking context on the page. No z-index
     *     to pick, and no `overflow: hidden` on some ancestor that clips it.
     *   - Everything outside it becomes inert: not clickable, not focusable, not reachable by Tab.
     *     That is a real focus trap rather than a wrap-around Tab handler that a screen reader's
     *     own navigation walks straight out of.
     *   - Escape fires a `cancel` event, and closing returns focus to whatever opened it.
     *   - aria-modal is implied, so it is not set here.
     *
     * The panel is a child of the <dialog> rather than the <dialog> itself, so the dialog's own box
     * is exactly the panel and carries no padding. That is what makes the backdrop click below
     * safe to detect: the only clicks that can land on the dialog element are the ones outside the
     * panel.
     */
    /**
     * A per-instance id, so several of these on one page do not collide. Declared out here
     * because `$props.id()` is only allowed as a top-level variable initializer, not as a
     * default inside the destructuring below.
     */
    const uid = $props.id()

    let {
        open = $bindable(false),
        title,
        description,
        id = `modal-${uid}`,
        size = 'md',
        dismissible = true,
        closeLabel = 'Close',
        onclose,
        children,
        footer,
    }: {
        /** Two-way: set it to open the popup, and it is set back to false however it closes. */
        open?: boolean
        /** The popup's accessible name, shown as its heading. */
        title: string
        /** Optional line under the heading; also becomes the dialog's accessible description. */
        description?: string
        /** Generated per instance; pass one only to point an outside element or a test at it. */
        id?: string
        /** Panel width cap: 24rem, 32rem or 48rem. It is always narrower than the viewport. */
        size?: 'sm' | 'md' | 'lg'
        /**
         * Whether the user may close it themselves - Escape, a backdrop click, and the ✕ button
         * all come from this one flag. Set it false for something that must be answered, and
         * then give the footer a button that closes it.
         */
        dismissible?: boolean
        /** Accessible name of the ✕ button. */
        closeLabel?: string
        /** Called after it has closed, however it closed. */
        onclose?: () => void
        children: Snippet
        /** The actions row along the bottom. Laid out end-aligned; the buttons are the caller's. */
        footer?: Snippet
    } = $props()

    let dialogEl: HTMLDialogElement | undefined = $state()
    let panelEl: HTMLDivElement | undefined = $state()

    const maxWidth = $derived({ sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' }[size])

    /**
     * Drives the element from the prop. showModal()/close() cannot be expressed as attributes -
     * setting `open=""` by hand opens a *non-modal* dialog, with no top layer, no backdrop and no
     * inert page - so the element is told, rather than bound.
     *
     * Guarded both ways on `dialogEl.open` so a re-run for some other reason is a no-op; calling
     * showModal() on an already-open dialog throws.
     */
    $effect(() => {
        const el = dialogEl
        if (!el) return

        if (open && !el.open) {
            el.showModal()
            // showModal() puts focus on the first focusable thing in the dialog, which would be
            // the ✕ button - so a screen reader starts at "Close" rather than at the title.
            // Moving it to the panel means the title is the first thing read. An `autofocus`
            // inside the caller's content wins, because showModal() already honoured it.
            if (!el.querySelector('[autofocus]')) panelEl?.focus()
        } else if (!open && el.open) {
            el.close()
        }
    })

    /*
     * Keeps the page behind from scrolling under the popup. The top layer makes the background
     * inert to clicks and to the keyboard, but not to the wheel.
     *
     * This locks the document scroller, which is the right default and the only one a component
     * can pick on its own. An app that scrolls an inner element instead (this one's layout does)
     * has to lock that element itself - there is no way from in here to know which one it is.
     */
    $effect(() => {
        if (!open) return
        const previous = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = previous
        }
    })

    /**
     * Escape. The browser fires `cancel` before closing, so refusing it is a preventDefault rather
     * than a key handler - which also covers the other close requests a platform may have.
     */
    function oncancel(event: Event) {
        if (!dismissible) event.preventDefault()
    }

    /** Fires however it closed - Escape, the ✕, a backdrop click, or `open = false`. */
    function onCloseEvent() {
        open = false
        onclose?.()
    }

    /**
     * A click on the backdrop. The backdrop is the dialog's own ::backdrop pseudo-element, so such
     * a click arrives here with the dialog element itself as the target; anything inside the panel
     * targets the panel or its contents. The dialog has no padding of its own, so there is no
     * strip of dialog around the panel that would read as "outside".
     */
    function onclick(event: MouseEvent) {
        if (dismissible && event.target === dialogEl) dialogEl?.close()
    }
</script>

<!--
    Always rendered, not wrapped in {#if open}: the open and closed states have to be the same
    element for the transitions below to have something to transition between. A closed <dialog>
    is `display: none` from the UA stylesheet, so its contents are out of the accessibility tree
    and out of the tab order regardless.

    `m-auto` puts back the centring that Tailwind takes away. A modal <dialog> is centred by the
    UA stylesheet with `position: fixed; inset: 0; margin: auto`, and preflight's
    `*, ::backdrop { margin: 0 }` is an author rule, so it beats the UA's margin whatever the
    specificity - without it the popup sits in the top-left corner. `p-0` is the deliberate half
    of the same reset: see the backdrop click above for why the dialog carries no padding.
-->
<dialog
    bind:this={dialogEl}
    {id}
    {oncancel}
    {onclick}
    onclose={onCloseEvent}
    aria-labelledby="{id}-title"
    aria-describedby={description ? `${id}-desc` : undefined}

    class="m-auto w-[calc(100vw-2rem)] {maxWidth} max-h-[calc(100dvh-4rem)] rounded-2xl border border-(--border) bg-(--surface-base) p-0 text-(--text) shadow-2xl"
>
    <!--
        tabindex="-1" so the effect above can move focus here; it is not a tab stop. The whole
        panel is a flex column and the body is the only part that scrolls, which keeps the title
        and the actions in place while long content moves.
    -->
    <div bind:this={panelEl} tabindex="-1" class="flex max-h-[inherit] flex-col outline-none">
        <header class="flex items-start gap-4 px-6 pt-5 pb-4">
            <div class="min-w-0 flex-1">
                <h2 id="{id}-title" class="text-lg/6 font-medium text-(--text)">{title}</h2>
                {#if description}
                    <p id="{id}-desc" class="mt-1.5 text-sm text-(--text-secondary)">
                        {description}
                    </p>
                {/if}
            </div>

            {#if dismissible}
                <button
                    type="button"
                    aria-label={closeLabel}
                    onclick={() => dialogEl?.close()}
                    class="-mr-2 -mt-1 grid size-9 shrink-0 place-items-center rounded-lg text-(--text-secondary) transition-colors duration-150 hover:bg-(--surface-hover) hover:text-(--text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent-blue)"
                >
                    <svg
                        class="size-5"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.75"
                        stroke-linecap="round"
                        aria-hidden="true"
                    >
                        <path d="M5 5l10 10M15 5L5 15" />
                    </svg>
                </button>
            {/if}
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto px-6 pb-6 text-base/6">
            {@render children()}
        </div>

        {#if footer}
            <footer
                class="flex flex-wrap justify-end gap-2 border-t border-(--border) px-6 py-4"
            >
                {@render footer()}
            </footer>
        {/if}
    </div>
</dialog>

<style>
    /*
     * Open and close animations on an element that is `display: none` when closed.
     *
     * Two things make that work, and both are needed. `display` is listed as a transitioned
     * property with `allow-discrete`, which holds the element at `display: block` for the length
     * of the close transition instead of yanking it the instant the attribute goes; `overlay` is
     * the same trick for the top layer, which the element would otherwise leave immediately and
     * so finish its fade out *behind* the rest of the page. `overlay` only ever animates with
     * allow-discrete, and is not settable from script - it is the UA's own property for top-layer
     * membership.
     *
     * @starting-style is the other half: it supplies the values to start the *open* transition
     * from. Without it the element simply appears at its open state, because there is no previous
     * style to interpolate from on an element that was display:none a frame ago.
     *
     * Both halves degrade cleanly - a browser that supports neither just shows and hides the
     * popup - and app.css's prefers-reduced-motion rule cuts the durations.
     */
    dialog {
        opacity: 0;
        transform: translateY(0.5rem) scale(0.98);
        transition:
            opacity 150ms ease,
            transform 150ms ease,
            display 150ms allow-discrete,
            overlay 150ms allow-discrete;
    }

    dialog[open] {
        opacity: 1;
        transform: translateY(0) scale(1);
    }

    @starting-style {
        dialog[open] {
            opacity: 0;
            transform: translateY(0.5rem) scale(0.98);
        }
    }

    /*
     * The dim behind it, and the one place here that does not go through a token: ::backdrop only
     * started inheriting from its originating element recently, so in a browser a version behind,
     * var(--bg) resolves to nothing and the scrim vanishes altogether. A missing scrim is a worse
     * failure than a hard-coded one - and a scrim is a wash over the page rather than a surface,
     * so it is dark in both themes regardless.
     */
    dialog::backdrop {
        background: rgb(9 16 23 / 0.5);
        backdrop-filter: blur(2px);
        opacity: 0;
        transition:
            opacity 150ms ease,
            display 150ms allow-discrete,
            overlay 150ms allow-discrete;
    }

    @media (prefers-color-scheme: dark) {
        dialog::backdrop {
            background: rgb(2 8 13 / 0.6);
        }
    }

    dialog[open]::backdrop {
        opacity: 1;
    }

    @starting-style {
        dialog[open]::backdrop {
            opacity: 0;
        }
    }
</style>
