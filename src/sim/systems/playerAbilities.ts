import { damageEnemy, spawnProjectile } from '../spawn';
import type { World } from '../types';

export const DASH_COOLDOWN = 2.5;
export const PULSE_RADIUS = 135;

/** 조준선 방향으로 직접 쏘는 기본 공격. */
export function shoot(world: World): void {
  const p = world.player;
  if (p.shotCooldown > 0) return;
  const before = world.projectiles.count;
  spawnProjectile(world, world.data.weaponIndex[world.data.balance.startingWeapon], p.x, p.y,
    p.faceX * 310, p.faceY * 310, 4, 12 * p.stats.damage, 0, 1.15);
  if (world.projectiles.count === before) return;
  p.shotCooldown = 0.28;
  world.events.push({ t: 'fire', weapon: 'manual', x: p.x, y: p.y });
}

/** 짧은 무적 회피. 이동 입력이 없으면 바라보는 쪽으로 피한다. */
export function dash(world: World): void {
  const p = world.player;
  if (p.dashCooldown > 0) return;
  const moving = Math.hypot(p.moveX, p.moveY) > 0.01;
  const x = moving ? p.moveX : p.faceX;
  const y = moving ? p.moveY : p.faceY;
  const length = Math.hypot(x, y) || 1;
  p.dashX = x / length;
  p.dashY = y / length;
  p.dashTime = 0.2;
  p.dashCooldown = DASH_COOLDOWN;
  p.invuln = Math.max(p.invuln, 0.25);
  world.events.push({ t: 'dash', x: p.x, y: p.y });
}

/** 처치로 충전한 빛을 터뜨려 주변 적에게 피해와 밀쳐내기를 준다. */
export function pulse(world: World): void {
  const { player: p, enemies: e } = world;
  if (p.pulseCharge < 100) return;
  p.pulseCharge = 0;
  for (let i = 0; i < e.count; i++) {
    if (e.hp[i] <= 0) continue;
    const dx = e.x[i] - p.x, dy = e.y[i] - p.y;
    if (Math.hypot(dx, dy) <= PULSE_RADIUS + e.r[i])
      damageEnemy(world, i, (35 + p.level * 4) * p.stats.damage, dx, dy, 28);
  }
  world.events.push({ t: 'pulse', x: p.x, y: p.y, radius: PULSE_RADIUS });
}
