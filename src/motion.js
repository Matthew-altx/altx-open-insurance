import { useEffect, useState } from "react";

const preferenceKey = "altx-motion-paused";

export function useMotionPreference() {
  const [systemReduced, setSystemReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [paused, setPaused] = useState(() => {
    try {
      return localStorage.getItem(preferenceKey) === "true";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setSystemReduced(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.motion =
      systemReduced || paused ? "off" : "on";
  }, [systemReduced, paused]);
  const toggle = () => {
    const next = !paused;
    setPaused(next);
    try {
      localStorage.setItem(preferenceKey, String(next));
    } catch {
      // The control still works when browser storage is unavailable.
    }
  };
  return { reduced: systemReduced || paused, systemReduced, toggle };
}

// Progressive enhancement: content is visible even if animation is unavailable.
export function usePageMotion(path, reduced, ready = true) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.motion = reduced ? "off" : "on";
    if (reduced || !ready) return;

    const animations = new Set();
    const reveals = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;
          const still = el.dataset.reveal === "still";
          const animation = el.animate(
            [
              { opacity: 0, translate: still ? "0 0" : "0 28px" },
              { opacity: 1, translate: "0 0" },
            ],
            {
              duration: still ? 420 : 850,
              delay: Number(el.dataset.delay || 0),
              easing: "cubic-bezier(.16, 1, .3, 1)",
              fill: "backwards",
            },
          );
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
          reveals.unobserve(el);
        }
      },
      { threshold: 0.08 },
    );
    document
      .querySelectorAll("[data-reveal]")
      .forEach((el) => reveals.observe(el));

    const ambient = new IntersectionObserver((entries) => {
      for (const entry of entries)
        entry.target.classList.toggle("is-inview", entry.isIntersecting);
    });
    document
      .querySelectorAll("[data-ambient]")
      .forEach((el) => ambient.observe(el));

    const progress = document.querySelector(".reading-progress");
    const hero = document.querySelector(".hero");
    const art = document.querySelector(".art-parallax");
    let scrollFrame = 0;
    const paintScroll = () => {
      scrollFrame = 0;
      const max = root.scrollHeight - window.innerHeight;
      if (progress)
        progress.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0})`;
      if (hero?.classList.contains("is-inview") && art)
        art.style.translate = `0 ${Math.min(window.scrollY * 0.1, 55)}px`;
    };
    const onScroll = () => {
      if (!scrollFrame && !document.hidden)
        scrollFrame = requestAnimationFrame(paintScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    paintScroll();

    const cleanups = [];
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      let frame = 0;
      const move = (event) => {
        if (!finePointer.matches || event.pointerType === "touch") return;
        cancelAnimationFrame(frame);
        const { clientX, clientY } = event;
        frame = requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          const x = (clientX - rect.left) / rect.width;
          const y = (clientY - rect.top) / rect.height;
          el.style.setProperty("--tilt-x", `${(0.5 - y) * 7}deg`);
          el.style.setProperty("--tilt-y", `${(x - 0.5) * 9}deg`);
          el.style.setProperty("--light-x", `${x * 100}%`);
          el.style.setProperty("--light-y", `${y * 100}%`);
          frame = 0;
        });
      };
      const reset = () => {
        cancelAnimationFrame(frame);
        el.style.removeProperty("--tilt-x");
        el.style.removeProperty("--tilt-y");
        el.style.removeProperty("--light-x");
        el.style.removeProperty("--light-y");
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", reset);
      cleanups.push(() => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", reset);
        reset();
      });
    });
    const visibility = () => {
      root.classList.toggle("page-hidden", document.hidden);
      for (const animation of animations)
        document.hidden ? animation.pause() : animation.play();
      if (!document.hidden) onScroll();
    };
    document.addEventListener("visibilitychange", visibility);
    visibility();

    return () => {
      reveals.disconnect();
      ambient.disconnect();
      animations.forEach((animation) => animation.cancel());
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("visibilitychange", visibility);
      cancelAnimationFrame(scrollFrame);
      cleanups.forEach((cleanup) => cleanup());
      if (art) art.style.removeProperty("translate");
      if (progress) progress.style.removeProperty("transform");
      root.classList.remove("page-hidden");
    };
  }, [path, reduced, ready]);
}
