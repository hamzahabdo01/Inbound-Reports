import { useEffect, useRef } from 'react';

const rand    = (a, b) => Math.random() * (b - a) + a;
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const lerp    = (a, b, t) => a + (b - a) * t;
const clamp   = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const COLORS = {
  primary:   '#0B4F54',
  primaryLt: 'rgba(11,79,84,',
  error:     '#DC2626',
};

const DEFAULT_PROPS = {
  hubs: [
    { name: 'Djibouti Port', label: 'DJI',  type: 'port',     rx: 0.08, ry: 0.15, critical: false },
    { name: 'Dire Dawa',     label: 'DIRD', type: 'facility', rx: 0.22, ry: 0.40, critical: false },
    { name: 'Bahir Dar',     label: 'BAHR', type: 'facility', rx: 0.08, ry: 0.65, critical: false },
    { name: 'Gondar Hub',    label: 'GOND', type: 'facility', rx: 0.20, ry: 0.88, critical: false },
    { name: 'EPSS Central',  label: 'EPSS', type: 'depot',    rx: 0.78, ry: 0.12, critical: false },
    { name: 'MOH Central',   label: 'MOH',  type: 'depot',    rx: 0.90, ry: 0.38, critical: false },
    { name: 'Awasa Hub',      label: 'AWAS', type: 'facility', rx: 0.76, ry: 0.65, critical: true,  alarm: '>90d' },
    { name: 'Mekelle Hub',    label: 'MEK',  type: 'facility', rx: 0.90, ry: 0.88, critical: true,  alarm: '>60d' },
  ],
  primaryColor: COLORS.primary,
  criticalColor: COLORS.error,
  dotGrid: { spacing: 38,  amplitude: null, speed: null,     size: null    },
  routes:  { poolSize: 6, fadeDuration: 120, holdMin: 250, holdMax: 600 },
  comets:  { speedMin: 0.0025, speedMax: 0.006, sizeMin: 2.2, sizeMax: 3.2, trailMin: 18, trailMax: 30 },
  pings:   { minInterval: 120, maxInterval: 260, life: 140, speed: 0.22 },
  labels:  { font: '600 12px "Plus Jakarta Sans", sans-serif', opacity: 0.45 },
  cargoList: ['PO-1092', 'PO-3042', 'PO-8821', 'PO-4093', 'PO-5511', 'PO-7102', 'PO-9204', 'PO-1130'],
  pingMessages: [
    { text: 'PO-209 Arrived',  color: 'rgba(16, 185, 129, 0.8)' },
    { text: 'PO-448 Delayed',  color: 'rgba(220, 38, 38, 0.8)' },
    { text: 'PO-801 Cleared',  color: 'rgba(16, 185, 129, 0.8)' },
    { text: 'EPSS Dispatch',   color: `${COLORS.primaryLt}0.8)` },
    { text: 'DJI Port Inbound',color: `${COLORS.primaryLt}0.8)` },
    { text: 'PO-903 Delayed',  color: 'rgba(220, 38, 38, 0.8)' },
    { text: 'PO-112 Cleared',  color: 'rgba(16, 185, 129, 0.8)' },
    { text: 'MOH Inbound',     color: `${COLORS.primaryLt}0.8)` },
    { text: 'PO-507 Warning',  color: 'rgba(217, 119, 6, 0.8)' },
    { text: 'PO-702 Delayed',  color: 'rgba(220, 38, 38, 0.8)' },
  ],
};

