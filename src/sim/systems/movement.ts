import { DT, type World } from '../types';

export function movement(world: World): void {
  const p = world.player;
  p.px = p.x;
  p.py = p.y;
  const dashing = p.dashTime > 0;
  p.x += (dashing ? p.dashX * 3.6 : p.moveX) * p.stats.moveSpeed * DT;
  p.y += (dashing ? p.dashY * 3.6 : p.moveY) * p.stats.moveSpeed * DT;
  p.dashTime = Math.max(0, p.dashTime - DT);
  p.dashCooldown = Math.max(0, p.dashCooldown - DT);
  p.shotCooldown = Math.max(0, p.shotCooldown - DT);
  p.comboTime = Math.max(0, p.comboTime - DT);
  if (p.comboTime === 0) p.combo = 0;
  if (p.invuln > 0) p.invuln -= DT;

  const e = world.enemies;
  for (let i = 0; i < e.count; i++) {
    e.px[i] = e.x[i];
    e.py[i] = e.y[i];
    e.x[i] += e.vx[i] * DT;
    e.y[i] += e.vy[i] * DT;
  }
}
