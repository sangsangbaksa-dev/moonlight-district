import { describe, expect, it } from 'vitest';
import { advance, newGame } from '../../src/territory';
import { restoreGame } from '../../src/save';

describe('city save restoration safety', () => {
  it('repairs a wildly overdue income timer instead of replaying millions of ticks', () => {
    const game = newGame();
    game.time = 300;
    game.nextIncome = -1_000_000_000;
    const restored = restoreGame(JSON.stringify(game));
    expect(restored?.nextIncome).toBe(306);
    expect(restored).not.toBeNull();
    advance(restored!, 0.1);
    expect(restored!.time).toBeCloseTo(300.1);
    expect(restored!.nextIncome).toBe(306);
  });

  it('preserves a normal pending economy tick', () => {
    const game = newGame();
    game.time = 5.9;
    game.nextIncome = 6;
    const restored = restoreGame(JSON.stringify(game));
    expect(restored?.nextIncome).toBe(6);
    advance(restored!, 0.2);
    expect(restored!.nextIncome).toBe(12);
  });

  it('drops malformed and long-expired battle effects without losing the city', () => {
    const game = newGame();
    game.battleFx = { tile: -1, attacker: 1, defender: 2, until: 30 };
    expect(restoreGame(JSON.stringify(game))?.battleFx).toBeNull();
    game.battleFx = { tile: 20, attacker: 1, defender: 2, until: 1.5 };
    expect(restoreGame(JSON.stringify(game))?.battleFx).toEqual(game.battleFx);
    game.battleFx.until = 1000000;
    expect(restoreGame(JSON.stringify(game))?.battleFx).toBeNull();
  });

  it('repairs malformed cooldown values and prevents a permanent action lock', () => {
    const game = newGame();
    const raw = JSON.stringify({ ...game, cooldown: 'broken' });
    const restored = restoreGame(raw);
    expect(restored?.cooldown).toBe(0);
    advance(restored!, 0.1);
    expect(Number.isFinite(restored!.cooldown)).toBe(true);
  });
});
