/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        jarvis: {
          black: "#000000",
          surface: "#111111",
          card: "#1a1a1a",
          border: "#222222",
          accent: "#00D4FF",
          muted: "#888888",
          success: "#00FF88",
          error: "#FF4444",
          warning: "#FFB800"
        }
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 212, 255, 0.3)",
        softGlow: "0 0 14px rgba(0, 212, 255, 0.18)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      animation: {
        shimmer: "shimmer 1.45s ease-in-out infinite",
        pulseDot: "pulseDot 1.4s ease-in-out infinite",
        bounceDot: "bounceDot 1s ease-in-out infinite"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-240px 0" },
          "100%": { backgroundPosition: "240px 0" }
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(0.72)" }
        },
        bounceDot: {
          "0%, 80%, 100%": { transform: "translateY(0)", opacity: "0.45" },
          "40%": { transform: "translateY(-5px)", opacity: "1" }
        }
      }
    }
  },
  plugins: []
};
