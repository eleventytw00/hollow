export function makeMaze(floor = 1) {
  const size = 15;
  const cells = Array.from({ length: size }, () => Array(size).fill(1));
  let seed = (floor * 104729 + 1907) >>> 0;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const stack = [[1, 1]];
  cells[1][1] = 0;
  while (stack.length) {
    const [x, y] = stack.at(-1);
    const directions = [[2, 0], [-2, 0], [0, 2], [0, -2]].sort(() => random() - 0.5);
    const next = directions.find(([dx, dy]) => x + dx > 0 && x + dx < size - 1 && y + dy > 0 && y + dy < size - 1 && cells[y + dy][x + dx] === 1);
    if (!next) { stack.pop(); continue; }
    const [dx, dy] = next;
    cells[y + dy / 2][x + dx / 2] = 0;
    cells[y + dy][x + dx] = 0;
    stack.push([x + dx, y + dy]);
  }
  return cells;
}

export function attachExplorer(canvas, { onAttack = () => {}, onLockChange = () => {} } = {}) {
  const ctx = canvas.getContext('2d');
  let map = makeMaze();
  let floor = 1;
  let px = 1.5, py = 1.5, angle = 0, pulse = 0;
  let width = 640, height = 270, lastFrame = 0;
  const keys = new Set();
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  const isLocked = () => document.pointerLockElement === canvas;
  const lock = () => {
    try { const request = canvas.requestPointerLock(); request?.catch?.(() => onLockChange(false)); }
    catch { onLockChange(false); }
  };
  const wallAt = (x, y) => map[y]?.[x] !== 0;
  const setFloor = (nextFloor) => { floor = nextFloor; map = makeMaze(floor); px = 1.5; py = 1.5; angle = 0; };
  const onClick = () => lock();
  const onMouseMove = (event) => { if (isLocked()) angle += event.movementX * 0.0028; };
  const onPointerChange = () => { keys.clear(); onLockChange(isLocked()); };
  const onPointerError = () => onLockChange(false);
  const onKeyDown = (event) => {
    if (!isLocked()) return;
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    if (key.startsWith('arrow')) { if (key === 'arrowleft') angle -= 0.08; if (key === 'arrowright') angle += 0.08; return; }
    if (['w', 'a', 's', 'd'].includes(key)) keys.add(key);
    if (key === 'e' && !event.repeat) { event.preventDefault(); pulse = 1; onAttack(); }
  };
  const onKeyUp = (event) => keys.delete(event.key.toLowerCase());
  const onBlur = () => keys.clear();
  function update(dt) {
    if (!isLocked()) return;
    const forward = (keys.has('w') ? 1 : 0) - (keys.has('s') ? 1 : 0);
    const side = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0);
    if (!forward && !side) return;
    const length = Math.hypot(forward, side) || 1;
    const speed = 2.7 * dt / length;
    const dx = (Math.cos(angle) * forward + Math.cos(angle + Math.PI / 2) * side) * speed;
    const dy = (Math.sin(angle) * forward + Math.sin(angle + Math.PI / 2) * side) * speed;
    if (!wallAt(Math.floor(px + dx + Math.sign(dx) * 0.19), Math.floor(py))) px += dx;
    if (!wallAt(Math.floor(px), Math.floor(py + dy + Math.sign(dy) * 0.19))) py += dy;
  }
  function render(time = 0) {
    const dt = Math.min((time - lastFrame) / 1000 || 0, 0.04); lastFrame = time;
    update(dt); resizeIfNeeded();
    ctx.fillStyle = '#19181f'; ctx.fillRect(0, 0, width, height / 2);
    const floorGradient = ctx.createLinearGradient(0, height / 2, 0, height);
    floorGradient.addColorStop(0, '#242027'); floorGradient.addColorStop(1, '#111014');
    ctx.fillStyle = floorGradient; ctx.fillRect(0, height / 2, width, height / 2);
    const rays = Math.max(110, Math.floor(width / 3.5));
    const slice = width / rays;
    const fov = Math.PI / 3;
    for (let i = 0; i < rays; i++) {
      const rayAngle = angle - fov / 2 + ((i + 0.5) / rays) * fov;
      const rayX = Math.cos(rayAngle), rayY = Math.sin(rayAngle);
      let mx = Math.floor(px), my = Math.floor(py);
      const deltaX = Math.abs(1 / (rayX || 0.00001)), deltaY = Math.abs(1 / (rayY || 0.00001));
      const stepX = rayX < 0 ? -1 : 1, stepY = rayY < 0 ? -1 : 1;
      let sideX = (rayX < 0 ? px - mx : mx + 1 - px) * deltaX;
      let sideY = (rayY < 0 ? py - my : my + 1 - py) * deltaY;
      let side = 0, steps = 0;
      while (steps++ < 64 && !wallAt(mx, my)) {
        if (sideX < sideY) { sideX += deltaX; mx += stepX; side = 0; }
        else { sideY += deltaY; my += stepY; side = 1; }
      }
      let distance = side === 0 ? sideX - deltaX : sideY - deltaY;
      distance = Math.max(0.15, distance * Math.cos(rayAngle - angle));
      const wallHeight = Math.min(height * 1.8, height * 0.84 / distance);
      const top = (height - wallHeight) / 2;
      const shade = Math.max(0.16, 1 - distance / 10) * (side ? 0.72 : 1);
      const variation = ((mx * 5 + my * 3 + floor) % 3) * 2;
      ctx.fillStyle = `rgb(${Math.round((72 + variation) * shade)},${Math.round(64 * shade)},${Math.round((76 + variation) * shade)})`;
      ctx.fillRect(i * slice, top, slice + 1, wallHeight);
      if (distance < 5) { ctx.fillStyle = `rgba(210,156,117,${(1 - distance / 5) * 0.16})`; ctx.fillRect(i * slice, top, slice + 1, 1); }
    }
    for (let n = 1; n < 6; n++) {
      const y = height / 2 + (height / 2) * (n / 6) ** 1.65;
      ctx.strokeStyle = `rgba(213,167,136,${0.11 - n * 0.012})`; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    ctx.fillStyle = `rgba(225,174,134,${0.58 + pulse * 0.38})`;
    ctx.beginPath(); ctx.arc(width / 2, height / 2, 2.2 + pulse * 5, 0, Math.PI * 2); ctx.fill();
    pulse = Math.max(0, pulse - dt * 2.5);
    requestAnimationFrame(render);
  }
  let previousWidth = 0, previousHeight = 0;
  function resizeIfNeeded() {
    const rect = canvas.getBoundingClientRect();
    if (Math.abs(rect.width - previousWidth) > 1 || Math.abs(rect.height - previousHeight) > 1) { previousWidth = rect.width; previousHeight = rect.height; resize(); }
  }
  canvas.addEventListener('click', onClick);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('pointerlockchange', onPointerChange);
  document.addEventListener('pointerlockerror', onPointerError);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  resize(); requestAnimationFrame(render);
  return { requestLock: lock, setFloor, isLocked, unlock: () => { if (isLocked()) document.exitPointerLock(); } };
}
