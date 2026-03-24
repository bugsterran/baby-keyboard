const POOL_SIZE = 500;
const GRAVITY = 0.12;
const FRICTION = 0.99;

export class ParticleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = new Array(POOL_SIZE);
    this.activeCount = 0;
    this.running = false;

    for (let i = 0; i < POOL_SIZE; i++) {
      this.particles[i] = { alive: false };
    }

    this.resize();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  spawn(x, y, config = {}) {
    const {
      count = 30,
      colors = ['#FF6B6B', '#FFE66D', '#4ECDC4'],
      shapes = ['circle'],
      minSize = 4,
      maxSize = 12,
      speed = 8,
      lifetime = 80,
    } = config;

    for (let i = 0; i < count; i++) {
      const p = this._getParticle();
      if (!p) break;

      const angle = Math.random() * Math.PI * 2;
      const vel = Math.random() * speed + speed * 0.3;

      p.alive = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * vel;
      p.vy = Math.sin(angle) * vel - 2;
      p.size = Math.random() * (maxSize - minSize) + minSize;
      p.color = colors[Math.floor(Math.random() * colors.length)];
      p.shape = shapes[Math.floor(Math.random() * shapes.length)];
      p.life = 0;
      p.maxLife = lifetime + Math.random() * 30;
      p.rotation = Math.random() * Math.PI * 2;
      p.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    if (!this.running) this._startLoop();
  }

  _getParticle() {
    for (let i = 0; i < POOL_SIZE; i++) {
      if (!this.particles[i].alive) return this.particles[i];
    }
    return null;
  }

  _startLoop() {
    this.running = true;
    this._loop();
  }

  _loop = () => {
    if (!this.running) return;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    let aliveCount = 0;

    for (let i = 0; i < POOL_SIZE; i++) {
      const p = this.particles[i];
      if (!p.alive) continue;

      p.life++;
      if (p.life >= p.maxLife) {
        p.alive = false;
        continue;
      }

      p.vy += GRAVITY;
      p.vx *= FRICTION;
      p.vy *= FRICTION;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      const progress = p.life / p.maxLife;
      const opacity = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;

      ctx.save();
      ctx.globalAlpha = Math.max(0, opacity);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'star') {
        this._drawStar(ctx, p.size);
      } else if (p.shape === 'heart') {
        this._drawHeart(ctx, p.size);
      }

      ctx.restore();
      aliveCount++;
    }

    if (aliveCount > 0) {
      requestAnimationFrame(this._loop);
    } else {
      this.running = false;
    }
  };

  _drawStar(ctx, size) {
    const spikes = 5;
    const outerR = size;
    const innerR = size * 0.4;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  _drawHeart(ctx, size) {
    const s = size * 0.6;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.4);
    ctx.bezierCurveTo(-s, -s * 0.4, -s * 0.5, -s * 1.2, 0, -s * 0.6);
    ctx.bezierCurveTo(s * 0.5, -s * 1.2, s, -s * 0.4, 0, s * 0.4);
    ctx.fill();
  }

  destroy() {
    this.running = false;
    for (let i = 0; i < POOL_SIZE; i++) {
      this.particles[i].alive = false;
    }
  }
}
