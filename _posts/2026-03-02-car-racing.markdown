---
layout: post
title: "Car Racing - classic lane game"
date: 2026-03-02
categories: games
---
<div style="min-width:220px;" markdown="1">
**How to play**
- You drive forward; opponent cars come toward you from the top.
- <span style="display:inline-block;padding:0 6px;margin:0 2px;background:#e0e0e0;border-radius:4px;font-weight:bold;">←</span> / <span style="display:inline-block;padding:0 6px;margin:0 2px;background:#e0e0e0;border-radius:4px;font-weight:bold;">→</span> (or A / D) to switch lanes. <span style="display:inline-block;padding:0 6px;margin:0 2px;background:#e0e0e0;border-radius:4px;font-weight:bold;">↑</span> / <span style="display:inline-block;padding:0 6px;margin:0 2px;background:#e0e0e0;border-radius:4px;font-weight:bold;">↓</span> (or W / S) to change gear (0–5). <span style="display:inline-block;padding:0 6px;margin:0 2px;background:#e0e0e0;border-radius:4px;font-weight:bold;">Space</span> to pause/resume. Overtake by staying in a different lane.
- Avoid collisions — same lane + overlap = crash. Tap the left/right buttons on mobile; use +/− for gear.
</div>

<div id="racing-container">
  <canvas id="racing-canvas"></canvas>
  <div id="racing-touch-controls" aria-label="Steer and gear">
    <button type="button" class="racing-btn" id="racing-btn-left" aria-label="Steer left">←</button>
    <button type="button" class="racing-btn" id="racing-btn-pause" aria-label="Pause">‖</button>
    <button type="button" class="racing-btn" id="racing-btn-right" aria-label="Steer right">→</button>
  </div>
  <div id="racing-gear-controls" aria-label="Change gear">
    <button type="button" class="racing-btn" id="racing-btn-gear-down" aria-label="Gear down">−</button>
    <span id="racing-gear-display" aria-live="polite">0</span>
    <button type="button" class="racing-btn" id="racing-btn-gear-up" aria-label="Gear up">+</button>
  </div>
</div>

