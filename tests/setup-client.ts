/**
 * Adds jest-dom's DOM matchers (toBeInTheDocument, toHaveAttribute, ...) to Vitest's expect.
 * Cleanup between tests is registered by svelteTesting() in vitest.config.ts, not here.
 */
import '@testing-library/jest-dom/vitest'

/**
 * jsdom implements no layout, so it ships no Element.scrollIntoView at all - calling it throws
 * rather than doing nothing. Anything that keeps a highlighted item in view (SearchSelect's
 * listbox) would take the whole test down with it, so it is stubbed here rather than guarded at
 * every call site. There is nothing to assert about it in jsdom either way.
 */
Element.prototype.scrollIntoView ??= () => {}

/**
 * jsdom implements <dialog> as an element but not as a dialog: it parses the tag, applies the UA
 * rule that hides it without `open`, and stops there - showModal(), close() and the `cancel` and
 * `close` events are all absent, so Modal.svelte would throw on open.
 *
 * What is filled in here is only the state machine, which is what the component actually talks
 * to. The parts worth having a <dialog> for - the top layer, the inert page behind it, the
 * backdrop, returning focus to the opener - are the browser's, and are not simulated. Those are
 * not what a jsdom test could check anyway; a test here asserts that the component opens, closes
 * and reports it, not that the platform works.
 */
if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal() {
        if (this.open) throw new DOMException('dialog is already open', 'InvalidStateError')
        this.setAttribute('open', '')
        // The browser moves focus into the dialog on open, honouring [autofocus] if there is one.
        const target = this.querySelector<HTMLElement>('[autofocus]') ?? this
        target.focus()
    }

    HTMLDialogElement.prototype.close = function close(returnValue?: string) {
        if (!this.open) return
        if (returnValue !== undefined) this.returnValue = returnValue
        this.removeAttribute('open')
        this.dispatchEvent(new Event('close'))
    }

    /*
     * Escape, as the browser does it: a cancelable `cancel` event first, and the close only if
     * nothing called preventDefault on it. Bound at the document because the real close request
     * does not depend on where focus is inside the dialog.
     */
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return
        const dialog = document.querySelector<HTMLDialogElement>('dialog[open]')
        if (!dialog) return
        if (dialog.dispatchEvent(new Event('cancel', { cancelable: true }))) dialog.close()
    })
}
