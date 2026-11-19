import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate, motion, motionValue, useReducedMotion, useTransform } from 'motion/react';
import './JellyRadio.css';

const DEFAULT_ITEMS = ['Off', 'Low', 'Medium', 'High', 'Max'];
const SIZES = { sm: [28, 12, 12], md: [36, 13, 16], lg: [44, 14, 20] };
const spring = (stiffness, mass, bounce) => ({
  type: 'spring',
  stiffness,
  damping: 2 * Math.sqrt(stiffness * mass) * (1 - bounce),
  mass,
});

const Chip = forwardRef(function Chip({ mv, children, ...props }, ref) {
  const transform = useTransform(() => `translateX(${mv.x.get()}px) scale(${mv.sx.get()}, ${mv.sy.get()})`);
  return <motion.button ref={ref} style={{ transform }} {...props}>{children}</motion.button>;
});

export default function JellyRadio({
  items = DEFAULT_ITEMS,
  value,
  defaultValue,
  onChange,
  chipColor = '#171c20',
  activeColor = '#8fcde8',
  textColor = '#aab7be',
  activeTextColor = '#071116',
  size = 'md',
  gap = 5,
  radius = 11,
  swell = 0.13,
  barge = 4,
  shrink = 0.035,
  jelly = 0.85,
  bounce = 0.2,
  stagger = 18,
  stiffness = 580,
  disabled = false,
  ariaLabel = 'Options',
  className = '',
}) {
  const list = items.map((item) => (typeof item === 'string' ? { value: item, label: item } : item));
  const [inner, setInner] = useState(() => defaultValue ?? list[0]?.value);
  const current = value ?? inner;
  const selectedIndex = Math.max(0, list.findIndex((item) => item.value === current));
  const reduce = useReducedMotion();
  const groupRef = useRef(null);
  const chipRefs = useRef([]);
  const widths = useRef([]);
  const motionValues = useRef([]);
  const applied = useRef(selectedIndex);
  const config = useRef({});
  config.current = { swell, barge, shrink, jelly, bounce, stagger, stiffness, reduce, count: list.length };
  const [height, fontSize, horizontalPadding] = SIZES[size] ?? SIZES.md;
  const itemsKey = list.map((item) => item.value).join('|');

  const getMotionValue = (index) => {
    let item = motionValues.current[index];
    if (!item) {
      item = { x: motionValue(0), sx: motionValue(1), sy: motionValue(1) };
      motionValues.current[index] = item;
    }
    return item;
  };

  const applySelection = (selection, instant = false) => {
    const cfg = config.current;
    const group = groupRef.current;
    const rtl = group ? getComputedStyle(group).direction === 'rtl' : false;
    const shove = ((widths.current[selection] ?? 0) * cfg.swell) / 2 + cfg.barge;
    for (let index = 0; index < cfg.count; index += 1) {
      const mv = getMotionValue(index);
      const active = index === selection;
      const distance = Math.abs(index - selection);
      const direction = Math.sign(index - selection) * (rtl ? -1 : 1);
      const x = direction * shove;
      const scale = active ? 1 + cfg.swell : 1 - cfg.shrink;
      if (instant || cfg.reduce) {
        mv.x.jump(x);
        mv.sx.jump(scale);
        mv.sy.jump(scale);
        continue;
      }
      const springStiffness = cfg.stiffness * (1 - 0.12 * Math.min(distance, 3));
      const inFlight = mv.x.isAnimating() || mv.sx.isAnimating() || mv.sy.isAnimating();
      const delay = inFlight ? 0 : (distance * cfg.stagger) / 1000;
      animate(mv.x, x, { ...spring(springStiffness, 0.9, cfg.bounce), delay });
      animate(mv.sx, scale, {
        ...spring(springStiffness * (1 + 0.24 * cfg.jelly), 0.9 - 0.1 * cfg.jelly, Math.min(0.85, cfg.bounce + 0.3 * cfg.jelly)),
        delay,
      });
      animate(mv.sy, scale, { ...spring(springStiffness * (1 - 0.14 * cfg.jelly), 0.9 + 0.05 * cfg.jelly, cfg.bounce), delay: delay + 0.05 * cfg.jelly });
    }
  };

  const measure = () => {
    const group = groupRef.current;
    if (!group) return;
    widths.current = chipRefs.current.map((element) => element?.offsetWidth ?? 0);
    const chipHeight = chipRefs.current[0]?.offsetHeight ?? 0;
    const maxWidth = Math.max(0, ...widths.current);
    group.style.setProperty('--jr-pad-x', `${Math.ceil((maxWidth * swell * 1.3) / 2 + barge) + 2}px`);
    group.style.setProperty('--jr-pad-y', `${Math.ceil((chipHeight * swell) / 2) + 2}px`);
  };

  useLayoutEffect(() => {
    const settle = () => {
      measure();
      applySelection(applied.current, true);
    };
    settle();
    const observer = new ResizeObserver(settle);
    if (groupRef.current) observer.observe(groupRef.current);
    document.fonts?.ready.then(settle);
    return () => observer.disconnect();
  }, [itemsKey, size, gap, swell, barge, shrink]);

  useEffect(() => {
    if (applied.current === selectedIndex) return;
    applied.current = selectedIndex;
    applySelection(selectedIndex, true);
  }, [selectedIndex]);

  useEffect(() => () => {
    motionValues.current.forEach((item) => {
      item.x.destroy();
      item.sx.destroy();
      item.sy.destroy();
    });
  }, []);

  const commit = (index, instant = false) => {
    if (disabled || index === selectedIndex || !list[index] || list[index].disabled) return;
    applied.current = index;
    applySelection(index, instant);
    if (value === undefined) setInner(list[index].value);
    onChange?.(list[index].value, index);
  };

  const nextEnabled = (index, direction) => {
    let next = index;
    for (let tries = 0; tries < list.length; tries += 1) {
      next = (next + direction + list.length) % list.length;
      if (!list[next].disabled) return next;
    }
    return index;
  };

  const handleKeyDown = (event, index) => {
    let next = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = nextEnabled(index, 1);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = nextEnabled(index, -1);
    else if (event.key === 'Home') next = nextEnabled(-1, 1);
    else if (event.key === 'End') next = nextEnabled(list.length, -1);
    else if (event.key === ' ' || event.key === 'Enter') next = index;
    if (next === null) return;
    event.preventDefault();
    commit(next, true);
    chipRefs.current[next]?.focus();
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={ariaLabel}
      data-disabled={disabled ? '' : undefined}
      className={`jelly-radio${className ? ` ${className}` : ''}`}
      style={{ '--jr-chip': chipColor, '--jr-active': activeColor, '--jr-text': textColor, '--jr-active-text': activeTextColor, '--jr-gap': `${gap}px`, '--jr-radius': `${radius}px`, '--jr-h': `${height}px`, '--jr-font': `${fontSize}px`, '--jr-px': `${horizontalPadding}px` }}
    >
      {list.map((item, index) => (
        <Chip
          key={item.value}
          mv={getMotionValue(index)}
          ref={(element) => { chipRefs.current[index] = element; }}
          type="button"
          role="radio"
          aria-checked={index === selectedIndex}
          tabIndex={index === selectedIndex ? 0 : -1}
          disabled={disabled || !!item.disabled}
          className="jelly-radio__chip"
          data-on={index === selectedIndex ? 'true' : 'false'}
          onClick={(event) => commit(index, event.detail === 0)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          <span className="jelly-radio__skin">{item.icon ? <span className="jelly-radio__icon">{item.icon}</span> : null}<span className="jelly-radio__label">{item.label}</span></span>
        </Chip>
      ))}
    </div>
  );
}
