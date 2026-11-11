import { describe, expect, it } from 'vitest';
import { loadGameData } from '../../src/data';
import { createWorld, step } from '../../src/sim';
import { spawnEnemy } from '../../src/sim/spawn';

function setup() {
  const data = structuredClone(loadGameData());
  for (const stage of data.stages.stages) {
    stage.waves = [];
    stage.miniboss = undefined;
  }
  const world = createWorld(data, 3);
  world.player.weapons = [];
  return world;
}

describe('active abilities', () => {
  it('직접 발사는 바라보는 방향으로 날아가고 연속 입력의 발사 속도는 제한된다', () => {
    const w = setup();
    step(w, [{ t: 'look', x: 0, y: -1 }, { t: 'attack' }]);
    expect(w.projectiles.count).toBe(1);
    expect(w.projectiles.vy[0]).toBeLessThan(0);
    for (let i = 0; i < 3; i++) step(w, [{ t: 'attack' }]);
    expect(w.projectiles.count).toBe(1);
    for (let i = 0; i < 7; i++) step(w, [{ t: 'attack' }]);
    expect(w.projectiles.count).toBe(2);
  });

  it('적을 처치하면 빛 폭발을 충전하고 100을 넘지 않는다', () => {
    const w = setup();
    w.player.pulseCharge = 95;
    spawnEnemy(w, w.data.enemyIndex.slime_green, 100, 0);
    w.enemies.hp[0] = 0;
    step(w, []);
    expect(w.player.pulseCharge).toBe(100);
  });
  it('회피는 이동 방향으로 빠르게 움직이고 무적을 주며 재사용 대기 중에는 발동하지 않는다', () => {
    const w = setup();
    spawnEnemy(w, w.data.enemyIndex.slime_green, 0, 0);
    const hp = w.player.hp;
    step(w, [{ t: 'move', x: 1, y: 0 }, { t: 'dash' }]);
    expect(w.player.x).toBeGreaterThan(w.player.stats.moveSpeed / 30 * 3);
    expect(w.player.hp).toBe(hp);
    expect(w.events.some((e) => e.t === 'dash')).toBe(true);
    step(w, [{ t: 'dash' }]);
    expect(w.events.some((e) => e.t === 'dash')).toBe(false);
  });

  it('처치로 충전한 빛은 주변 적에게만 피해를 주고 사용 후 충전량을 소모한다', () => {
    const w = setup();
    const kind = w.data.enemyIndex.golem_stone;
    spawnEnemy(w, kind, 60, 0);
    spawnEnemy(w, kind, 300, 0);
    const hp = w.enemies.hp[0];
    w.player.pulseCharge = 100;
    step(w, [{ t: 'pulse' }]);
    expect(w.enemies.hp[0]).toBeLessThan(hp);
    expect(w.enemies.hp[1]).toBe(hp);
    expect(w.player.pulseCharge).toBe(0);
    expect(w.events.some((e) => e.t === 'pulse')).toBe(true);
  });

  it('일시정지나 선택 중에는 기술을 쓰거나 재사용 시간이 흐르지 않는다', () => {
    const w = setup();
    step(w, [{ t: 'dash' }]);
    step(w, [{ t: 'pause' }]);
    const cooldown = w.player.dashCooldown;
    w.player.pulseCharge = 100;
    step(w, [{ t: 'dash' }, { t: 'pulse' }]);
    expect(w.player.dashCooldown).toBe(cooldown);
    expect(w.player.pulseCharge).toBe(100);
  });
});
