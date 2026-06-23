import { useEffect, useRef } from 'react';

/**
 * LoginCanvasAnimation
 *
 * A live pharmaceutical supply-network animation representing a regional supply chain.
 *
 * Design spec:
 *  - 15 hubs placed via grid-jitter to fill the panel without clustering.
 *  - Hubs represent specific supply chain nodes: Ports, Depots, and Warehouses.
 *  - Subtle text labels (e.g., DJI, ADD, EPSS, MOH) next to hubs in light grey.
 *  - 2 critical hubs representing dwelling alert zones (e.g., >90d delay) with red pulsing rings.
 *  - Cargo indicators (e.g. "PO-1029") floating next to moving comets.
 *  - Staggered active routes (reduced to 6 for a cleaner, elegant layout).
 *  - Live telemetry/activity pings (e.g. "PO-404 Cleared", "EPSS Dispatch") floating up from hubs.
 *  - Faint breathing dot grid as background texture.
 *
 * Stacking: canvas z-index 0, form wrapper z-index 10 (Login.jsx).
 */
function LoginCanvasAnimation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let w = 0, h = 0;

    // ─── helpers ──────────────────────────────────────────────────────────────
    const rand    = (a, b) => Math.random() * (b - a) + a;
    const randInt = (a, b) => Math.floor(rand(a, b + 1));
    const lerp    = (a, b, t) => a + (b - a) * t;
    const clamp   = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    // ─── hub definitions ──────────────────────────────────────────────────────
    const hubDefinitions = [
      // Left Column (rx: 0.08 to 0.22)
      { name: 'Djibouti Port', label: 'DJI', type: 'port', rx: 0.08, ry: 0.15, critical: false },
      { name: 'Dire Dawa', label: 'DIRD', type: 'facility', rx: 0.22, ry: 0.40, critical: false },
      { name: 'Bahir Dar', label: 'BAHR', type: 'facility', rx: 0.08, ry: 0.65, critical: false },
      { name: 'Gondar Hub', label: 'GOND', type: 'facility', rx: 0.20, ry: 0.88, critical: false },

      // Right Column (rx: 0.76 to 0.90)
      { name: 'EPSS Central', label: 'EPSS', type: 'depot', rx: 0.78, ry: 0.12, critical: false },
      { name: 'MOH Central', label: 'MOH', type: 'depot', rx: 0.90, ry: 0.38, critical: false },
      { name: 'Awasa Hub', label: 'AWAS', type: 'facility', rx: 0.76, ry: 0.65, critical: true, alarm: '>90d' },
      { name: 'Mekelle Hub', label: 'MEK', type: 'facility', rx: 0.90, ry: 0.88, critical: true, alarm: '>60d' }
    ];

    const hubs = hubDefinitions.map(def => ({
      ...def,
      x: 0,
      y: 0,
      r: def.type === 'port' ? 4.5 : (def.type === 'depot' ? 4 : 3),
      pulsePhase: rand(0, Math.PI * 2),
      pulseSpeed: rand(0.001, 0.0025)
    }));

    // ─── resize ───────────────────────────────────────────────────────────────
    const resize = () => {
      const p  = canvas.parentElement;
      w = p.clientWidth;
      h = p.clientHeight;
      canvas.width  = w;
      canvas.height = h;

      // Update absolute positions of hubs on resize
      for (const hub of hubs) {
        hub.x = hub.rx * w;
        hub.y = hub.ry * h;
      }
    };
    window.addEventListener('resize', resize);
    resize();

    // ─── route lifecycle ──────────────────────────────────────────────────────
    const ROUTE_POOL_SIZE = 6;              // clean & elegant (reduced from 16)
    const FADE_DURATION   = 120;
    const HOLD_MIN        = 250;
    const HOLD_MAX        = 600;

    const cargoList = ['PO-1092', 'PO-3042', 'PO-8821', 'PO-4093', 'PO-5511', 'PO-7102', 'PO-9204', 'PO-1130'];

    const makeRoute = () => {
      // Pick two distinct hubs
      const ai = randInt(0, hubs.length - 1);
      let bi   = randInt(0, hubs.length - 1);
      while (bi === ai) bi = randInt(0, hubs.length - 1);
      
      return {
        a:         hubs[ai],
        b:         hubs[bi],
        phase:     'fadein',
        frame:     0,
        holdFor:   randInt(HOLD_MIN, HOLD_MAX),
        alpha:     0,
        comet: {
          t:       rand(0, 1),
          speed:   rand(0.0025, 0.006),
          size:    rand(2.2, 3.2),
          cargo:   cargoList[randInt(0, cargoList.length - 1)],
          trail:   [],
          trailLen: randInt(18, 30),
        },
      };
    };

    let routes = Array.from({ length: ROUTE_POOL_SIZE }, makeRoute);
    // Stagger starting phases
    routes.forEach((rt, i) => {
      const skip = randInt(0, FADE_DURATION + rt.holdFor);
      rt.frame = skip;
      if (skip >= FADE_DURATION + rt.holdFor) {
        rt.phase = 'fadeout';
        rt.frame = skip - FADE_DURATION - rt.holdFor;
      } else if (skip >= FADE_DURATION) {
        rt.phase = 'hold';
        rt.frame = skip - FADE_DURATION;
      }
    });

    // ─── live activity pings ──────────────────────────────────────────────────
    let pings = [];
    let framesToNextPing = 80;

    const pingMessages = [
      { text: 'PO-209 Arrived', color: 'rgba(16, 185, 129, 0.8)' },   // Success
      { text: 'PO-448 Delayed', color: 'rgba(220, 38, 38, 0.8)' },   // Error
      { text: 'PO-801 Cleared', color: 'rgba(16, 185, 129, 0.8)' },   // Success
      { text: 'EPSS Dispatch', color: 'rgba(11, 79, 84, 0.8)' },      // Primary
      { text: 'DJI Port Inbound', color: 'rgba(11, 79, 84, 0.8)' },   // Primary
      { text: 'PO-903 Delayed', color: 'rgba(220, 38, 38, 0.8)' },   // Error
      { text: 'PO-112 Cleared', color: 'rgba(16, 185, 129, 0.8)' },   // Success
      { text: 'MOH Inbound', color: 'rgba(11, 79, 84, 0.8)' },      // Primary
      { text: 'PO-507 Warning', color: 'rgba(217, 119, 6, 0.8)' },    // Warning
      { text: 'PO-702 Delayed', color: 'rgba(220, 38, 38, 0.8)' },   // Error
    ];

    // ─── dot grid ─────────────────────────────────────────────────────────────
    const DOT_SPACING  = 38;
    const dotSpeed     = rand(0.00025, 0.0005);
    const dotAmplitude = rand(0.5, 0.9);
    const dotSizeBase  = rand(0.8, 1.2);

    // ─── draw: background dot grid ────────────────────────────────────────────
    const drawDotGrid = (t) => {
      const cols = Math.ceil(w / DOT_SPACING);
      const rows = Math.ceil(h / DOT_SPACING);
      const ox   = (w - (cols - 1) * DOT_SPACING) / 2;
      const oy   = (h - (rows - 1) * DOT_SPACING) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const bx    = ox + c * DOT_SPACING;
          const by    = oy + r * DOT_SPACING;
          const dx    = Math.sin(t * dotSpeed       + r * 0.31 + c * 0.53) * dotAmplitude;
          const dy    = Math.cos(t * dotSpeed * 0.7 + c * 0.42 + r * 0.64) * dotAmplitude;
          const pulse = Math.sin(t * 0.00045 + r * 0.22 + c * 0.31) * 0.12 + 0.88;
          ctx.beginPath();
          ctx.arc(bx + dx, by + dy, dotSizeBase * pulse, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(11,79,84,${0.045 + pulse * 0.055})`;
          ctx.fill();
        }
      }
    };

    // ─── draw: city hub dots ──────────────────────────────────────────────────
    const drawHubs = (t) => {
      ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
      
      for (const hub of hubs) {
        const ps = Math.sin(t * hub.pulseSpeed + hub.pulsePhase); // -1…1

        // Critical Hub red/orange alarm rings
        if (hub.critical) {
          const alarmR = hub.r * 5.5 + ps * 3.5;
          ctx.beginPath();
          ctx.arc(hub.x, hub.y, alarmR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(220, 38, 38, ${0.12 + ps * 0.06})`;
          ctx.lineWidth   = 1.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(hub.x, hub.y, hub.r * 2.5 + ps * 1.0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(220, 38, 38, ${0.22 + ps * 0.08})`;
          ctx.stroke();
        } else {
          // Standard soft outer ring
          const ringR = hub.r * 4.0 + ps * 2.0;
          ctx.beginPath();
          ctx.arc(hub.x, hub.y, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(11,79,84,${0.06 + ps * 0.03})`;
          ctx.lineWidth   = 1;
          ctx.stroke();
        }

        // Draw specific nodes according to type
        ctx.beginPath();
        if (hub.type === 'port') {
          // Triangle for Ports
          const side = (hub.r + ps * 0.5) * 2;
          const hDiff = (side * Math.sqrt(3)) / 3;
          ctx.moveTo(hub.x, hub.y - hDiff);
          ctx.lineTo(hub.x - side / 2, hub.y + hDiff);
          ctx.lineTo(hub.x + side / 2, hub.y + hDiff);
          ctx.closePath();
        } else if (hub.type === 'depot') {
          // Square for Depots
          const sz = (hub.r + ps * 0.5) * 1.8;
          ctx.rect(hub.x - sz / 2, hub.y - sz / 2, sz, sz);
        } else {
          // Circle for regional hub warehouses
          ctx.arc(hub.x, hub.y, hub.r + ps * 0.5, 0, Math.PI * 2);
        }

        ctx.fillStyle   = hub.critical ? '#DC2626' : '#0B4F54';
        ctx.globalAlpha = hub.critical ? (0.75 + ps * 0.15) : (0.55 + ps * 0.15);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Hub labels with adaptive alignment to prevent edge clipping
        ctx.fillStyle = hub.critical ? 'rgba(220, 38, 38, 0.55)' : 'rgba(11, 79, 84, 0.45)';
        
        let labelText = hub.label;
        if (hub.critical && hub.alarm) {
          labelText += ` (${hub.alarm})`;
        }

        if (hub.x > w - 95) {
          ctx.textAlign = 'right';
          ctx.fillText(labelText, hub.x - hub.r * 3.5, hub.y + 4);
        } else {
          ctx.textAlign = 'left';
          ctx.fillText(labelText, hub.x + hub.r * 3.5, hub.y + 4);
        }
      }
    };

    // ─── tick: advance route lifecycle & update comet trail ───────────────────
    const tickRoutes = () => {
      // Ping generation logic
      framesToNextPing--;
      if (framesToNextPing <= 0) {
        const hub = hubs[randInt(0, hubs.length - 1)];
        const msg = pingMessages[randInt(0, pingMessages.length - 1)];
        
        // Spawn ping
        pings.push({
          x: hub.x,
          y: hub.y - 14,
          text: msg.text,
          color: msg.color,
          life: 140,
          maxLife: 140,
        });
        
        framesToNextPing = randInt(120, 260); // stagger pings
      }

      // Update pings
      pings.forEach((p) => {
        p.life--;
        p.y -= 0.22; // slowly float up
      });
      pings = pings.filter((p) => p.life > 0);

      // Update routes & comets
      for (let i = 0; i < routes.length; i++) {
        const rt = routes[i];
        rt.frame++;

        // ── opacity lifecycle ──
        if (rt.phase === 'fadein') {
          rt.alpha = clamp(rt.frame / FADE_DURATION, 0, 1);
          if (rt.frame >= FADE_DURATION) { rt.phase = 'hold'; rt.frame = 0; }
        } else if (rt.phase === 'hold') {
          rt.alpha = 1;
          if (rt.frame >= rt.holdFor) { rt.phase = 'fadeout'; rt.frame = 0; }
        } else if (rt.phase === 'fadeout') {
          rt.alpha = clamp(1 - rt.frame / FADE_DURATION, 0, 1);
          if (rt.frame >= FADE_DURATION) { rt.phase = 'dead'; }
        } else if (rt.phase === 'dead') {
          if (rt.frame > randInt(40, 100)) routes[i] = makeRoute();
        }

        if (rt.phase === 'dead') continue;

        // ── advance comet ──
        const cm = rt.comet;
        cm.trail.push({ x: lerp(rt.a.x, rt.b.x, cm.t), y: lerp(rt.a.y, rt.b.y, cm.t), age: 0 });
        if (cm.trail.length > cm.trailLen) cm.trail.shift();
        cm.trail.forEach((p) => p.age++);

        cm.t += cm.speed;
        if (cm.t > 1) { cm.t = 0; cm.trail = []; }
      }
    };

    // ─── draw: routes + comets ────────────────────────────────────────────────
    const drawRoutes = () => {
      for (const rt of routes) {
        if (rt.phase === 'dead' || rt.alpha <= 0) continue;

        // ── route line ──
        ctx.beginPath();
        ctx.moveTo(rt.a.x, rt.a.y);
        ctx.lineTo(rt.b.x, rt.b.y);
        ctx.strokeStyle = `rgba(11,79,84,${0.10 * rt.alpha})`;
        ctx.lineWidth   = 1;
        ctx.stroke();

        // ── comet trail ──
        const cm     = rt.comet;
        const tLen   = cm.trail.length;
        if (tLen < 2) continue;

        for (let i = 1; i < tLen; i++) {
          const tp  = cm.trail[i];
          const tFrac = i / tLen;
          const ageAlpha = tFrac * tFrac;
          const baseAlpha = ageAlpha * 0.50 * rt.alpha;

          ctx.beginPath();
          ctx.arc(tp.x, tp.y, cm.size * tFrac * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(11,79,84,${baseAlpha})`;
          ctx.fill();
        }

        // ── comet head ──
        if (tLen > 0) {
          const headX = lerp(rt.a.x, rt.b.x, cm.t);
          const headY = lerp(rt.a.y, rt.b.y, cm.t);

          // Glow
          const gr = cm.size * 6;
          const g  = ctx.createRadialGradient(headX, headY, 0, headX, headY, gr);
          g.addColorStop(0,    `rgba(11,79,84,${0.34 * rt.alpha})`);
          g.addColorStop(0.4,  `rgba(134,191,197,${0.12 * rt.alpha})`);
          g.addColorStop(1,    'rgba(134,191,197,0)');
          ctx.beginPath();
          ctx.arc(headX, headY, gr, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();

          // Solid core
          ctx.beginPath();
          ctx.arc(headX, headY, cm.size * 0.75, 0, Math.PI * 2);
          ctx.fillStyle   = '#0B4F54';
          ctx.globalAlpha = 0.80 * rt.alpha;
          ctx.fill();
          ctx.globalAlpha = 1;

          // Cargo text label moving with the shipment
          ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = `rgba(81, 95, 116, ${0.40 * rt.alpha})`;
          ctx.textAlign = 'center';
          ctx.fillText(cm.cargo, headX, headY - 12);
        }
      }
    };

    // ─── draw: pings ──────────────────────────────────────────────────────────
    const drawPings = () => {
      ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      
      for (const p of pings) {
        const opacity = clamp(p.life / p.maxLife, 0, 1);
        const fadeColor = p.color.replace('0.8', (0.75 * opacity).toFixed(2));
        
        ctx.fillStyle = fadeColor;
        ctx.fillText(p.text, p.x, p.y);
      }
    };

    // ─── draw: radial background wash ────────────────────────────────────────
    const drawWash = () => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.72);
      g.addColorStop(0, 'rgba(11,79,84,0.030)');
      g.addColorStop(1, 'rgba(11,79,84,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    };

    // ─── animation loop ───────────────────────────────────────────────────────
    const loop = (time) => {
      ctx.clearRect(0, 0, w, h);
      drawWash();
      drawDotGrid(time);
      tickRoutes();
      drawRoutes();
      drawHubs(time);
      drawPings();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

export default LoginCanvasAnimation;
