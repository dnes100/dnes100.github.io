---
layout: post
title: "Car Racing - classic lane game"
date: 2026-03-02
categories: games
---
<div style="min-width:220px;" markdown="1">
**How to play**
- You drive forward; opponent cars come toward you from the top.
- <span style="display:inline-block;padding:0 6px;margin:0 2px;background:#e0e0e0;border-radius:4px;font-weight:bold;">←</span> / <span style="display:inline-block;padding:0 6px;margin:0 2px;background:#e0e0e0;border-radius:4px;font-weight:bold;">→</span> (or A / D) to switch lanes. <span style="display:inline-block;padding:0 6px;margin:0 2px;background:#e0e0e0;border-radius:4px;font-weight:bold;">Space</span> to pause/resume. Overtake by staying in a different lane.
- Speed increases over time. Avoid collisions — same lane + overlap = crash.
- Tap the left/right buttons on mobile.
</div>

<div id="racing-container">
  <canvas id="racing-canvas"></canvas>
</div>

<style>
#racing-container { max-width: 100%; }
#racing-canvas {
  display: block;
  width: 100%;
  max-width: 300px;
  height: auto;
  margin: 0 auto;
}
</style>

<script>
class CarRacingGame {
  static WIDTH = 300;
  static HEIGHT = 480;
  static LANES = 3;
  static PLAYER_SPEED = 500; // pixels per second when holding left/right
  static BASE_SPEED = 120;   // road/opponent speed (pixels per second), increases over time
  static SPAWN_INTERVAL = 2; // seconds between opponent spawns

  constructor(options = {}) {
    const canvasId = options.canvasId || 'racing-canvas';
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.width = CarRacingGame.WIDTH;
    this.height = CarRacingGame.HEIGHT;
    this.laneWidth = this.width / CarRacingGame.LANES;
    this._animationId = null;
    this.state = 'menu'; // 'menu' | 'playing' | 'paused' | 'gameover'
    this._boundKeydown = null;
    this._boundClick = null;
    this._boundGameKeydown = null;
    this._boundGameKeyup = null;
    this.player = null; // { x } — no lane; position only
    this._keys = { left: false, right: false };
    this.opponents = [];  // { lane, y } — move down, remove when off bottom
    this.gameSpeed = CarRacingGame.BASE_SPEED;
    this._spawnAccum = 0;
  }

  _laneCenter(lane) {
    return (lane + 0.5) * this.laneWidth;
  }

  _playerXBounds() {
    const halfCar = (this.laneWidth * 0.55) / 2;
    return { min: halfCar, max: this.width - halfCar };
  }

  init() {
    if (!this.canvas || !this.ctx) return false;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    return true;
  }

  drawBackground() {
    // Dark road background
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawLanes() {
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

  update(dt) {
    if (!this.player) return;
    const { min, max } = this._playerXBounds();
    if (this._keys.left) this.player.x -= CarRacingGame.PLAYER_SPEED * dt;
    if (this._keys.right) this.player.x += CarRacingGame.PLAYER_SPEED * dt;
    this.player.x = Math.max(min, Math.min(max, this.player.x));

    if (this.state !== 'playing') return;
    this.opponents.forEach((o) => { o.y += this.gameSpeed * dt; });
    this.opponents = this.opponents.filter((o) => o.y < this.height + 80);

    this._spawnAccum += dt;
    if (this._spawnAccum >= CarRacingGame.SPAWN_INTERVAL) {
      this._spawnAccum = 0;
      const lane = Math.floor(Math.random() * CarRacingGame.LANES);
      this.opponents.push({ lane, y: -80 });
    }
  }

  drawPlayer() {
    if (!this.player) return;
    const w = this.laneWidth * 0.55;
    const h = 80;
    const y = this.height - h - 24;
    const cx = this.player.x;
    // Top-down car: wider rear, narrower front (nose points up)
    const backW = w;
    const frontW = w * 0.72;
    this.ctx.fillStyle = '#4ade80';
    this.ctx.beginPath();
    this.ctx.moveTo(cx - backW / 2, y + h);
    this.ctx.lineTo(cx + backW / 2, y + h);
    this.ctx.lineTo(cx + frontW / 2, y);
    this.ctx.lineTo(cx - frontW / 2, y);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.strokeStyle = '#22c55e';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    // Cabin (windshield) hint
    this.ctx.fillStyle = 'rgba(34, 197, 94, 0.5)';
    this.ctx.beginPath();
    this.ctx.moveTo(cx - frontW / 2 + 6, y + 18);
    this.ctx.lineTo(cx + frontW / 2 - 6, y + 18);
    this.ctx.lineTo(cx + frontW / 4, y + 6);
    this.ctx.lineTo(cx - frontW / 4, y + 6);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawOpponent(o) {
    const w = this.laneWidth * 0.55;
    const h = 80;
    const cx = this._laneCenter(o.lane);
    const y = o.y;
    const backW = w * 0.72;
    const frontW = w;
    this.ctx.fillStyle = '#f87171';
    this.ctx.beginPath();
    this.ctx.moveTo(cx - frontW / 2, y + h);
    this.ctx.lineTo(cx + frontW / 2, y + h);
    this.ctx.lineTo(cx + backW / 2, y);
    this.ctx.lineTo(cx - backW / 2, y);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.strokeStyle = '#dc2626';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  draw() {
    this.drawBackground();
    this.drawLanes();
    this.opponents.forEach((o) => this.drawOpponent(o));
    if (this.player) {
      this.drawPlayer();
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
  }

  _tick(prevTime = 0) {
    // performance.now() is monotonic (unaffected by clock changes) and high-resolution for stable dt
    const now = performance.now();
    const dt = prevTime ? (now - prevTime) / 1000 : 0;
    if (this.state === 'playing') this.update(dt);
    this.draw();
    if (this.state === 'playing') {
      // Pass this frame's start time so next frame can compute dt correctly (rAF callback receives current frame time, not previous)
      this._animationId = requestAnimationFrame(() => this._tick(now));
    }
  }

  _onStart() {
    if (this.state !== 'menu') return;
    this.state = 'playing';
    this.player.x = this.width / 2;
    this._keys.left = false;
    this._keys.right = false;
    this.opponents = [];
    this.gameSpeed = CarRacingGame.BASE_SPEED;
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
  }

  _bindStartListener() {
    this._boundKeydown = (e) => {
      e.preventDefault();
      this._onStart();
    };
    this._boundClick = () => this._onStart();
    document.addEventListener('keydown', this._boundKeydown);
    this.canvas.addEventListener('click', this._boundClick);
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
  }

  start() {
    if (!this.init()) return;
    this.state = 'menu';
    this.player = { x: this.width / 2 };
    this._bindStartListener();
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
