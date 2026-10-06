<script lang="ts">
    import Hero from '$lib/Hero.svelte'
    import { SearchSelect, TextInput, type SelectOption } from '$lib/components'

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
</main>
