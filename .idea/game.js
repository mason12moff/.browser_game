const W = 480, H = 320;
const cv = document.getElementById("c"), ctx = cv.getContext("2d");
const $ = id => document.getElementById(id);

// ---- State ----
let player, sparks, blocks, score, running = false, last = 0, spawnT = 0, best = 0;
try { best = +localStorage.getItem("sparkdodge-best") || 0; } catch (e) {}
$("best").textContent = "Best " + best;

// ---- Input ----
const keys = {};
let target = null;
addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.startsWith("Arrow") && running) e.preventDefault();
});
addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
function setTarget(e) {
  const r = cv.getBoundingClientRect();
  target = { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}
cv.addEventListener("pointerdown", setTarget);
cv.addEventListener("pointermove", e => { if (e.buttons || e.pointerType === "touch") setTarget(e); });
cv.addEventListener("pointerup", () => target = null);

// ---- Helpers ----
const rand = (a, b) => a + Math.random() * (b - a);
const hit = (a, b) => a.x < b.x + b.s && a.x + a.s > b.x && a.y < b.y + b.s && a.y + a.s > b.y;

function reset() {
  player = { x: W / 2 - 12, y: H / 2 - 12, s: 24, v: 190 };
  sparks = []; blocks = []; score = 0; spawnT = 0;
  for (let i = 0; i < 3; i++) addSpark();
  $("score").textContent = "Score 0";
}
function addSpark() { sparks.push({ x: rand(10, W - 22), y: rand(10, H - 22), s: 12 }); }
function addBlock() {
  const side = Math.floor(rand(0, 4)), s = rand(18, 30), v = rand(50, 90) + score * 3;
  const b = { s };
  if (side === 0) { b.x = -s; b.y = rand(0, H); b.dx = v; b.dy = rand(-30, 30); }
  else if (side === 1) { b.x = W; b.y = rand(0, H); b.dx = -v; b.dy = rand(-30, 30); }
  else if (side === 2) { b.x = rand(0, W); b.y = -s; b.dx = rand(-30, 30); b.dy = v; }
  else { b.x = rand(0, W); b.y = H; b.dx = rand(-30, 30); b.dy = -v; }
  blocks.push(b);
}

// ---- Update: change the state ----
function update(dt) {
  let dx = 0, dy = 0;
  if (keys.arrowleft || keys.a) dx -= 1;
  if (keys.arrowright || keys.d) dx += 1;
  if (keys.arrowup || keys.w) dy -= 1;
  if (keys.arrowdown || keys.s) dy += 1;
  if (target && !dx && !dy) {
    const tx = target.x - player.s / 2 - player.x, ty = target.y - player.s / 2 - player.y;
    const d = Math.hypot(tx, ty);
    if (d > 4) { dx = tx / d; dy = ty / d; }
  }
  const len = Math.hypot(dx, dy) || 1;
  player.x = Math.max(0, Math.min(W - player.s, player.x + dx / len * player.v * dt * (dx || dy ? 1 : 0)));
  player.y = Math.max(0, Math.min(H - player.s, player.y + dy / len * player.v * dt * (dx || dy ? 1 : 0)));

  spawnT += dt;
  if (spawnT > Math.max(0.35, 1.2 - score * 0.04)) { spawnT = 0; addBlock(); }

  for (const b of blocks) { b.x += b.dx * dt; b.y += b.dy * dt; }
  blocks = blocks.filter(b => b.x > -60 && b.x < W + 60 && b.y > -60 && b.y < H + 60);

  sparks = sparks.filter(sp => {
    if (hit(player, sp)) { score++; $("score").textContent = "Score " + score; addSpark(); return false; }
    return true;
  });
  if (blocks.some(b => hit(player, b))) gameOver();
}

// ---- Draw: paint the state ----
function draw() {
  ctx.fillStyle = "#1d1b2e"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#f6c453";
  for (const s of sparks) { ctx.beginPath(); ctx.arc(s.x + 6, s.y + 6, 6, 0, 7); ctx.fill(); }
  ctx.fillStyle = "#e4572e";
  for (const b of blocks) ctx.fillRect(b.x, b.y, b.s, b.s);
  ctx.fillStyle = "#8fe3c8"; ctx.fillRect(player.x, player.y, player.s, player.s);
}

// ---- Loop ----
function loop(t) {
  if (!running) return;
  const dt = Math.min((t - last) / 1000, 0.05);
  last = t;
  update(dt);
  if (running) draw();
  requestAnimationFrame(loop);
}
function startGame() {
  reset(); running = true; last = performance.now();
  $("overlay").hidden = true;
  requestAnimationFrame(loop);
}
function gameOver() {
  running = false;
  if (score > best) {
    best = score; $("best").textContent = "Best " + best;
    try { localStorage.setItem("sparkdodge-best", best); } catch (e) {}
  }
  $("title").textContent = "Game over";
  $("msg").textContent = "You collected " + score + (score === 1 ? " spark." : " sparks.");
  $("start").textContent = "Play again";
  $("overlay").hidden = false;
}
$("start").addEventListener("click", startGame);
reset(); draw();
