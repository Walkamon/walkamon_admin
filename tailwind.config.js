/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx,html}",
        "./src/pages/auth/login/page/LoginPage.jsx" // Chỉ định chính xác để chắc chắn nhận class
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}