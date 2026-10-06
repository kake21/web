<script lang="ts">
    let { name, tagline }: { name: string, tagline: string } = $props()
</script>

<div class="rounded-2xl bg-(--surface-base) p-6">
    <h1 class="font-display text-3xl font-medium text-(--text)">{name}</h1>
    <p class="mt-2 text-(--text-secondary)">{tagline}</p>
</div>
