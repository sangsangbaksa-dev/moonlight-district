import { describe, expect, it } from 'vitest';
import { loadGameData } from '../../src/data';
import { createWorld, step } from '../../src/sim';

describe('light beacon', () => {
  it('봉화를 찾아가면 한 번만 체력과 경험치, 빛을 얻는다', () => {
    const w = createWorld(loadGameData(), 17);
    w.player.weapons = [];
    w.nextBeaconAt = 0;
    w.player.hp = 20;
    step(w, []);
    const b = w.beacon!;
    expect(b).not.toBeNull();
    const initialXp = w.player.xp;
    w.player.x = b.x;
    w.player.y = b.y;
    step(w, []);
    expect(w.beacon).toBeNull();
    expect(w.player.hp).toBeGreaterThan(20);
    expect(w.player.xp).toBeGreaterThan(initialXp);
    expect(w.player.pulseCharge).toBe(70);
    expect(w.events.some((e) => e.t === 'beaconCollect')).toBe(true);
    step(w, []);
    expect(w.events.some((e) => e.t === 'beaconCollect')).toBe(false);
  });

  it('봉화 시간은 일시정지 중에 흐르지 않고 만료 후에는 보상을 주지 않는다', () => {
    const w = createWorld(loadGameData(), 17);
    w.beacon = { x: 0, y: 0, expiresAt: 1 };
    w.nextBeaconAt = 40;
    step(w, [{ t: 'pause' }]);
    expect(w.beacon).not.toBeNull();
    expect(w.player.pulseCharge).toBe(40);
    w.time = 1;
    step(w, [{ t: 'resume' }]);
    expect(w.beacon).toBeNull();
    expect(w.player.pulseCharge).toBe(40);
  });
});
