import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
    // Tailwind must come before sveltekit so the generated CSS is available to the
    // Svelte component transforms.
    plugins: [tailwindcss(), sveltekit()],
    server: {
        port: 5173,
    },
})
