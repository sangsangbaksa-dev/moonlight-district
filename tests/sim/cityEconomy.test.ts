import { describe, expect, it } from 'vitest';
import { adjacent, advance, canDeliver, CITY_EVENTS, claimCost, deliver, income, newGame, researchCost, resolveEvent, setPolicy, SIZE, START_TILE, stockCapacity } from '../../src/territory';

function step(g:ReturnType<typeof newGame>, n:number) { for(let i=0;i<n;i++) advance(g,1); }
describe('도시 운영의 중후반 선택',()=>{
  it('정책은 장단점을 함께 적용하며 30초 동안 변경할 수 없다',()=>{
    const g=newGame();g.factions[1].gold=500;const tile=g.tiles[START_TILE-SIZE+1];const cost=claimCost(g,tile);const gold=income(g,1).gold;
    expect(setPolicy(g,'expansion')).toBe(true);expect(claimCost(g,tile)).toBeLessThan(cost);expect(income(g,1).gold).toBeLessThan(gold);
    step(g,2);expect(setPolicy(g,'security')).toBe(false);step(g,29);expect(setPolicy(g,'security')).toBe(true);
  });
  it('물류 차질과 대응은 생산 및 자원 비용에 반영된다',()=>{
    const g=newGame();g.era=2;g.nextEvent=0;g.nextAI={2:999,3:999};g.factions[1].gold=100;
    const before=income(g,1).supply;advance(g,.1);expect(g.event?.kind).toBe(0);expect(income(g,1).supply).toBeLessThan(before);
    expect(resolveEvent(g,'gold')).toBe(true);expect(g.factions[1].gold).toBe(100-CITY_EVENTS[0].gold);expect(g.event).toBeNull();expect(income(g,1).supply).toBe(before);
  });
  it('납품은 지정 상품을 파는 상점과 물자를 요구하고 한 번만 정산된다',()=>{
    const g=newGame();g.delivery={product:0,stock:8,reward:90,expiresAt:60};g.factions[1].stock=7;
    expect(canDeliver(g)).toBe(false);expect(deliver(g)).toBe(false);g.factions[1].stock=8;
    const gold=g.factions[1].gold;expect(deliver(g)).toBe(true);expect(g.factions[1].stock).toBe(0);expect(g.factions[1].gold).toBe(gold+90);expect(g.deliveries).toBe(1);expect(deliver(g)).toBe(false);
  });
  it('창고와 연구소, 환승역은 각각 재고 한도와 연구비와 확장 거리에 영향을 준다',()=>{
    const g=newGame();const shop=g.tiles[START_TILE+1];shop.structure='warehouse';shop.level=2;expect(stockCapacity(g,1)).toBe(169);
    shop.structure='lab';shop.level=1;expect(researchCost(g,'commerce')).toBe(72);
    shop.level=2;expect(researchCost(g,'commerce')).toBe(64);
    shop.structure='station';const remote=START_TILE+3;expect(adjacent(g,remote,1)).toBe(true);
    expect(adjacent(g,START_TILE+4,1)).toBe(true);
    shop.structure=null;expect(adjacent(g,remote,1)).toBe(false);
  });
});
