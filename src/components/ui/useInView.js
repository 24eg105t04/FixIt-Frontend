import { useEffect, useState } from "react";

export function useInView(rootMargin = "100px") {
  const [element, setElement] = useState(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    if (!element || !("IntersectionObserver" in window)) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, rootMargin]);

  return [setElement, inView];
}