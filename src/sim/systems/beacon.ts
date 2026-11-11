import { range } from '../rng';
import type { World } from '../types';

/** 주기적으로 등장하는 봉화를 찾아가면 회복과 성장의 기회를 얻는다. */
export function beacon(world: World): void {
  const p = world.player;
  if (world.beacon && world.time >= world.beacon.expiresAt) world.beacon = null;
  if (!world.beacon && world.time >= world.nextBeaconAt) {
    const angle = Math.atan2(p.faceY, p.faceX) + range(world.rng, -0.75, 0.75);
    const distance = range(world.rng, 145, 190);
    world.beacon = {
      x: p.x + Math.cos(angle) * distance,
      y: p.y + Math.sin(angle) * distance,
      expiresAt: world.time + 25,
    };
    world.nextBeaconAt = world.time + 40;
    world.events.push({ t: 'beaconSpawn', x: world.beacon.x, y: world.beacon.y });
  }
  const b = world.beacon;
  if (!b || Math.hypot(b.x - p.x, b.y - p.y) > 18) return;
  p.hp = Math.min(p.stats.maxHp, p.hp + p.stats.maxHp * 0.2);
  p.xp += p.xpToNext * 0.6;
  p.pulseCharge = Math.min(100, p.pulseCharge + 30);
  world.beacon = null;
  world.events.push({ t: 'beaconCollect', x: b.x, y: b.y });
}