function LoginCanvasAnimation({ config: cfg }: any = {}) {
  const canvasRef = useRef(null);
  const config = { ...DEFAULT_PROPS };
  if (cfg) {
    Object.keys(DEFAULT_PROPS).forEach((k) => {
      if (cfg[k] !== undefined) config[k] = cfg[k];
    });
  }
  const { hubs: hubDefs, primaryColor, criticalColor, dotGrid, routes: routeCfg, comets: cometCfg, pings: pingCfg, labels: labelCfg, cargoList, pingMessages } = config;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let w = 0, h = 0;

    const hubs = hubDefs.map(def => ({
      ...def,
      x: 0, y: 0,
      r: def.type === 'port' ? 4.5 : (def.type === 'depot' ? 4 : 3),
      pulsePhase: rand(0, Math.PI * 2),
      pulseSpeed: rand(0.001, 0.0025),
    }));

    const resize = () => {
      const p = canvas.parentElement;
      w = p.clientWidth;
      h = p.clientHeight;
      canvas.width  = w;
      canvas.height = h;
      hubs.forEach(hub => { hub.x = hub.rx * w; hub.y = hub.ry * h; });
    };
    window.addEventListener('resize', resize);
    resize();

    const { poolSize, fadeDuration, holdMin, holdMax } = routeCfg;
    const { speedMin, speedMax, sizeMin, sizeMax, trailMin, trailMax } = cometCfg;
    const { minInterval, maxInterval, life: pingLife, speed: pingSpeed } = pingCfg;

    const makeRoute = () => {
      const ai = randInt(0, hubs.length - 1);
      let bi = randInt(0, hubs.length - 1);
      while (bi === ai) bi = randInt(0, hubs.length - 1);
      return {
        a: hubs[ai], b: hubs[bi],
        phase: 'fadein', frame: 0,
        holdFor: randInt(holdMin, holdMax),
        alpha: 0,
        comet: {
          t: rand(0, 1), speed: rand(speedMin, speedMax),
          size: rand(sizeMin, sizeMax),
          cargo: cargoList[randInt(0, cargoList.length - 1)],
          trail: [], trailLen: randInt(trailMin, trailMax),
        },
      };
    };

    let routes = Array.from({ length: poolSize }, makeRoute);
    routes.forEach(rt => {
      const skip = randInt(0, fadeDuration + rt.holdFor);
      rt.frame = skip;
      if (skip >= fadeDuration + rt.holdFor) { rt.phase = 'fadeout'; rt.frame = skip - fadeDuration - rt.holdFor; }
      else if (skip >= fadeDuration) { rt.phase = 'hold'; rt.frame = skip - fadeDuration; }
    });

    let pings = [];
    let framesToNextPing = 80;

    const dotSpacing = dotGrid.spacing;
    const dotSpeed   = dotGrid.speed !== null ? dotGrid.speed : rand(0.00025, 0.0005);
    const dotAmp     = dotGrid.amplitude !== null ? dotGrid.amplitude : rand(0.5, 0.9);
    const dotSize    = dotGrid.size !== null ? dotGrid.size : rand(0.8, 1.2);

    const drawDotGrid = (t) => {
      const cols = Math.ceil(w / dotSpacing);
      const rows = Math.ceil(h / dotSpacing);
      const ox = (w - (cols - 1) * dotSpacing) / 2;
      const oy = (h - (rows - 1) * dotSpacing) / 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const bx = ox + c * dotSpacing, by = oy + r * dotSpacing;
          const dx = Math.sin(t * dotSpeed + r * 0.31 + c * 0.53) * dotAmp;
          const dy = Math.cos(t * dotSpeed * 0.7 + c * 0.42 + r * 0.64) * dotAmp;
          const pulse = Math.sin(t * 0.00045 + r * 0.22 + c * 0.31) * 0.12 + 0.88;
          ctx.beginPath();
          ctx.arc(bx + dx, by + dy, dotSize * pulse, 0, Math.PI * 2);
          ctx.fillStyle = `${COLORS.primaryLt}${(0.045 + pulse * 0.055).toFixed(3)})`;
          ctx.fill();
        }
      }
    };

    const drawHubs = (t) => {
      ctx.font = labelCfg.font;
      for (const hub of hubs) {
        const ps = Math.sin(t * hub.pulseSpeed + hub.pulsePhase);
        if (hub.critical) {
          const alarmR = hub.r * 5.5 + ps * 3.5;
          ctx.beginPath(); ctx.arc(hub.x, hub.y, alarmR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(220, 38, 38, ${(0.12 + ps * 0.06).toFixed(3)})`; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.beginPath(); ctx.arc(hub.x, hub.y, hub.r * 2.5 + ps * 1.0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(220, 38, 38, ${(0.22 + ps * 0.08).toFixed(3)})`; ctx.stroke();
        } else {
          const ringR = hub.r * 4.0 + ps * 2.0;
          ctx.beginPath(); ctx.arc(hub.x, hub.y, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = `${COLORS.primaryLt}${(0.06 + ps * 0.03).toFixed(3)})`; ctx.lineWidth = 1; ctx.stroke();
        }
        ctx.beginPath();
        if (hub.type === 'port') {
          const side = (hub.r + ps * 0.5) * 2, hd = (side * Math.sqrt(3)) / 3;
          ctx.moveTo(hub.x, hub.y - hd); ctx.lineTo(hub.x - side / 2, hub.y + hd); ctx.lineTo(hub.x + side / 2, hub.y + hd); ctx.closePath();
        } else if (hub.type === 'depot') {
          const sz = (hub.r + ps * 0.5) * 1.8;
          ctx.rect(hub.x - sz / 2, hub.y - sz / 2, sz, sz);
        } else {
          ctx.arc(hub.x, hub.y, hub.r + ps * 0.5, 0, Math.PI * 2);
        }
        ctx.fillStyle = hub.critical ? criticalColor : primaryColor;
        ctx.globalAlpha = hub.critical ? (0.75 + ps * 0.15) : (0.55 + ps * 0.15);
        ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = hub.critical ? `rgba(220, 38, 38, 0.55)` : `${COLORS.primaryLt}${labelCfg.opacity})`;
        let labelText = hub.label;
        if (hub.critical && hub.alarm) labelText += ` (${hub.alarm})`;
        if (hub.x > w - 95) { ctx.textAlign = 'right'; ctx.fillText(labelText, hub.x - hub.r * 3.5, hub.y + 4); }
        else { ctx.textAlign = 'left'; ctx.fillText(labelText, hub.x + hub.r * 3.5, hub.y + 4); }
      }
    };

    const tickRoutes = () => {
      framesToNextPing--;
      if (framesToNextPing <= 0) {
        const hub = hubs[randInt(0, hubs.length - 1)];
        const msg = pingMessages[randInt(0, pingMessages.length - 1)];
        pings.push({ x: hub.x, y: hub.y - 14, text: msg.text, color: msg.color, life: pingLife, maxLife: pingLife });
        framesToNextPing = randInt(minInterval, maxInterval);
      }
      pings.forEach(p => { p.life--; p.y -= pingSpeed; });
      pings = pings.filter(p => p.life > 0);
      for (let i = 0; i < routes.length; i++) {
        const rt = routes[i]; rt.frame++;
        if (rt.phase === 'fadein') {
          rt.alpha = clamp(rt.frame / fadeDuration, 0, 1);
          if (rt.frame >= fadeDuration) { rt.phase = 'hold'; rt.frame = 0; }
        } else if (rt.phase === 'hold') {
          rt.alpha = 1;
          if (rt.frame >= rt.holdFor) { rt.phase = 'fadeout'; rt.frame = 0; }
        } else if (rt.phase === 'fadeout') {
          rt.alpha = clamp(1 - rt.frame / fadeDuration, 0, 1);
          if (rt.frame >= fadeDuration) rt.phase = 'dead';
        } else if (rt.phase === 'dead') {
          if (rt.frame > randInt(40, 100)) routes[i] = makeRoute();
        }
        if (rt.phase === 'dead') continue;
        const cm = rt.comet;
        cm.trail.push({ x: lerp(rt.a.x, rt.b.x, cm.t), y: lerp(rt.a.y, rt.b.y, cm.t), age: 0 });
        if (cm.trail.length > cm.trailLen) cm.trail.shift();
        cm.trail.forEach(p => p.age++);
        cm.t += cm.speed;
        if (cm.t > 1) { cm.t = 0; cm.trail = []; }
      }
    };

    const drawRoutes = () => {
      for (const rt of routes) {
        if (rt.phase === 'dead' || rt.alpha <= 0) continue;
        ctx.beginPath(); ctx.moveTo(rt.a.x, rt.a.y); ctx.lineTo(rt.b.x, rt.b.y);
        ctx.strokeStyle = `${COLORS.primaryLt}${(0.10 * rt.alpha).toFixed(3)})`; ctx.lineWidth = 1; ctx.stroke();
        const cm = rt.comet, tLen = cm.trail.length;
        if (tLen < 2) continue;
        for (let i = 1; i < tLen; i++) {
          const tp = cm.trail[i], tf = i / tLen;
          ctx.beginPath(); ctx.arc(tp.x, tp.y, cm.size * tf * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = `${COLORS.primaryLt}${(tf * tf * 0.50 * rt.alpha).toFixed(3)})`; ctx.fill();
        }
        if (tLen > 0) {
          const hx = lerp(rt.a.x, rt.b.x, cm.t), hy = lerp(rt.a.y, rt.b.y, cm.t);
          const gr = cm.size * 6, g = ctx.createRadialGradient(hx, hy, 0, hx, hy, gr);
          g.addColorStop(0, `${COLORS.primaryLt}${(0.34 * rt.alpha).toFixed(3)})`);
          g.addColorStop(0.4, `rgba(134,191,197,${(0.12 * rt.alpha).toFixed(3)})`);
          g.addColorStop(1, 'rgba(134,191,197,0)');
          ctx.beginPath(); ctx.arc(hx, hy, gr, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
          ctx.beginPath(); ctx.arc(hx, hy, cm.size * 0.75, 0, Math.PI * 2);
          ctx.fillStyle = '#0B4F54'; ctx.globalAlpha = 0.80 * rt.alpha; ctx.fill(); ctx.globalAlpha = 1;
          ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = `rgba(81,95,116,${(0.40 * rt.alpha).toFixed(3)})`;
          ctx.textAlign = 'center'; ctx.fillText(cm.cargo, hx, hy - 12);
        }
      }
    };

    const drawPings = () => {
      ctx.font = '700 11px "Plus Jakarta Sans", sans-serif'; ctx.textAlign = 'center';
      for (const p of pings) {
        const opacity = clamp(p.life / p.maxLife, 0, 1);
        ctx.fillStyle = p.color.replace('0.8', (0.75 * opacity).toFixed(2));
        ctx.fillText(p.text, p.x, p.y);
      }
    };

    const drawWash = () => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.72);
      g.addColorStop(0, `${COLORS.primaryLt}0.030)`);
      g.addColorStop(1, `${COLORS.primaryLt}0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    };

    const loop = (time) => {
      ctx.clearRect(0, 0, w, h);
      drawWash(); drawDotGrid(time); tickRoutes(); drawRoutes(); drawHubs(time); drawPings();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />;
}

export default LoginCanvasAnimation;
