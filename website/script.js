/* ---- Dramatic Cursor Trail ---- */
const canvas = document.getElementById('trail-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const EMOJIS = ['🍆', '🍑', '💦', '🍌', '🫦', '👅', '🔞', '💋'];
const particles = [];

document.addEventListener('mousemove', (e) => {
  if (Math.random() > 0.4) {
    particles.push({
      x: e.clientX,
      y: e.clientY,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      life: 1,
      size: 28 + Math.random() * 20,
      vx: (Math.random() - 0.5) * 2,
      vy: -1 - Math.random() * 2,
    });
  }
});

function drawTrail() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    ctx.globalAlpha = p.life;
    ctx.font = `${p.size}px serif`;
    ctx.fillText(p.emoji, p.x - p.size / 2, p.y);
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.035;
    if (p.life <= 0) particles.splice(i, 1);
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(drawTrail);
}
drawTrail();
