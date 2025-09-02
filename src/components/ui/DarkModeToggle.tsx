import { useEffect, useState } from 'react';

export default function DarkModeToggle() {
    const [isDark, setIsDark] = useState(
        localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    return (
        <button
            onClick={() => setIsDark(!isDark)}
            className="ml-4 p-2 rounded border border-gray-300 dark:border-gray-600 text-[var(--text)]"
        >
            {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
    );
}