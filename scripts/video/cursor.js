// A calm, visible cursor for the demo video (injected into every page while recording): a white arrow with a
// thin ink outline that glides to its target along an eased curve, and a soft red ripple on click.
(() => {
  if (window.__cursor) return;
  const KEY = "portage.video.cursor";
  let pos = { x: 800, y: 780 };
  try {
    pos = JSON.parse(sessionStorage.getItem(KEY)) || pos;
  } catch {}
  let el = null;
  const place = () => el && (el.style.transform = `translate(${pos.x - 3}px, ${pos.y - 2}px)`);
  const mount = () => {
    if (el || !document.documentElement) return;
    el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    el.style.cssText = "position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;will-change:transform;transition:opacity 0.35s ease";
    el.innerHTML =
      '<svg width="24" height="32" viewBox="0 0 24 32"><path d="M3 2 L3 25 L9 19.5 L13.2 29 L17.4 27.2 L13.3 18 L21.5 18 Z" fill="#fafaf9" stroke="#0c0a09" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.documentElement.appendChild(el);
    place();
  };
  // After hydration, so the cursor never touches React's tree.
  window.addEventListener("load", () => setTimeout(mount, 400));
  const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p));
  // After a click the cursor fades out, so it never rests on text the viewer is reading.
  let hideTimer = 0;
  const show = () => {
    clearTimeout(hideTimer);
    if (el) el.style.opacity = "1";
  };
  window.__cursor = {
    move(x, y) {
      mount();
      show();
      const from = { ...pos };
      const dist = Math.hypot(x - from.x, y - from.y);
      const ms = Math.min(800, Math.max(500, 500 + dist / 3));
      // A gentle arc: the control point sits off the straight line.
      const cx = (from.x + x) / 2 - (y - from.y) * 0.12;
      const cy = (from.y + y) / 2 + (x - from.x) * 0.12;
      const t0 = performance.now();
      return new Promise((resolve) => {
        const step = (now) => {
          const p = Math.min(1, (now - t0) / ms);
          const e = ease(p);
          pos = { x: (1 - e) * (1 - e) * from.x + 2 * (1 - e) * e * cx + e * e * x, y: (1 - e) * (1 - e) * from.y + 2 * (1 - e) * e * cy + e * e * y };
          place();
          if (p < 1) requestAnimationFrame(step);
          else {
            try {
              sessionStorage.setItem(KEY, JSON.stringify(pos));
            } catch {}
            resolve();
          }
        };
        requestAnimationFrame(step);
      });
    },
    click() {
      mount();
      const r = document.createElement("div");
      r.style.cssText = `position:fixed;left:${pos.x - 14}px;top:${pos.y - 14}px;width:28px;height:28px;border-radius:50%;border:2px solid #d52b1e;background:rgba(213,43,30,0.18);z-index:2147483646;pointer-events:none`;
      document.documentElement.appendChild(r);
      r.animate([{ transform: "scale(0.4)", opacity: 0.9 }, { transform: "scale(1.9)", opacity: 0 }], { duration: 520, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }).onfinish = () => r.remove();
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => el && (el.style.opacity = "0"), 700);
    },
  };
})();
