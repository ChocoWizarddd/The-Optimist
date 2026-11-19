import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Reveal-on-scroll. Elements opt in with data-reveal="up|left|right|scale". */
export function useReveal(pageKey) {
  useEffect(() => {
    const root = document.querySelector('.content');
    if (!root || reduced() || !('IntersectionObserver' in window)) return;

    const targets = [...root.querySelectorAll('[data-reveal]')];
    targets.forEach((element, index) => {
      if (!element.style.getPropertyValue('--reveal-delay')) {
        element.style.setProperty('--reveal-delay', `${(index % 5) * 70}ms`);
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' },
    );

    targets.forEach((target) => observer.observe(target));
    return () => {
      observer.disconnect();
      targets.forEach((element) => {
        element.classList.remove('is-visible');
        element.style.removeProperty('--reveal-delay');
      });
    };
  }, [pageKey]);
}

/* Magnetic hover for buttons and links. */
export function Magnetic({ children, strength = 0.18, className = '' }) {
  if (reduced()) return <span className={`magnetic ${className}`}>{children}</span>;

  const onMove = (event) => {
    const node = event.currentTarget;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * strength;
    const y = (event.clientY - rect.top - rect.height / 2) * strength;
    node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  };
  const onLeave = (event) => {
    event.currentTarget.style.transform = 'translate3d(0,0,0)';
  };

  return (
    <span
      className={`magnetic ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </span>
  );
}

/* Subtle 3D pointer tilt for cards. */
export function Tilt({ children, className = '', amount = 5 }) {
  if (reduced()) return <div className={className}>{children}</div>;

  const onMove = (event) => {
    const node = event.currentTarget;
    const rect = node.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    node.style.setProperty('--tilt-x', `${(-py * amount).toFixed(2)}deg`);
    node.style.setProperty('--tilt-y', `${(px * amount).toFixed(2)}deg`);
    node.style.setProperty('--tilt-gx', `${((px + 0.5) * 100).toFixed(1)}%`);
    node.style.setProperty('--tilt-gy', `${((py + 0.5) * 100).toFixed(1)}%`);
  };
  const onLeave = (event) => {
    const node = event.currentTarget;
    node.style.setProperty('--tilt-x', '0deg');
    node.style.setProperty('--tilt-y', '0deg');
    node.style.setProperty('--tilt-gx', '50%');
    node.style.setProperty('--tilt-gy', '50%');
  };

  return (
    <div className={`tilt ${className}`} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  );
}

/* Scroll progress and back-to-top. */
export default function InterfaceFX() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty('--scroll-y', String(y));
      document.documentElement.style.setProperty('--scroll-progress', String(max > 0 ? y / max : 0));
      setShowTop(y > 620);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <>
      <div className="scroll-progress" aria-hidden="true"><i /></div>
      <button
        type="button"
        className={`scroll-top ${showTop ? 'scroll-top--visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' })}
        aria-label="Back to top"
        tabIndex={showTop ? 0 : -1}
      >
        <ArrowUp size={16} />
      </button>
    </>
  );
}
