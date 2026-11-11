import { describe, expect, it } from 'vitest';
import { loadGameData } from '../../src/data';
import { TICK_RATE, createWorld, step, type SimEvent } from '../../src/sim';
import { createPool } from '../../src/sim/pool';
import { spawnEnemy } from '../../src/sim/spawn';
import { stage } from '../../src/sim/systems/stage';

/** 구간을 2초로 줄인 데이터로 한 판의 진행(구간 전환 → 미니보스 → 보스 → 클리어)을 확인한다. */
function shortRunData() {
  const data = loadGameData();
  for (const s of data.stages.stages) {
    s.duration = 2;
    if (s.miniboss) s.miniboss.at = 1;
  }
  return data;
}

describe('stage', () => {
  it('미니보스도 생성에 실패한 뒤 빈 공간이 생기면 다시 등장한다', () => {
    const data = shortRunData();
    const world = createWorld(data, 11);
    world.enemies = createPool(1);
    spawnEnemy(world, 0, 0, 0);
    world.stage.time = data.stages.stages[0].miniboss!.at;

    stage(world);
    expect(world.stage.minibossSpawned).toBe(false);
    world.enemies.count = 0;
    stage(world);
    expect(world.stage.minibossSpawned).toBe(true);
    expect(world.events).toContainEqual({ t: 'bossSpawn', id: world.enemies.id[0], miniboss: true });
  });

  it('적 공간이 가득 차 보스 생성에 실패하면 공간이 생긴 다음 다시 시도한다', () => {
    const data = shortRunData();
    const world = createWorld(data, 11);
    world.enemies = createPool(1);
    spawnEnemy(world, 0, 0, 0);
    world.stage.index = data.stages.stages.length - 1;
    world.stage.time = data.stages.stages[world.stage.index].duration;
    world.stage.minibossSpawned = true;

    stage(world);
    expect(world.stage.bossSpawned).toBe(false);
    expect(world.events.some((event) => event.t === 'bossSpawn')).toBe(false);
    world.enemies.count = 0;
    stage(world);
    expect(world.stage.bossSpawned).toBe(true);
    expect(world.stage.bossId).toBe(world.enemies.id[0]);
    expect(world.events).toContainEqual({ t: 'bossSpawn', id: world.stage.bossId, miniboss: false });
  });
  it('구간이 순서대로 넘어가고, 마지막에 보스가 나오며, 보스를 잡으면 클리어한다', () => {
    const data = shortRunData();
    const world = createWorld(data, 11);
    const events: SimEvent[] = [];
    const run = (ticks: number) => {
      for (let i = 0; i < ticks && !world.over; i++) {
        world.player.hp = world.player.stats.maxHp; // 진행만 보려고 죽지 않게 한다
        step(world, world.pendingChoices ? [{ t: 'choose', index: 0 }] : []);
        events.push(...world.events);
      }
    };

    run(TICK_RATE * 7);
    const stageCount = data.stages.stages.length;
    expect(events.filter((e) => e.t === 'stageStart').map((e) => e.t === 'stageStart' && e.index)).toEqual([1, 2]);
    expect(events.filter((e) => e.t === 'bossSpawn' && e.miniboss).length).toBe(stageCount);
    expect(world.stage.bossSpawned).toBe(true);
    expect(world.over).toBe(false);

    // 보스를 찾아 쓰러뜨린다
    const e = world.enemies;
    let found = false;
    for (let i = 0; i < e.count; i++) {
      if (e.id[i] === world.stage.bossId) {
        e.hp[i] = 0;
        found = true;
      }
    }
    expect(found).toBe(true);
    run(1);
    expect(world.over).toBe(true);
    expect(world.stats.victory).toBe(true);
    expect(events.some((ev) => ev.t === 'runEnd' && ev.victory)).toBe(true);
  });
});
