import "./social-flip-button.css";

/**
 * Button wrapper that adds the Social Flip Button's two-sided 3D hover/focus
 * treatment while preserving the normal button API and visible label.
 */
export default function SocialFlipButton({
  children,
  backIcon,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      {...props}
      type={type}
      className={`social-flip-button ${className}`.trim()}
    >
      <span className="social-flip-stage">
        <span className="social-flip-face social-flip-front">{children}</span>
        <span className="social-flip-face social-flip-back" aria-hidden="true">
          {backIcon ?? children}
        </span>
      </span>
    </button>
  );
}
