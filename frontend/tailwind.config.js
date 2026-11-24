/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Sleek obsidian finance palette from user image
        obsidian: {
          base: '#0B0E11',     // Deepest canvas background
          surface: '#13171C',  // Card and panel surface
          well: '#0E1216',     // Recessed inner well
          elevated: '#1A2027', // Active / elevated card
          border: '#20262E',   // Precise hairline border
          divider: '#192027',  // Internal dividers
        },
        // Neon accent system
        neon: {
          green: '#00E599',    // Primary vibrant neon emerald from user image
          greenGlow: 'rgba(0, 229, 153, 0.25)',
          amber: '#FF9900',    // Secondary warm neon amber from user image
          amberGlow: 'rgba(255, 153, 0, 0.25)',
          violet: '#8B5CF6',   // Tertiary crypto purple
          cyan: '#00D8F6',     // Telemetry cyan
          red: '#FF4D4D',      // Fraud risk alert red
        },
        // High contrast text hierarchy
        textPrimary: '#FFFFFF',
        textSecondary: '#8E9AA8',
        textMuted: '#586574',
        
        // Legacy alias compatibility
        chassis: {
          darkest: '#0B0E11',
          well: '#0E1216',
          DEFAULT: '#13171C',
          panel: '#161B22',
          elevated: '#1A2027',
        },
        platinum: '#FFFFFF',
        steel: '#8E9AA8',
        slateborder: '#20262E',
        coral: {
          DEFAULT: '#00E599',
          hover: '#00cc88',
          tint: 'rgba(0, 229, 153, 0.12)',
          border: 'rgba(0, 229, 153, 0.35)',
        },
        led: {
          green: '#00E599',
          amber: '#FF9900',
          red: '#FF4D4D',
          cyan: '#00D8F6',
          blue: '#3B82F6',
        }
      },
      borderRadius: {
        'panel': '18px',
        'subpanel': '14px',
        'bezel': '12px',
        'tactile': '10px',
        'tag': '6px',
      },
      boxShadow: {
        'card-glow': '0 4px 24px -2px rgba(0, 0, 0, 0.6), 0 0 0 1px #20262E',
        'neon-green': '0 0 18px rgba(0, 229, 153, 0.35)',
        'neon-amber': '0 0 18px rgba(255, 153, 0, 0.35)',
        'neon-border': '0 0 15px rgba(0, 229, 153, 0.2), inset 0 0 15px rgba(0, 229, 153, 0.05)',
        'chassis-raised': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px #20262E',
        'chassis-inset': 'inset 0 2px 4px rgba(0, 0, 0, 0.55)',
        'coral-glow': '0 0 18px rgba(0, 229, 153, 0.35)',
      }
    },
  },
  plugins: [],
}
