/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#ec4899', // Rosa
                secondary: '#8b5cf6', // Violeta
            }
        },
    },
    plugins: [],
}
