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

  update(_dt) {
    // Game state updates (player, opponents, etc.) go here
  }

  draw() {
    this.drawBackground();
    this.drawLanes();
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
      // requestAnimationFrame syncs with display refresh (e.g. 60fps) and pauses when tab is hidden
      this._animationId = requestAnimationFrame((t) => this._tick(t));
    }
  }

  _onStart() {
    if (this.state !== 'menu') return;
    this.state = 'playing';
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
    };
    document.addEventListener('keydown', this._boundGameKeydown);
  }

  _unbindGameKeys() {
    if (this._boundGameKeydown) {
      document.removeEventListener('keydown', this._boundGameKeydown);
      this._boundGameKeydown = null;
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
