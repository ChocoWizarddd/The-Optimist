import React, { useMemo } from 'react';

/** Character-staggered 3D flip reveal, adapted to the project's plain Vite setup. */
export default function FlipText({
  children,
  className = '',
  duration = 2.2,
  delay = 0,
  loop = true,
  separator = ' ',
  together = false,
}) {
  const words = useMemo(() => String(children).split(separator), [children, separator]);
  const totalChars = String(children).length;

  let globalIndex = 0;
  return (
    <span className={`flip-text-wrapper ${className}`} style={{ perspective: '1000px' }}>
      {words.map((word, wordIndex) => (
        <span className="flip-text-word" key={`${word}-${wordIndex}`}>
          {word.split('').map((char, charIndex) => {
            const index = globalIndex++;
            const stagger = together ? 0 : Math.sin((index / Math.max(totalChars, 1)) * (Math.PI / 2)) * duration * 0.25;
            return (
              <span
                className="flip-char"
                data-char={char}
                key={`${char}-${charIndex}`}
                style={{
                  '--flip-duration': `${duration}s`,
                  '--flip-delay': `${delay + stagger}s`,
                  '--flip-iteration': loop ? 'infinite' : '1',
                }}
              >
                {char}
              </span>
            );
          })}
          {wordIndex < words.length - 1 && (separator === ' ' ? '\u00a0' : separator)}
        </span>
      ))}
    </span>
  );
}
