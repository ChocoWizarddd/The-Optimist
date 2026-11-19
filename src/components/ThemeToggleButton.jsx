import { flushSync } from "react-dom";
import { motion } from "framer-motion";
import { Moon } from "lucide-react";
import SocialFlipButton from "./ui/social-flip-button";

const transitionStyles = `
  ::view-transition-group(root) {
    animation-duration: .7s;
    animation-timing-function: cubic-bezier(.16, 1, .3, 1);
  }
  ::view-transition-old(root) {
    animation: none;
    z-index: -1;
  }
  ::view-transition-new(root) {
    animation-name: reveal-theme-bottom-up;
  }
  @keyframes reveal-theme-bottom-up {
    from { clip-path: polygon(0 100%, 100% 100%, 100% 100%, 0 100%); }
    to { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
  }
`;

export default function ThemeToggleButton({ theme, onToggle }) {
  const isDark = theme === "black";
  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "black";
    const applyTheme = () => {
      document.documentElement.dataset.theme = nextTheme;
      flushSync(() => onToggle(nextTheme));
    };

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !document.startViewTransition
    ) {
      applyTheme();
      return;
    }

    let styleElement = document.getElementById("theme-transition-styles");
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = "theme-transition-styles";
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = transitionStyles;
    document.startViewTransition(applyTheme);
  };

  return (
    <SocialFlipButton
      type="button"
      className="theme-toggle"
      backIcon={<Moon size={15} />}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "black"} mode`}
      title={`Switch to ${isDark ? "Light" : "Black"} mode`}
    >
      <svg
        viewBox="0 0 240 240"
        width="15"
        height="15"
        fill="none"
        aria-hidden="true"
      >
        <motion.g
          animate={{ rotate: isDark ? -180 : 0 }}
          transition={{ ease: "easeInOut", duration: 0.5 }}
        >
          <path
            d="M120 67.5C149.25 67.5 172.5 90.75 172.5 120C172.5 149.25 149.25 172.5 120 172.5"
            fill="white"
          />
          <path
            d="M120 67.5C90.75 67.5 67.5 90.75 67.5 120C67.5 149.25 90.75 172.5 120 172.5"
            fill="black"
          />
        </motion.g>
        <motion.path
          animate={{ rotate: isDark ? 180 : 0 }}
          transition={{ ease: "easeInOut", duration: 0.5 }}
          d="M120 3.75C55.5 3.75 3.75 55.5 3.75 120C3.75 184.5 55.5 236.25 120 236.25C184.5 236.25 236.25 184.5 236.25 120C236.25 55.5 184.5 3.75 120 3.75ZM120 214.5V172.5C90.75 172.5 67.5 149.25 67.5 120C67.5 90.75 90.75 67.5 120 67.5V25.5C172.5 25.5 214.5 55.5 214.5 120C214.5 184.5 172.5 214.5 120 214.5Z"
          fill="white"
        />
      </svg>
      <span className="theme-label">{isDark ? "LIGHT" : "DARK"}</span>
    </SocialFlipButton>
  );
}
