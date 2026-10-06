<script lang="ts">
    import Hero from '$lib/Hero.svelte'
    import { Modal, SearchSelect, TextInput, type SelectOption } from '$lib/components'

    let name = $state('')
    let email = $state('')
    let country = $state<string | null>(null)
    let language = $state<string | null>('nb')

    const countries: SelectOption[] = [
        { value: 'no', label: 'Norway' },
        { value: 'se', label: 'Sweden' },
        { value: 'dk', label: 'Denmark' },
        { value: 'fi', label: 'Finland' },
        { value: 'is', label: 'Iceland' },
        { value: 'fo', label: 'Faroe Islands' },
        { value: 'gl', label: 'Greenland' },
        { value: 'ax', label: 'Åland Islands' },
    ]

    const languages: SelectOption[] = [
        { value: 'nb', label: 'Norwegian Bokmål' },
        { value: 'nn', label: 'Norwegian Nynorsk' },
        { value: 'se', label: 'Northern Sámi' },
        { value: 'en', label: 'English' },
        { value: 'la', label: 'Latin (not available)', disabled: true },
    ]

    const emailLooksWrong = $derived(email !== '' && !email.includes('@'))

    let confirmOpen = $state(false)
    let formOpen = $state(false)
    let blockingOpen = $state(false)
    let nickname = $state('')
    /** Set when the confirm popup is answered, to show that it reports which way it went. */
    let lastAnswer = $state<string | null>(null)

    // Shared by the three demo buttons; the popups themselves carry no button styling.
    const buttonBase =
        'rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-150' +
        ' focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent-blue)'
    const buttonPrimary = `${buttonBase} bg-(--accent-blue) text-(--accent-blue-ink) hover:opacity-90`
    const buttonQuiet = `${buttonBase} bg-(--surface-raised) text-(--text) hover:bg-(--surface-hover)`
</script>

<svelte:head>
    <title>Steintre</title>
</svelte:head>

<main class="m-2 flex flex-1 flex-col gap-2">
    <Hero
        name="Steintre Web"
        tagline="SvelteKit, Tailwind v4 and the design tokens, wired up and ready."
    />

    <section class="rounded-2xl bg-(--surface-base) p-6">
        <h2 class="text-xl font-medium text-(--text)">Fields</h2>
        <p class="mt-1 text-sm text-(--text-secondary)">
            Each one is 64px tall and fills its column. The label rests in the middle and moves to
            the top-left corner once the field is active.
        </p>

        <!-- Two columns to show that they fill whatever they are given, not a fixed width. -->
        <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <TextInput label="Full name" bind:value={name} autocomplete="name" />

            <TextInput
                label="Email"
                type="email"
                bind:value={email}
                autocomplete="email"
                invalid={emailLooksWrong}
                hint={emailLooksWrong ? 'That is missing an @.' : undefined}
            />

            <SearchSelect label="Country" options={countries} bind:value={country} />

            <SearchSelect label="Preferred language" options={languages} bind:value={language} />

            <TextInput label="Disabled" value="Not editable" disabled />

            <TextInput label="A label long enough that it has to be cut off" />
        </div>

        <pre class="mt-6 overflow-x-auto rounded-xl bg-(--surface-sunken) p-4 text-xs text-(--text-secondary)">{JSON.stringify(
                { name, email, country, language },
                null,
                2,
            )}</pre>
    </section>

    <section class="rounded-2xl bg-(--surface-base) p-6">
        <h2 class="text-xl font-medium text-(--text)">Popups</h2>
        <p class="mt-1 text-sm text-(--text-secondary)">
            A native &lt;dialog&gt;, so it opens in the top layer above everything and leaves the
            page behind it inert. Escape, the backdrop and the ✕ all close it unless it is marked
            as not dismissible.
        </p>

        <div class="mt-6 flex flex-wrap gap-2">
            <button type="button" class={buttonQuiet} onclick={() => (confirmOpen = true)}>
                Confirm something
            </button>
            <button type="button" class={buttonQuiet} onclick={() => (formOpen = true)}>
                A popup with fields
            </button>
            <button type="button" class={buttonQuiet} onclick={() => (blockingOpen = true)}>
                One you must answer
            </button>
        </div>

        {#if lastAnswer}
            <p class="mt-4 text-sm text-(--text-secondary)">Last answer: {lastAnswer}</p>
        {/if}
    </section>
</main>

<Modal
    bind:open={confirmOpen}
    size="sm"
    title="Delete this item?"
    description="This cannot be undone."
>
    <p class="text-(--text-secondary)">
        The item and everything attached to it will be removed.
    </p>

    {#snippet footer()}
        <button
            type="button"
            class={buttonQuiet}
            onclick={() => {
                lastAnswer = 'kept'
                confirmOpen = false
            }}
        >
            Cancel
        </button>
        <button
            type="button"
            class={buttonPrimary}
            onclick={() => {
                lastAnswer = 'deleted'
                confirmOpen = false
            }}
        >
            Delete
        </button>
    {/snippet}
</Modal>

<!--
    The fields keep their own floating-label behaviour in here, and the popup grows to fit them
    rather than being given a height.
-->
<Modal bind:open={formOpen} title="Edit your profile">
    <div class="grid gap-4">
        <TextInput label="Nickname" bind:value={nickname} autocomplete="nickname" />
        <TextInput label="Email" type="email" bind:value={email} autocomplete="email" />
    </div>

    {#snippet footer()}
        <button type="button" class={buttonQuiet} onclick={() => (formOpen = false)}>
            Cancel
        </button>
        <button type="button" class={buttonPrimary} onclick={() => (formOpen = false)}>
            Save
        </button>
    {/snippet}
</Modal>

<!-- No ✕, and Escape and the backdrop are both refused: the footer button is the only way out. -->
<Modal
    bind:open={blockingOpen}
    size="sm"
    dismissible={false}
    title="Accept the terms"
    description="There is no ✕ on this one, and Escape will not close it."
>
    <p class="text-(--text-secondary)">
        Some popups have to be answered rather than dismissed. The button below is the only way
        out of this one.
    </p>

    {#snippet footer()}
        <button
            type="button"
            class={buttonPrimary}
            onclick={() => {
                lastAnswer = 'accepted'
                blockingOpen = false
            }}
        >
            I accept
        </button>
    {/snippet}
</Modal>
