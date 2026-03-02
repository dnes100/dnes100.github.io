---
layout: post
title: "Car Racing - classic lane game"
date: 2026-03-02
categories: games
---
<div style="min-width:220px;" markdown="1">
**How to play**
- You drive forward; opponent cars come toward you from the top.
- <span style="display:inline-block;padding:0 6px;margin:0 2px;background:#e0e0e0;border-radius:4px;font-weight:bold;">←</span> / <span style="display:inline-block;padding:0 6px;margin:0 2px;background:#e0e0e0;border-radius:4px;font-weight:bold;">→</span> (or A / D) to switch lanes. Overtake by staying in a different lane.
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

  constructor(options = {}) {
    const canvasId = options.canvasId || 'racing-canvas';
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.width = CarRacingGame.WIDTH;
    this.height = CarRacingGame.HEIGHT;
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

  start() {
    if (!this.init()) return;
    this.drawBackground();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const game = new CarRacingGame({ canvasId: 'racing-canvas' });
  game.start();
});
</script>
