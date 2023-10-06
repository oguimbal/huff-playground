module.exports = {
    mode: 'jit',
    purge: [
      './src/**/*.{js,jsx,ts,tsx,vue,html}',
    ],
    darkMode: 'class',
    theme: {
      extend: {},
      colors: {
            'home-bg': '#000000',
            'code-bg': '#1F2937',
            outline: '#7B7B7B52',
            'font-variant': '#7B7B7B',
            'surface-muted': '#7B7B7B14',
            'surface-variant-muted': '#3131313D',
            'font-disabled': '#7B7B7B7A',
            primary: "rgb(var(--color-primary))",
            accent: "rgb(var(--color-accent))",
            'font-on-accent': "#000000CC",
            text: "rgb(var(--color-text))",
            light: "rgb(var(--color-light))",
            success: "#76C81E",
            info: "rgb(var(--color-info))",
            warn: "rgb(var(--color-warn))",
            error: "#FA2565",
            surface: "rgb(var(--color-surface))",
            transparent: "transparent",
            current: "currentColor",
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        youth: ['Youth'],
      },
    },
    variants: {
    extend: {},
    },
    plugins: [
      require('flowbite/plugin')
    ],
  };
