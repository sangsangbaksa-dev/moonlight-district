import { describe, expect, it } from 'vitest';
import { advance, battleQuote, build, canTake, chooseProduct, claimCost, CONTRACTS, demolish, expand, GOAL, hire, income, MILITARY_UNLOCK, militaryAttack, newGame, PRODUCTS, SIZE, START_TILE, territoryCount } from '../../src/territory';

function tick(g: ReturnType<typeof newGame>, seconds: number) { for (let i=0;i<seconds;i++) advance(g,1); }

describe('real-time city', () => {
  it('인접한 상권만 비용을 내고 확보하며 시간에 따라 AI도 움직인다', () => {
    const g = newGame();
    expect(canTake(g,0)).toBe(false);
    const target = START_TILE - SIZE + 1; const expectedCost = claimCost(g,g.tiles[target]);
    expect(expand(g,target)).toBe(true);
    expect(g.tiles[target].owner).toBe(1);
    expect(g.factions[1].gold).toBe(22 - expectedCost);
    expect(expand(g,target-SIZE)).toBe(false);
    tick(g,8);
    expect(territoryCount(g,2) + territoryCount(g,3)).toBeGreaterThan(6);
    expect(g.factions[1].gold).toBeGreaterThan(22 - expectedCost);
  });
  it('상점의 상품을 개발하면 수익과 유행 보너스가 반영된다', () => {
    const g = newGame();
    g.factions[1].gold = 100;
    expect(chooseProduct(g,START_TILE+1,1)).toBe(true);
    expect(g.unlocked).toContain(1);
    g.demand = 2; const withoutDemand = income(g,1).gold;
    g.demand = 1;
    expect(income(g,1).gold).toBe(withoutDemand + 4);
    expect(chooseProduct(g,START_TILE+1,2)).toBe(false); // 작업 직후 대기 시간
    tick(g,2);
    expect(chooseProduct(g,START_TILE+1,2)).toBe(true);
    expect(PRODUCTS[g.tiles[START_TILE+1].product].name).toBe('등불');
  });
  it('공장은 물자를 만들고 재고가 부족하면 상점 수익이 줄어든다', () => {
    const g = newGame();
    g.tiles[START_TILE-SIZE].structure = 'mine'; g.tiles[START_TILE-SIZE].level = 1; g.tiles[START_TILE].structure = 'mine'; g.tiles[START_TILE].level = 1;
    g.factions[1].stock = 0;
    expect(income(g,1).shortage).toBe(2);
    g.tiles[START_TILE].structure = 'factory'; g.tiles[START_TILE].level = 1;
    expect(income(g,1).shortage).toBe(0);
    expect(income(g,1).supply).toBe(4);
    tick(g,6);
    expect(g.factions[1].stock).toBe(2);
  });
  it('시설 조건과 건설 비용을 지키고 정리하면 비용의 절반을 돌려준다', () => {
    const g = newGame(); g.factions[1].gold = 1000;
    expect(build(g,START_TILE,'park')).toBe(false);
    expect(build(g,START_TILE,'housing')).toBe(true);
    expect(build(g,START_TILE,'school')).toBe(false);
    tick(g,2);
    const money = g.factions[1].gold;
    expect(demolish(g,START_TILE)).toBe(true);
    expect(g.factions[1].gold).toBe(money + 9);
  });
  it('후반 군사 시설과 전투는 충분한 상권과 병력이 필요하다', () => {
    const g = newGame(); g.factions[1].gold = 1000;
    expect(build(g,START_TILE,'army')).toBe(false);
    for (let i=0;i<MILITARY_UNLOCK-3;i++) { g.tiles[i].owner=1; g.tiles[i].capital=0; }
    expect(territoryCount(g,1)).toBe(MILITARY_UNLOCK);
    expect(build(g,START_TILE,'army')).toBe(true);
    tick(g,2);
    const target = START_TILE - SIZE * 2; g.tiles[target].owner=2; g.tiles[target].capital=0;
    expect(militaryAttack(g,target)).toBe(false);
    g.factions[1].soldiers = battleQuote(g,target,'balanced')!.committed;
    expect(militaryAttack(g,target)).toBe(true);
    expect(g.tiles[target].owner).toBe(2);
    g.nextAI={2:999,3:999}; tick(g,10);
    expect(g.tiles[target].owner).toBe(1);
    expect(g.factions[1].soldiers).toBeGreaterThanOrEqual(0);
  });
  it('직원 고용은 비용을 쓰고 매출과 급여를 반영하며 정원을 지킨다', () => {
    const g = newGame(); const spot = START_TILE + 1; g.factions[1].gold = 100;
    const before = income(g,1).gold;
    expect(hire(g,spot)).toBe(true);
    expect(g.tiles[spot].staff).toBe(1);
    expect(g.factions[1].gold).toBe(85);
    expect(income(g,1).gold).toBe(before + 3);
    tick(g,2); expect(hire(g,spot)).toBe(true);
    tick(g,2); expect(hire(g,spot)).toBe(true);
    tick(g,2); expect(hire(g,spot)).toBe(false);
  });
  it('계약 보상은 한 번만 지급되고 인기 상품은 시간이 지나면 변한다', () => {
    const g = newGame(); g.tiles[START_TILE-SIZE].structure='mine'; g.tiles[START_TILE-SIZE].level=1;
    const initial=g.factions[1].gold;
    advance(g,.1);
    expect(g.contract).toBe(1);
    expect(g.factions[1].gold).toBe(initial + CONTRACTS[0].reward);
    advance(g,.1);
    expect(g.factions[1].gold).toBe(initial + CONTRACTS[0].reward);
    tick(g,30);
    expect(g.demand).toBe(3);
  });
  it('최종 목표는 도시 기반시설, 연구, 상품과 시설 강화를 모두 요구한다', () => {
    const g = newGame(); g.era=4;
    for (let i=0;i<GOAL;i++) { g.tiles[i].owner=1; g.tiles[i].capital=0; g.tiles[i].structure=null; g.tiles[i].level=0; }
    for (let i=0;i<6;i++) { g.tiles[i].structure='housing'; g.tiles[i].level=3; }
    for (const [i,b] of (['school','factory','hospital','park'] as const).entries()) { g.tiles[i+6].structure=b; g.tiles[i+6].level=1; }
    g.research={commerce:3,industry:3,planning:2,security:2,military:2}; g.unlocked=[0,1,2,3,4,5,6,7,8,9];
    g.deliveries=5; g.factions[2].alive=false; g.factions[3].alive=false;
    advance(g,.1);
    expect(g.status).toBe('won');
  });
});