<style>
#racing-container { max-width: 100%; touch-action: none; -webkit-user-select: none; user-select: none; }
#racing-canvas {
  display: block;
  width: 100%;
  max-width: 300px;
  height: auto;
  margin: 0 auto;
  touch-action: none;
}
#racing-touch-controls,
#racing-gear-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}
#racing-gear-controls .racing-btn { flex: 1; max-width: 80px; }
#racing-gear-display {
  min-width: 2ch;
  text-align: center;
  font-weight: bold;
  font-size: 20px;
  color: #e0e0e0;
}
.racing-btn {
  min-height: 52px;
  font-size: 24px;
  font-weight: bold;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: #2d2d44;
  color: #e0e0e0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: background 0.1s ease;
}
.racing-btn.pressed { background: #3d3d5c; }
.racing-btn:active { background: #3d3d5c; }
#racing-touch-controls .racing-btn { flex: 1; }
#racing-btn-pause { flex: 0 0 52px; }
</style>

<script>
class CarRacingGame {
  static WIDTH = 300;
  static HEIGHT = 480;
  static LANES = 3;
  static PLAYER_SPEED = 500; // pixels per second when holding left/right
  static BASE_SPEED = 120;   // road/opponent speed at gear 0
  static GEAR_MAX = 5;
  static SPEED_PER_GEAR = 40; // gameSpeed = BASE_SPEED + gear * SPEED_PER_GEAR
  static SPAWN_INTERVAL_BASE = 2;   // seconds between spawns at gear 0
  static SPAWN_INTERVAL_MIN = 0.25; // minimum seconds between spawns at high gear
  static MIN_SPAWN_GAP = 100;       // min pixels between new spawn (y=0) and topmost opponent — safe lane change
  static DT_MAX = 0.1;       // cap dt when tab was in background
  static CRASH_DURATION = 0.45;
  static PIXELS_PER_KM = 10000;
  static SPEED_KMH_AT_GEAR_0 = 15;
  static SPEED_KMH_AT_GEAR_MAX = 100;
  static _gameSpeedMax() { return CarRacingGame.BASE_SPEED + (CarRacingGame.GEAR_MAX - 1) * CarRacingGame.SPEED_PER_GEAR; }

  constructor(options = {}) {
    const canvasId = options.canvasId || 'racing-canvas';
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.width = CarRacingGame.WIDTH;
    this.height = CarRacingGame.HEIGHT;
    this.laneWidth = this.width / CarRacingGame.LANES;
    this._carW = this.laneWidth * 0.55;
    this._carH = 80;
    this._laneCanvas = null; // offscreen canvas for lanes, drawn once
    this._gearDisplayEl = null;
    this._animationId = null;
    this.state = 'menu'; // 'menu' | 'playing' | 'paused' | 'crashing' | 'gameover'
    this._crashStartTime = null;
    this._crashOpponent = null;
    this._crashPieces = null;
    this._boundKeydown = null;
    this._boundClick = null;
    this._boundTouchStart = null;
    this._boundGameKeydown = null;
    this._boundGameKeyup = null;
    this._touchHandlers = null;
    this.player = null; // { x } — no lane; position only
    this._keys = { left: false, right: false };
    this.opponents = [];  // { lane, y } — move down, remove when off bottom
    this.gear = 0;       // 0–5, controls gameSpeed
    this.gameSpeed = CarRacingGame.BASE_SPEED;
    this._spawnAccum = 0;
    this._distancePixels = 0;
  }

  _applyGear() {
    this.gear = Math.max(0, Math.min(CarRacingGame.GEAR_MAX, this.gear));
    this.gameSpeed = this.gear === 0 ? 0 : CarRacingGame.BASE_SPEED + (this.gear - 1) * CarRacingGame.SPEED_PER_GEAR;
    if (!this._gearDisplayEl) this._gearDisplayEl = document.getElementById('racing-gear-display');
    if (this._gearDisplayEl) this._gearDisplayEl.textContent = this.gear;
  }

  _getSpeedAndDistanceKm() {
    const distanceKm = this._distancePixels / CarRacingGame.PIXELS_PER_KM;
    if (this.gear === 0) return { speedKmh: 0, distanceKm };
    const gMin = CarRacingGame.BASE_SPEED;
    const gMax = CarRacingGame._gameSpeedMax();
    const kmhMin = CarRacingGame.SPEED_KMH_AT_GEAR_0;
    const kmhMax = CarRacingGame.SPEED_KMH_AT_GEAR_MAX;
    const speedKmh = kmhMin + (this.gameSpeed - gMin) / (gMax - gMin) * (kmhMax - kmhMin);
    return { speedKmh, distanceKm };
  }

  _drawTopHud() {
    const { speedKmh, distanceKm } = this._getSpeedAndDistanceKm();
    const pad = 10;
    const lineH = 18;
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.width, lineH + pad * 2);
    this.ctx.fillStyle = '#e0e0e0';
    this.ctx.font = 'bold 14px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(`${Math.round(speedKmh)} km/h  |  ${distanceKm.toFixed(2)} km`, pad, pad);
    this.ctx.restore();
  }

  _laneCenter(lane) {
    return (lane + 0.5) * this.laneWidth;
  }

  _playerXBounds() {
    const halfCar = this._carW / 2;
    return { min: halfCar, max: this.width - halfCar };
  }

  _playerLane() {
    return Math.min(CarRacingGame.LANES - 1, Math.max(0, Math.floor(this.player.x / this.laneWidth)));
  }

  _createCrashPieces() {
    const o = this._crashOpponent;
    if (!this.player || !o) return;
    const cx = this._laneCenter(o.lane);
    const playerTop = this.height - this._carH - 24;
    const cy = (playerTop + o.y + this._carH) / 2;
    const pieces = [];
    const colors = ['#eab308', '#e09900', '#f87171', '#ea580c', '#1a1a2e'];
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = this._carW * (0.3 + Math.random() * 0.8);
      const speed = 80 + Math.random() * 120;
      pieces.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        w: 6 + Math.random() * 14,
        h: 4 + Math.random() * 10,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed
      });
    }
    this._crashPieces = pieces;
  }

  _checkCollisions() {
    const playerLane = this._playerLane();
    const playerTop = this.height - this._carH - 24;
    const playerBottom = this.height - 24;
    for (const o of this.opponents) {
      if (o.lane !== playerLane) continue;
      const oBottom = o.y + this._carH;
      if (playerBottom >= o.y && playerTop <= oBottom) {
        this.state = 'crashing';
        this._crashStartTime = performance.now();
        this._crashOpponent = o;
        this._createCrashPieces();
        return;
      }
    }
  }

  _drawLanesToBuffer() {
    if (!this.ctx || this._laneCanvas) return;
    this._laneCanvas = document.createElement('canvas');
    this._laneCanvas.width = this.width;
    this._laneCanvas.height = this.height;
    const ctx = this._laneCanvas.getContext('2d');
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 12]);
    for (let i = 1; i < CarRacingGame.LANES; i++) {
      const x = i * this.laneWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
  }

  init() {
    if (!this.canvas || !this.ctx) return false;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this._drawLanesToBuffer();
    return true;
  }

  drawBackground() {
    // Dark road background
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawLanes() {
    if (this._laneCanvas) {
      this.ctx.drawImage(this._laneCanvas, 0, 0);
      return;
    }
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([12, 12]);
    for (let i = 1; i < CarRacingGame.LANES; i++) {
      const x = i * this.laneWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    this.ctx.setLineDash([]);
  }

  _drawHeadlightCone(cx, baseY) {
    const coneLength = this._carH * 2;
    const topY = Math.max(0, baseY - coneLength);
    const baseHalfW = this._carW * 0.42;
    const topHalfW = this._carW * 1.1;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - baseHalfW, baseY);
    this.ctx.lineTo(cx + baseHalfW, baseY);
    this.ctx.lineTo(cx + topHalfW, topY);
    this.ctx.lineTo(cx - topHalfW, topY);
    this.ctx.closePath();
    const grad = this.ctx.createLinearGradient(cx, baseY, cx, topY);
    grad.addColorStop(0, 'rgba(255, 252, 230, 0.4)');
    grad.addColorStop(0.25, 'rgba(255, 248, 200, 0.22)');
    grad.addColorStop(0.55, 'rgba(255, 245, 180, 0.08)');
    grad.addColorStop(1, 'rgba(255, 240, 200, 0)');
    this.ctx.fillStyle = grad;
    this.ctx.fill();
  }

  drawHeadlightGlow() {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';
    if (this.player) {
      const carTop = this.height - this._carH - 24;
      this._drawHeadlightCone(this.player.x, carTop);
    }
    this.opponents.forEach((o) => {
      this._drawHeadlightCone(this._laneCenter(o.lane), o.y);
    });
    this.ctx.restore();
  }

  update(dt) {
    if (!this.player) return;
    const cappedDt = Math.min(dt, CarRacingGame.DT_MAX);
    const { min, max } = this._playerXBounds();
    if (this._keys.left) this.player.x -= CarRacingGame.PLAYER_SPEED * cappedDt;
    if (this._keys.right) this.player.x += CarRacingGame.PLAYER_SPEED * cappedDt;
    this.player.x = Math.max(min, Math.min(max, this.player.x));

    if (this.state !== 'playing') return;
    this._distancePixels += this.gameSpeed * cappedDt;
    this.opponents.forEach((o) => { o.y += this.gameSpeed * cappedDt; });
    for (let i = this.opponents.length - 1; i >= 0; i--) {
      if (this.opponents[i].y >= this.height + this._carH) this.opponents.splice(i, 1);
    }

    this._checkCollisions();
    if (this.state === 'gameover') return;

    const spawnInterval = Math.max(CarRacingGame.SPAWN_INTERVAL_MIN,
      CarRacingGame.SPAWN_INTERVAL_BASE - (CarRacingGame.SPAWN_INTERVAL_BASE - CarRacingGame.SPAWN_INTERVAL_MIN) * this.gear / CarRacingGame.GEAR_MAX);
    this._spawnAccum += cappedDt;
    if (this._spawnAccum >= spawnInterval) {
      const topmostY = this.opponents.length ? Math.min(...this.opponents.map((o) => o.y)) : Infinity;
      const gapOk = this.opponents.length === 0 || topmostY >= CarRacingGame.MIN_SPAWN_GAP;
      if (gapOk) {
        this._spawnAccum -= spawnInterval;
        const lane = Math.floor(Math.random() * CarRacingGame.LANES);
        this.opponents.push({ lane, y: -this._carH });
      }
    }
  }

  _drawTopViewCar(cx, top, w, h, bodyColor, strokeColor, accentColor, facingUp = true) {
    const left = cx - w / 2;
    const thick = 2.5;
    const taper = w * 0.1;
    const cornerR = 8;
    const frontW = w - 2 * taper;
    const rearW = w - 2 * taper;
    const fl = cx - frontW / 2;
    const fr = cx + frontW / 2;
    const rl = cx - rearW / 2;
    const rr = cx + rearW / 2;
    const t = top;
    const b = top + h;
    const frontBulge = Math.min(w * 0.18, h * 0.22);
    const rearBulge = frontBulge;
    // Body: front and rear bulge outward (semicircular curve), rounded corners
    this.ctx.beginPath();
    this.ctx.moveTo(fl + cornerR, t);
    this.ctx.quadraticCurveTo(cx, t - frontBulge, fr - cornerR, t);
    this.ctx.quadraticCurveTo(fr, t, fr, t + cornerR);
    this.ctx.lineTo(rr, b - cornerR);
    this.ctx.quadraticCurveTo(rr, b, rr - cornerR, b);
    this.ctx.quadraticCurveTo(cx, b + rearBulge, rl + cornerR, b);
    this.ctx.quadraticCurveTo(rl, b, rl, b - cornerR);
    this.ctx.lineTo(fl, t + cornerR);
    this.ctx.quadraticCurveTo(fl, t, fl + cornerR, t);
    this.ctx.closePath();
    this.ctx.fillStyle = bodyColor;
    this.ctx.fill();
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = thick;
    this.ctx.stroke();
    const winW = w * 0.5;
    const winH = h * 0.26;
    const winLeft = cx - winW / 2;
    const winR = 6;
    const fwt = facingUp ? top + h * 0.08 : top + h - winH - h * 0.08;
    const rwt = facingUp ? top + h - winH - h * 0.08 : top + h * 0.08;
    // Front windshield — solid medium blue, D-shape, black outline
    this.ctx.fillStyle = '#5b9bd5';
    this.ctx.beginPath();
    this.ctx.roundRect(winLeft, fwt, winW, winH, winR);
    this.ctx.fill();
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = thick;
    this.ctx.stroke();
    // Rear window — solid medium blue, slightly smaller
    this.ctx.fillStyle = '#5b9bd5';
    this.ctx.beginPath();
    this.ctx.roundRect(winLeft, rwt, winW * 0.9, winH, winR);
    this.ctx.fill();
    this.ctx.stroke();
    // Side mirrors — thin strips, accent color, aligned with driver (front) seat
    const mirrorW = w * 0.04;
    const mirrorH = h * 0.18;
    const mirrorY = top + h * 0.2;
    this.ctx.fillStyle = accentColor;
    this.ctx.strokeStyle = strokeColor;
    this.ctx.fillRect(left - mirrorW * 0.8, mirrorY, mirrorW, mirrorH);
    this.ctx.strokeRect(left - mirrorW * 0.8, mirrorY, mirrorW, mirrorH);
    this.ctx.fillRect(left + w - mirrorW * 0.2, mirrorY, mirrorW, mirrorH);
    this.ctx.strokeRect(left + w - mirrorW * 0.2, mirrorY, mirrorW, mirrorH);
    // Headlights — two short thick black diagonals at front (top when facingUp)
    const headY = facingUp ? top : top + h - h * 0.18;
    this.ctx.fillStyle = strokeColor;
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    if (facingUp) {
      this.ctx.moveTo(cx - w * 0.26, headY + h * 0.06);
      this.ctx.lineTo(cx - w * 0.06, headY + h * 0.02);
      this.ctx.moveTo(cx + w * 0.06, headY + h * 0.02);
      this.ctx.lineTo(cx + w * 0.26, headY + h * 0.06);
    } else {
      this.ctx.moveTo(cx - w * 0.26, headY + h * 0.12);
      this.ctx.lineTo(cx - w * 0.06, headY + h * 0.16);
      this.ctx.moveTo(cx + w * 0.06, headY + h * 0.16);
      this.ctx.lineTo(cx + w * 0.26, headY + h * 0.12);
    }
    this.ctx.stroke();
  }

  drawPlayer(offsetX = 0, offsetY = 0) {
    if (!this.player) return;
    const w = this._carW;
    const h = this._carH;
    const y = this.height - h - 24;
    const cx = this.player.x;
    if (offsetX !== 0 || offsetY !== 0) {
      this.ctx.save();
      this.ctx.translate(offsetX, offsetY);
    }
    this._drawTopViewCar(cx, y, w, h, '#eab308', '#000', '#e09900', true);
    if (offsetX !== 0 || offsetY !== 0) this.ctx.restore();
  }

  drawOpponent(o, offsetX = 0, offsetY = 0) {
    const w = this._carW;
    const h = this._carH;
    const cx = this._laneCenter(o.lane);
    const y = o.y;
    if (offsetX !== 0 || offsetY !== 0) {
      this.ctx.save();
      this.ctx.translate(offsetX, offsetY);
    }
    this._drawTopViewCar(cx, y, w, h, '#f87171', '#000', '#ea580c', true);
    if (offsetX !== 0 || offsetY !== 0) this.ctx.restore();
  }

  draw() {
    let crashProgress = 0;
    let crashJitterX = 0;
    let crashJitterY = 0;
    if (this.state === 'crashing' && this._crashStartTime != null) {
      const elapsed = (performance.now() - this._crashStartTime) / 1000;
      crashProgress = Math.min(1, elapsed / CarRacingGame.CRASH_DURATION);
      const intensity = 6 * (1 - crashProgress);
      crashJitterX = (Math.random() - 0.5) * 2 * intensity;
      crashJitterY = (Math.random() - 0.5) * 2 * intensity;
    }
    this.drawBackground();
    this.drawLanes();
    this._drawTopHud();
    this.drawHeadlightGlow();
    this.opponents.forEach((o) => {
      const jx = (this.state === 'crashing' && o === this._crashOpponent) ? crashJitterX : 0;
      const jy = (this.state === 'crashing' && o === this._crashOpponent) ? crashJitterY : 0;
      this.drawOpponent(o, jx, jy);
    });
    if (this.player) {
      const jx = this.state === 'crashing' ? -crashJitterX : 0;
      const jy = this.state === 'crashing' ? -crashJitterY : 0;
      this.drawPlayer(jx, jy);
    }
    if ((this.state === 'crashing' || this.state === 'gameover') && this._crashPieces) {
      this._crashPieces.forEach((p) => {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
        this.ctx.restore();
      });
    }
    if (this.state === 'crashing') {
      this.ctx.fillStyle = `rgba(220, 50, 50, ${0.35 * (1 - crashProgress)})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
    if (this.state === 'menu') {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '18px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Press any key or tap to start', this.width / 2, this.height / 2);
    }
    if (this.state === 'paused') {
      this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '22px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Paused', this.width / 2, this.height / 2 - 12);
      this.ctx.font = '14px sans-serif';
      this.ctx.fillText('Press Space to resume', this.width / 2, this.height / 2 + 16);
    }
    if (this.state === 'gameover') {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = '#f87171';
      this.ctx.font = '24px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Crash!', this.width / 2, this.height / 2 - 20);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '14px sans-serif';
      this.ctx.fillText('Press any key or tap to play again', this.width / 2, this.height / 2 + 16);
    }
  }

  _tick(prevTime = 0) {
    const now = performance.now();
    const dt = prevTime ? Math.min((now - prevTime) / 1000, CarRacingGame.DT_MAX) : 0;
    if (this.state === 'playing') this.update(dt);
    if (this.state === 'crashing') {
      if (this._crashPieces) {
        this._crashPieces.forEach((p) => {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rotation += p.rotSpeed * dt;
        });
      }
      if (this._crashStartTime != null) {
        const elapsed = (now - this._crashStartTime) / 1000;
        if (elapsed >= CarRacingGame.CRASH_DURATION) {
          this.state = 'gameover';
          this._bindStartListener();
        }
      }
    }
    this.draw();
    if (this.state === 'playing' || this.state === 'crashing') {
      this._animationId = requestAnimationFrame(() => this._tick(now));
    }
  }

  _onStart() {
    if (this.state !== 'menu' && this.state !== 'gameover') return;
    this.state = 'playing';
    this.player.x = this.width / 2;
    this._keys.left = false;
    this._keys.right = false;
    this.opponents = [];
    this._crashPieces = null;
    this._distancePixels = 0;
    this.gear = 1;
    this._applyGear();
    this._spawnAccum = 0;
    this._unbindStartListener();
    this._bindGameKeys();
    this._tick();
  }

  _bindGameKeys() {
    this._boundGameKeydown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.state === 'playing') {
          this.state = 'paused';
          this.draw(); // show pause overlay (loop has stopped)
        } else if (this.state === 'paused') {
          this.state = 'playing';
          this._tick();
        }
      }
      if (this.state !== 'playing' && this.state !== 'paused') return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        this._keys.left = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        this._keys.right = true;
      }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        this.gear = Math.min(CarRacingGame.GEAR_MAX, this.gear + 1);
        this._applyGear();
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        this.gear = Math.max(0, this.gear - 1);
        this._applyGear();
      }
    };
    this._boundGameKeyup = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this._keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this._keys.right = false;
    };
    document.addEventListener('keydown', this._boundGameKeydown);
    document.addEventListener('keyup', this._boundGameKeyup);

  }

  _unbindGameKeys() {
    if (this._boundGameKeydown) {
      document.removeEventListener('keydown', this._boundGameKeydown);
      this._boundGameKeydown = null;
    }
    if (this._boundGameKeyup) {
      document.removeEventListener('keyup', this._boundGameKeyup);
      this._boundGameKeyup = null;
    }
    const t = this._touchHandlers;
    if (t && t.btnPause) {
      t.btnPause.removeEventListener('click', t.onPause);
      this._touchHandlers = null;
    }
  }

  _bindTouchControls() {
    const btnLeft = document.getElementById('racing-btn-left');
    const btnRight = document.getElementById('racing-btn-right');
    if (!btnLeft || !btnRight) return;
    const prevent = (e) => e.preventDefault();
    const addPressedFeedback = (el) => {
      if (!el) return;
      const addP = () => el.classList.add('pressed');
      const removeP = () => el.classList.remove('pressed');
      el.addEventListener('touchstart', addP, { passive: true });
      el.addEventListener('touchend', removeP); el.addEventListener('touchcancel', removeP);
      el.addEventListener('mousedown', addP);
      el.addEventListener('mouseup', removeP); el.addEventListener('mouseleave', removeP);
    };
    addPressedFeedback(btnLeft); addPressedFeedback(btnRight);
    const btnPause = document.getElementById('racing-btn-pause');
    addPressedFeedback(btnPause);
    if (btnPause) {
      btnPause.addEventListener('click', (e) => {
        if (e.cancelable) e.preventDefault();
        if (this.state === 'menu' || this.state === 'gameover') this._onStart();
        else if (this.state === 'playing') { this.state = 'paused'; this.draw(); }
        else if (this.state === 'paused') { this.state = 'playing'; this._tick(); }
      });
    }
    const btnGearUp = document.getElementById('racing-btn-gear-up');
    const btnGearDown = document.getElementById('racing-btn-gear-down');
    addPressedFeedback(btnGearUp); addPressedFeedback(btnGearDown);
    if (btnGearUp) {
      const onGearUp = (e) => {
        if (e.cancelable) e.preventDefault();
        if (this.state !== 'playing' && this.state !== 'paused') return;
        this.gear = Math.min(CarRacingGame.GEAR_MAX, this.gear + 1);
        this._applyGear();
      };
      btnGearUp.addEventListener('click', onGearUp);
    }
    if (btnGearDown) {
      const onGearDown = (e) => {
        if (e.cancelable) e.preventDefault();
        if (this.state !== 'playing' && this.state !== 'paused') return;
        this.gear = Math.max(0, this.gear - 1);
        this._applyGear();
      };
      btnGearDown.addEventListener('click', onGearDown);
    }
    const onLeftDown = (e) => {
      prevent(e);
      if (this.state === 'menu' || this.state === 'gameover') this._onStart();
      else this._keys.left = true;
    };
    const onLeftUp = () => { this._keys.left = false; };
    const onRightDown = (e) => {
      prevent(e);
      if (this.state === 'menu' || this.state === 'gameover') this._onStart();
      else this._keys.right = true;
    };
    const onRightUp = () => { this._keys.right = false; };
    btnLeft.addEventListener('touchstart', onLeftDown); btnLeft.addEventListener('touchend', onLeftUp); btnLeft.addEventListener('touchcancel', onLeftUp);
    btnLeft.addEventListener('mousedown', onLeftDown); btnLeft.addEventListener('mouseup', onLeftUp); btnLeft.addEventListener('mouseleave', onLeftUp);
    btnRight.addEventListener('touchstart', onRightDown); btnRight.addEventListener('touchend', onRightUp); btnRight.addEventListener('touchcancel', onRightUp);
    btnRight.addEventListener('mousedown', onRightDown); btnRight.addEventListener('mouseup', onRightUp); btnRight.addEventListener('mouseleave', onRightUp);
  }

  _bindStartListener() {
    this._boundKeydown = (e) => {
      e.preventDefault();
      this._onStart();
    };
    this._boundClick = () => this._onStart();
    this._boundTouchStart = (e) => {
      e.preventDefault();
      this._onStart();
    };
    document.addEventListener('keydown', this._boundKeydown);
    this.canvas.addEventListener('click', this._boundClick);
    this.canvas.addEventListener('touchstart', this._boundTouchStart, { passive: false });
  }

  _unbindStartListener() {
    if (this._boundKeydown) {
      document.removeEventListener('keydown', this._boundKeydown);
      this._boundKeydown = null;
    }
    if (this._boundClick) {
      this.canvas.removeEventListener('click', this._boundClick);
      this._boundClick = null;
    }
    if (this._boundTouchStart) {
      this.canvas.removeEventListener('touchstart', this._boundTouchStart);
      this._boundTouchStart = null;
    }
  }

  start() {
    if (!this.init()) return;
    this.state = 'menu';
    this.player = { x: this.width / 2 };
    this.gear = 0;
    this._applyGear();
    this._bindStartListener();
    this._bindTouchControls();
    this.draw();
  }

  stop() {
    if (this._animationId != null) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const game = new CarRacingGame({ canvasId: 'racing-canvas' });
  game.start();
});
</script>
