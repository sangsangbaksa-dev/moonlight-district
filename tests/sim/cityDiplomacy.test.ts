import { describe, expect, it } from 'vitest';
import { advance, adjacent, battleQuote, canTake, MILITARY_UNLOCK, militaryAttack, newGame, offerPact, protectedByPact, SIZE, START_TILE } from '../../src/territory';
function tick(g:ReturnType<typeof newGame>, n:number){for(let i=0;i<n;i++)advance(g,1);}
describe('지도와 협상',()=>{
  it('같은 시드는 같은 지도를, 다른 시드는 다른 지형을 만든다',()=>{
    const a=newGame(123),b=newGame(123),c=newGame(456);
    expect(a.tiles.map(t=>t.terrain)).toEqual(b.tiles.map(t=>t.terrain));
    expect(a.tiles.map(t=>t.terrain)).not.toEqual(c.tiles.map(t=>t.terrain));
  });
  it('휴전은 양쪽의 인수와 전투를 막고 45초 후 만료된다',()=>{
    const g=newGame();g.factions[1].gold=1000;g.factions[1].troops=100;g.nextAI={2:999,3:999};
    const target=START_TILE-SIZE*2;g.tiles[target].owner=2;g.tiles[target].capital=0;
    expect(adjacent(g,target,1)).toBe(true);expect(offerPact(g,2)).toBe(true);
    expect(protectedByPact(g,1,2)).toBe(true);expect(protectedByPact(g,2,1)).toBe(true);expect(canTake(g,target)).toBe(false);
    for(let i=0;i<MILITARY_UNLOCK-3;i++){g.tiles[i].owner=1;g.tiles[i].capital=0;}
    g.factions[1].soldiers=battleQuote(g,target,'balanced')!.committed;
    tick(g,2);expect(militaryAttack(g,target)).toBe(false);tick(g,44);expect(protectedByPact(g,1,2)).toBe(false);expect(canTake(g,target)).toBe(true);
  });
});
