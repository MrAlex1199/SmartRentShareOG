import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#FDB913',
                    dark: '#EA9E00',
                    light: '#FECA57',
                },
                secondary: {
                    DEFAULT: '#1F2937',
                    light: '#374151',
                },
            },
            fontFamily: {
                sans: ['Prompt', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};

export default config;
