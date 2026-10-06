<script lang="ts">
    import '../app.css'
    import type { Snippet } from 'svelte'

    let { children }: { children: Snippet } = $props()
</script>

<!--
    h-dvh rather than min-h-screen: the shell is pinned to the viewport and the content column
    scrolls inside it, so anything fixed to the shell stays on screen on a long page.
-->
<div class="flex h-dvh flex-col">
    <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        {@render children()}
    </div>
</div>
