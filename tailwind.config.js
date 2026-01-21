/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                osia: {
                    deep: {
                        900: '#0A1128', // Deepest blue
                        800: '#132046',
                        700: '#1C2F64',
                    },
                    purple: {
                        900: '#1A103C',
                        500: '#6B4C9A',
                        300: '#9D84C2',
                    },
                    teal: {
                        900: '#0D2B28',
                        500: '#38A3A5',
                        300: '#80CED7',
                    },
                    amber: {
                        500: '#D4A373',
                        300: '#E9C46A',
                        100: '#FEFAE0',
                    },
                    neutral: {
                        900: '#121212',
                        800: '#1E1E1E',
                        500: '#757575',
                        100: '#F5F5F5',
                        50: '#FAFAFA',
                    }
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
