import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/*
  PageTransition wraps page content and plays a reveal animation
  every time the route changes. Uses a clip-path wipe effect that
  looks like a page turning/revealing.
*/
export default function PageTransition({ children }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [animState, setAnimState] = useState('idle'); // idle | exiting | entering
  const prevPath = useRef(location.pathname);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // On first render, just play enter
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setAnimState('entering');
      const t = setTimeout(() => setAnimState('idle'), 600);
      return () => clearTimeout(t);
    }

    // On route change
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname;
      setAnimState('exiting');

      const t1 = setTimeout(() => {
        setDisplayChildren(children);
        setAnimState('entering');
      }, 300);

      const t2 = setTimeout(() => {
        setAnimState('idle');
      }, 900);

      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      setDisplayChildren(children);
    }
    // eslint-disable-next-line
  }, [location.pathname, children]);

  return (
    <>
      <div className={`page-transition ${animState}`}>
        {displayChildren}
      </div>
      {/* The sweep overlay */}
      <div className={`page-sweep ${animState}`} />
    </>
  );
}
