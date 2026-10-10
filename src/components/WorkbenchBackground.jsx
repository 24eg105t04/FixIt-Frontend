
import { useEffect, useRef } from "react";

/**
 * WorkbenchBackground
 * Animated electronics workbench backdrop for FixIt:
 * - Blueprint grid that lights up around the cursor
 * - Circuit traces with current pulses
 * - Drifting gears, nuts, screws and chips
 * - Solder sparks that fly off the cursor
 */

const GRID = 24;
const WHEEL = [
  [1, 0], [1, 1], [0, 1], [-1, 1],
  [-1, 0], [-1, -1], [0, -1], [1, -1],
];

const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function hexToRgb(hex) {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const rgba = (rgb, a) =>
  `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;

function readColors() {
  const cs = getComputedStyle(document.documentElement);
  const get = (n, f) => cs.getPropertyValue(n).trim() || f;

  return {
    bg: hexToRgb(get("--wb-bg", "#11151b")),
    line: hexToRgb(get("--wb-line", "#4a6b8a")),
    accent: hexToRgb(get("--wb-accent", "#ffb347")),
  };
}

/* ---------- Part shapes ---------- */

function gearPath(ctx, r, teeth) {
  const inner = r * 0.78;
  const step = (Math.PI * 2) / teeth;

  ctx.beginPath();

  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts = [
      [inner, a - step * 0.25],
      [r, a - step * 0.14],
      [r, a + step * 0.14],
      [inner, a + step * 0.25],
    ];

    pts.forEach(([rad, ang], j) => {
      const x = Math.cos(ang) * rad;
      const y = Math.sin(ang) * rad;

      if (i === 0 && j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
  }

  ctx.closePath();
}

function drawPart(ctx, p) {
  const r = p.size / 2;

  switch (p.type) {
    case "gear":
      gearPath(ctx, r, p.teeth);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
      ctx.setLineDash([3, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      break;

    case "nut":
      ctx.beginPath();

      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      break;

    case "screw":
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-r * 0.5, 0);
      ctx.lineTo(r * 0.5, 0);
      ctx.moveTo(0, -r * 0.5);
      ctx.lineTo(0, r * 0.5);
      ctx.stroke();
      break;

    case "chip": {
      const s = r * 0.8;

      ctx.strokeRect(-s, -s, s * 2, s * 2);
      ctx.strokeRect(-s * 0.45, -s * 0.45, s * 0.9, s * 0.9);

      ctx.beginPath();

      for (let i = -2; i <= 2; i++) {
        const o = (i * s) / 2.6;

        ctx.moveTo(o, -s);
        ctx.lineTo(o, -s - r * 0.3);

        ctx.moveTo(o, s);
        ctx.lineTo(o, s + r * 0.3);

        ctx.moveTo(-s, o);
        ctx.lineTo(-s - r * 0.3, o);

        ctx.moveTo(s, o);
        ctx.lineTo(s + r * 0.3, o);
      }

      ctx.stroke();
      break;
    }

    default:
      break;
  }
}

/* ---------- Main component ---------- */

export default function WorkbenchBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let last = performance.now();

    let colors = readColors();
    let traces = [];
    let parts = [];
    let sparks = [];

    const gridCanvas = document.createElement("canvas");
    const hlCanvas = document.createElement("canvas");

    const mouse = {
      x: -9999,
      y: -9999,
      sx: 0,
      sy: 0,
      active: false,
      lx: 0,
      ly: 0,
    };

    const R = 280;

    function buildGrid() {
      gridCanvas.width = Math.floor(w * dpr);
      gridCanvas.height = Math.floor(h * dpr);

      const g = gridCanvas.getContext("2d");
      g.scale(dpr, dpr);
      g.clearRect(0, 0, w, h);

      for (let x = 0; x <= w; x += GRID) {
        const major = x % (GRID * 5) === 0;

        g.strokeStyle = rgba(colors.line, major ? 0.55 : 0.28);
        g.lineWidth = major ? 1 : 0.5;

        g.beginPath();
        g.moveTo(x + 0.5, 0);
        g.lineTo(x + 0.5, h);
        g.stroke();
      }

      for (let y = 0; y <= h; y += GRID) {
        const major = y % (GRID * 5) === 0;

        g.strokeStyle = rgba(colors.line, major ? 0.55 : 0.28);
        g.lineWidth = major ? 1 : 0.5;

        g.beginPath();
        g.moveTo(0, y + 0.5);
        g.lineTo(w, y + 0.5);
        g.stroke();
      }

      hlCanvas.width = Math.floor(R * 2 * dpr);
      hlCanvas.height = Math.floor(R * 2 * dpr);
    }

    function makeTrace() {
      const snap = (v) => Math.round(v / GRID) * GRID;

      let x = snap(rand(0, w));
      let y = snap(rand(0, h));
      let d = randInt(0, 3) * 2;

      const pts = [[x, y]];
      const n = randInt(4, 8);

      for (let i = 0; i < n; i++) {
        d = (d + (Math.random() < 0.5 ? 1 : -1) + 8) % 8;

        const len = randInt(2, 7) * GRID;

        x += WHEEL[d][0] * len;
        y += WHEEL[d][1] * len;

        pts.push([x, y]);

        if (Math.random() < 0.4) {
          d = (d + (Math.random() < 0.5 ? 1 : -1) + 8) % 8;
        }
      }

      const seg = [];
      let total = 0;

      for (let i = 0; i < pts.length - 1; i++) {
        const l = Math.hypot(
          pts[i + 1][0] - pts[i][0],
          pts[i + 1][1] - pts[i][1]
        );

        seg.push(l);
        total += l;
      }

      return {
        pts,
        seg,
        total,
        pos: Math.random() * total,
        speed: rand(70, 160),
        pulseOn: Math.random() < 0.8,
      };
    }

    function pointAt(tr, dist) {
      let i = 0;
      let d = dist;

      while (i < tr.seg.length - 1 && d > tr.seg[i]) {
        d -= tr.seg[i];
        i++;
      }

      const a = tr.pts[i];
      const b = tr.pts[i + 1];
      const t = clamp(d / tr.seg[i], 0, 1);

      return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
      ];
    }

    function makeParts() {
      const count = clamp(Math.round((w * h) / 110000), 8, 20);
      const types = ["gear", "gear", "nut", "screw", "chip"];

      return Array.from({ length: count }, () => {
        const depth = rand(0.3, 1);

        return {
          type: types[randInt(0, types.length - 1)],
          x: rand(0, w),
          y: rand(0, h),
          size: rand(30, 90) * (0.6 + depth * 0.6),
          depth,
          rot: rand(0, Math.PI * 2),
          rotSpeed: rand(-0.25, 0.25),
          vx: rand(-4, 4),
          vy: rand(-3, 3),
          teeth: randInt(8, 14),
        };
      });
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      w = window.innerWidth;
      h = window.innerHeight;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);

      canvas.style.width = w + "px";
      canvas.style.height = h + "px";

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      colors = readColors();
      buildGrid();

      const tCount = clamp(Math.round((w * h) / 80000), 10, 30);

      traces = Array.from({ length: tCount }, makeTrace);
      parts = makeParts();

      mouse.sx = w / 2;
      mouse.sy = h / 2;
    }

    function spawnSparks(x, y, amount) {
      for (let i = 0; i < amount; i++) {
        const a = rand(0, Math.PI * 2);
        const s = rand(40, 190);

        sparks.push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 40,
          life: 0,
          max: rand(0.4, 0.9),
        });
      }

      if (sparks.length > 160) {
        sparks.splice(0, sparks.length - 160);
      }
    }

    function onMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      if (!mouse.active) {
        mouse.active = true;
        mouse.sx = e.clientX;
        mouse.sy = e.clientY;
        mouse.lx = e.clientX;
        mouse.ly = e.clientY;
      }

      if (
        Math.hypot(
          e.clientX - mouse.lx,
          e.clientY - mouse.ly
        ) > 28
      ) {
        spawnSparks(e.clientX, e.clientY, 2);

        mouse.lx = e.clientX;
        mouse.ly = e.clientY;
      }
    }

    function onLeave() {
      mouse.active = false;
    }

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const motion = reduceMotion ? 0 : 1;

      // Smooth cursor movement
      const tx = mouse.active ? mouse.x : w / 2;
      const ty = mouse.active ? mouse.y : h / 2;

      mouse.sx += (tx - mouse.sx) * 0.08;
      mouse.sy += (ty - mouse.sy) * 0.08;

      const px = (mouse.sx - w / 2) / w;
      const py = (mouse.sy - h / 2) / h;

      // Background
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = rgba(colors.bg, 1);
      ctx.fillRect(0, 0, w, h);

      // Base blueprint grid
      ctx.globalAlpha = 0.18;
      ctx.drawImage(gridCanvas, 0, 0, w, h);
      ctx.globalAlpha = 1;

      // Grid spotlight around cursor
      if (mouse.active) {
        const hl = hlCanvas.getContext("2d");
        const S = R * 2;

        const sx = clamp(
          mouse.sx - R,
          0,
          Math.max(0, w - S)
        );

        const sy = clamp(
          mouse.sy - R,
          0,
          Math.max(0, h - S)
        );

        hl.setTransform(1, 0, 0, 1, 0, 0);
        hl.globalCompositeOperation = "source-over";

        hl.clearRect(
          0,
          0,
          hlCanvas.width,
          hlCanvas.height
        );

        hl.drawImage(
          gridCanvas,
          sx * dpr,
          sy * dpr,
          S * dpr,
          S * dpr,
          0,
          0,
          hlCanvas.width,
          hlCanvas.height
        );

        hl.globalCompositeOperation = "destination-in";

        const cx = (mouse.sx - sx) * dpr;
        const cy = (mouse.sy - sy) * dpr;

        const grad = hl.createRadialGradient(
          cx, cy, 0,
          cx, cy, R * dpr
        );

        grad.addColorStop(0, "rgba(255,255,255,1)");
        grad.addColorStop(1, "rgba(255,255,255,0)");

        hl.fillStyle = grad;
        hl.fillRect(
          0,
          0,
          hlCanvas.width,
          hlCanvas.height
        );

        ctx.drawImage(hlCanvas, sx, sy, S, S);

        // Warm cursor glow
        const glow = ctx.createRadialGradient(
          mouse.sx, mouse.sy, 0,
          mouse.sx, mouse.sy, R
        );

        glow.addColorStop(
          0,
          rgba(colors.accent, 0.09)
        );

        glow.addColorStop(
          1,
          rgba(colors.accent, 0)
        );

        ctx.fillStyle = glow;
        ctx.fillRect(
          mouse.sx - R,
          mouse.sy - R,
          R * 2,
          R * 2
        );
      }

      // Circuit traces and moving electrical pulses
      ctx.save();
      ctx.translate(-px * 14, -py * 14);

      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      for (const tr of traces) {
        ctx.strokeStyle = rgba(colors.line, 0.16

        );
        ctx.lineWidth = 1.5;

        ctx.beginPath();

        tr.pts.forEach(([x, y], i) =>
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
        );

        ctx.stroke();

        // Solder pads at both ends
        for (const [x, y] of [
          tr.pts[0],
          tr.pts[tr.pts.length - 1],
        ]) {
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (tr.pulseOn) {
          tr.pos =
            (tr.pos + tr.speed * dt * motion) % tr.total;

          for (let k = 0; k < 8; k++) {
            const [x, y] = pointAt(
              tr,
              (tr.pos - k * 7 + tr.total) % tr.total
            );

            ctx.beginPath();

            ctx.fillStyle = rgba(
              colors.accent,
              0.85 * (1 - k / 8)
            );

            ctx.arc(
              x,
              y,
              2.6 * (1 - k / 12),
              0,
              Math.PI * 2
            );

            ctx.fill();
          }

          const [hx, hy] = pointAt(tr, tr.pos);

          const g = ctx.createRadialGradient(
            hx, hy, 0,
            hx, hy, 16
          );

          g.addColorStop(
            0,
            rgba(colors.accent, 0.45)
          );

          g.addColorStop(
            1,
            rgba(colors.accent, 0)
          );

          ctx.fillStyle = g;
          ctx.fillRect(hx - 16, hy - 16, 32, 32);
        }
      }

      ctx.restore();

      // Floating mechanical parts
      ctx.lineWidth = 1.2;

      for (const p of parts) {
        p.x += p.vx * dt * motion;
        p.y += p.vy * dt * motion;
        p.rot += p.rotSpeed * dt * motion;

        const m = p.size;

        if (p.x < -m) p.x = w + m;
        if (p.x > w + m) p.x = -m;
        if (p.y < -m) p.y = h + m;
        if (p.y > h + m) p.y = -m;

        ctx.save();

        ctx.translate(
          p.x - px * 60 * p.depth,
          p.y - py * 60 * p.depth
        );

        ctx.rotate(p.rot);

        const near = mouse.active
          ? clamp(
              1 -
                Math.hypot(
                  p.x - mouse.sx,
                  p.y - mouse.sy
                ) / 260,
              0,
              1
            )
          : 0;

        ctx.strokeStyle =
          near > 0.05
            ? rgba(
                colors.accent,
                0.25 + near * 0.6
              )
            : rgba(
                colors.line,
                0.12 + p.depth * 0.12
              );

        drawPart(ctx, p);
        ctx.restore();
      }

      // Sparks emitted by cursor movement
      ctx.globalCompositeOperation = "lighter";

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];

        s.life += dt;

        if (s.life > s.max) {
          sparks.splice(i, 1);
          continue;
        }

        s.vy += 380 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        const a = 1 - s.life / s.max;

        ctx.strokeStyle = rgba(colors.accent, a);
        ctx.lineWidth = 1.6;

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);

        ctx.lineTo(
          s.x - s.vx * 0.03,
          s.y - s.vy * 0.03
        );

        ctx.stroke();
      }

      ctx.globalCompositeOperation = "source-over";

      // Vignette
      const v = ctx.createRadialGradient(
        w / 2,
        h / 2,
        Math.min(w, h) * 0.35,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.75
      );

      v.addColorStop(0, rgba(colors.bg, 0));
      v.addColorStop(1, rgba(colors.bg, 0.85));

      ctx.fillStyle = v;
      ctx.fillRect(0, 0, w, h);

      if (!reduceMotion) {
        raf = requestAnimationFrame(frame);
      }
    }

    resize();
    raf = requestAnimationFrame(frame);

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);

      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);

      document.removeEventListener(
        "pointerleave",
        onLeave
      );
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
  position: "fixed",
  inset: 0,
  width: "100%",
  height: "100%",
  zIndex: 0,
  pointerEvents: "none",
  display: "block",
}}
    />
  );
}
