import React, { useEffect, useRef, useState } from 'react';

/*
  AnimatedCard - reveals children with a slide-up + fade when scrolled into view.
  Use delay prop to stagger multiple cards.
*/
export function AnimatedCard({ children, delay = 0, className = '', style = {}, onClick }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      onClick={onClick}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/*
  StaggerChildren - wraps direct children and adds incremental delay
*/
export function StaggerChildren({ children, baseDelay = 0, increment = 0.08, className = '', style = {} }) {
  return (
    <div className={className} style={style}>
      {React.Children.map(children, (child, i) => {
        if (!React.isValidElement(child)) return child;
        return (
          <AnimatedCard delay={baseDelay + i * increment}>
            {child}
          </AnimatedCard>
        );
      })}
    </div>
  );
}

/*
  CountUp - animates a number counting up from 0
*/
export function CountUp({ end, duration = 1000, className = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const endNum = parseInt(end) || 0;
    if (endNum === 0) { setCount(0); return; }
    const step = Math.max(1, Math.floor(endNum / (duration / 30)));
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= endNum) {
        setCount(endNum);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return <span ref={ref} className={className}>{count}</span>;
}
