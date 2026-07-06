import { useEffect } from "react";
import { animate, stagger } from "animejs";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const useAnimeReveal = (sectionRef, itemSelector, options = {}) => {
  const threshold = options.threshold ?? 0.18;
  const initialOffset = options.initialOffset ?? 22;
  const delayStep = options.delayStep ?? 70;
  const duration = options.duration ?? 720;

  useEffect(() => {
    const root = sectionRef.current;

    if (!root) {
      return undefined;
    }

    const items = Array.from(root.querySelectorAll(itemSelector));

    if (!items.length) {
      return undefined;
    }

    const reveal = () => {
      const prefersReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;

      if (prefersReducedMotion) {
        items.forEach((item) => {
          item.style.opacity = "1";
          item.style.transform = "none";
        });
        return;
      }

      animate(items, {
        opacity: [0, 1],
        y: [initialOffset, 0],
        scale: [0.98, 1],
        delay: stagger(delayStep),
        duration,
        ease: "outCubic",
      });
    };

    if (typeof IntersectionObserver === "undefined") {
      reveal();
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(root);

    return () => observer.disconnect();
  }, [delayStep, duration, initialOffset, itemSelector, sectionRef, threshold]);
};

export default useAnimeReveal;
