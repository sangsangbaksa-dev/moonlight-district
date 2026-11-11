import { describe, expect, it } from 'vitest';
import { advance, battleQuote, militaryAttack, MILITARY_UNLOCK, newGame, recallBattle, SIZE, START_TILE } from '../../src/territory';
import { restoreGame } from '../../src/save';
function setup() {
  const g=newGame(); for(let i=0;i<MILITARY_UNLOCK-3;i++){g.tiles[i].owner=1;g.tiles[i].capital=0;}
  const target=START_TILE-SIZE*2;g.tiles[target].owner=2;g.tiles[target].capital=0;g.factions[1].soldiers=100;g.factions[1].gold=1000;g.nextAI={2:999,3:999};return {g,target};
}
function tick(g:ReturnType<typeof newGame>, n:number){for(let i=0;i<n;i++)advance(g,1);}
describe('진군과 전투',()=>{
  it('전술별 진군 시간과 손실이 다르고 도착 전까지 소유권이 바뀌지 않는다',()=>{
    const {g,target}=setup();const fast=battleQuote(g,target,'rapid')!, siege=battleQuote(g,target,'siege')!;
    expect(fast.duration).toBeLessThan(siege.duration);expect(fast.loss).toBeGreaterThan(siege.loss);
    expect(militaryAttack(g,target,'siege')).toBe(true);expect(g.tiles[target].owner).toBe(2);
    tick(g,siege.duration-1);expect(g.tiles[target].owner).toBe(2);tick(g,1);expect(g.tiles[target].owner).toBe(1);expect(g.battle).toBeNull();
  });
  it('철수 시 투입 병력의 80%만 돌아오고 중복 출동은 막는다',()=>{
    const {g,target}=setup();const committed=battleQuote(g,target,'balanced')!.committed;
    expect(militaryAttack(g,target)).toBe(true);expect(militaryAttack(g,target)).toBe(false);
    expect(recallBattle(g)).toBe(true);expect(g.factions[1].soldiers).toBe(100-committed+Math.floor(committed*.8));expect(recallBattle(g)).toBe(false);
  });
  it('상대가 목표를 잃으면 부대가 전원 복귀하고, 방어가 강화되면 작전이 실패한다',()=>{
    const a=setup();expect(militaryAttack(a.g,a.target,'siege')).toBe(true);a.g.tiles[a.target].owner=3;tick(a.g,16);expect(a.g.factions[1].soldiers).toBe(100);expect(a.g.tiles[a.target].owner).toBe(3);
    const b=setup();expect(militaryAttack(b.g,b.target,'siege')).toBe(true);b.g.tiles[b.target].structure='tower';b.g.tiles[b.target].level=3;tick(b.g,16);expect(b.g.tiles[b.target].owner).toBe(2);expect(b.g.factions[1].soldiers).toBeLessThan(100);
  });
  it('진군 중 저장과 복원은 남은 병력과 작전을 보존한다',()=>{
    const {g,target}=setup();militaryAttack(g,target);tick(g,2);const restored=restoreGame(JSON.stringify(g));expect(restored?.battle?.tile).toBe(target);expect(restored?.factions[1].soldiers).toBe(g.factions[1].soldiers);
  });
});
