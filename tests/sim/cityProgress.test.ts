import { describe, expect, it } from 'vitest';
import { advance, claimCost, defense, eraGoals, income, newGame, research, SIZE, START_TILE, upgrade, type Tile } from '../../src/territory';
import { restoreGame } from '../../src/save';

describe('extended city progression', () => {
  it('시설 강화와 연구는 비용을 내고 생산과 방어에 반영된다', () => {
    const g=newGame(); g.factions[1].gold=1000;
    const shop=g.tiles[START_TILE+1]; const baseline=income(g,1).gold;
    expect(upgrade(g,START_TILE+1)).toBe(true);
    expect(shop.level).toBe(2); expect(income(g,1).gold).toBeGreaterThan(baseline);
    advance(g,1); advance(g,1);
    const price=claimCost(g,g.tiles[START_TILE-SIZE+1]);
    expect(research(g,'planning')).toBe(true);
    expect(claimCost(g,g.tiles[START_TILE-SIZE+1])).toBeLessThanOrEqual(price);
    advance(g,1); advance(g,1);
    const before=defense(shop,g); expect(research(g,'security')).toBe(true);
    expect(defense(shop,g)).toBe(before+2);
  });
  it('조건을 충족하면 다음 도시 단계와 지원금이 한 번만 지급된다', () => {
    const g=newGame();
    for(let i=0;i<9;i++) g.tiles[i].owner=1;
    g.tiles[START_TILE].structure='housing';g.tiles[START_TILE].level=1;
    g.tiles[START_TILE-SIZE].structure='mine';g.tiles[START_TILE-SIZE].level=1;
    const initial=g.factions[1].gold;expect(eraGoals(g).every(x=>x.value>=x.target)).toBe(true);
    advance(g,.1);expect(g.era).toBe(2);expect(g.factions[1].gold).toBeGreaterThanOrEqual(initial+100);
    const after=g.factions[1].gold;advance(g,.1);expect(g.factions[1].gold).toBe(after);
  });
  it('기존 9×9 저장을 11×11로 옮기며 건물·직원·자원을 보존한다', () => {
    const old=newGame();const oldTiles:Tile[]=old.tiles.slice(0,81).map(t=>({...t,owner:0,capital:0,structure:null,level:0}));
    oldTiles[80]={...oldTiles[80],owner:1,capital:1,structure:'mine',staff:2,product:3,level:0};
    const restored=restoreGame(JSON.stringify({...old,tiles:oldTiles,research:undefined,era:undefined,endless:undefined}));
    expect(restored).not.toBeNull();expect(restored!.tiles).toHaveLength(SIZE*SIZE);
    const tile=restored!.tiles[9*SIZE+9];expect(tile.owner).toBe(1);expect(tile.structure).toBe('mine');expect(tile.staff).toBe(2);expect(tile.level).toBe(1);expect(restored!.research.commerce).toBe(0);
  });
  it('형식이 손상된 저장은 사용하지 않는다', () => {expect(restoreGame('{bad')).toBeNull();expect(restoreGame('{}')).toBeNull();});
});
