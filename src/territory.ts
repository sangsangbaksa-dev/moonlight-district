/** 등불 영토의 턴제 규칙. UI와 분리해 같은 입력에 같은 결과가 나도록 한다. */
export type Side = 0 | 1 | 2 | 3;
export type Terrain = 'plain' | 'forest' | 'hill' | 'ruins';
export type Structure = 'mine' | 'barracks' | 'tower' | 'housing' | 'school' | 'factory' | 'hospital' | 'park' | 'army' | null;
export type Tile = { terrain: Terrain; owner: Side; capital: Side; structure: Structure; product: number; staff: number };
export type Faction = { gold: number; troops: number; soldiers: number; stock: number; alive: boolean };
export type Game = { tiles: Tile[]; factions: Record<1 | 2 | 3, Faction>; unlocked: number[]; demand: number; nextDemand: number; contract: number; battleFx: { tile: number; attacker: Side; defender: Side; until: number } | null; time: number; cooldown: number; nextIncome: number; nextAI: Record<2 | 3, number>; status: 'playing' | 'won' | 'lost'; log: string[]; seed: number };
export type Building = Exclude<Structure, null>;
export const SIZE = 9;
export const START_TILE = SIZE * (SIZE - 1);
export const GOAL = 40;
export const MILITARY_UNLOCK = 18;
export const BUILDINGS: Record<Building, { name: string; cost: number; requires: number; detail: string; icon: string }> = {
  mine: { name: '작은 상점', cost: 10, requires: 0, detail: '상품을 팔아 수익 창출', icon: '▣' },
  housing: { name: '주거시설', cost: 18, requires: 2, detail: '인구 +25 · 세수 증가', icon: '⌂' },
  barracks: { name: '홍보소', cost: 16, requires: 3, detail: '영업력 +3 / 정산', icon: '◉' },
  school: { name: '학교', cost: 26, requires: 4, detail: '영업력 +4 / 정산', icon: '▤' },
  tower: { name: '단골 라운지', cost: 18, requires: 5, detail: '이 상권의 충성도 +6', icon: '◇' },
  factory: { name: '공장', cost: 40, requires: 6, detail: '수익 +4 · 물자 +3 / 정산', icon: '▥' },
  hospital: { name: '병원', cost: 48, requires: 8, detail: '수익 +2 · 충성도 +5', icon: '✚' },
  park: { name: '놀이공원', cost: 65, requires: 10, detail: '수익 +8 · 영업력 +3', icon: '✺' },
  army: { name: '군사 훈련소', cost: 75, requires: MILITARY_UNLOCK, detail: '병력 +4 / 정산 · 후반 전투', icon: '⚑' },
};
export const PRODUCTS = [
  { name:'빵', cost:0, income:3, favorite:'plain' }, { name:'차', cost:18, income:4, favorite:'forest' },
  { name:'등불', cost:28, income:5, favorite:'ruins' }, { name:'의류', cost:40, income:6, favorite:'plain' },
  { name:'가구', cost:55, income:8, favorite:'hill' }, { name:'화장품', cost:70, income:10, favorite:'forest' },
  { name:'장신구', cost:90, income:12, favorite:'ruins' }, { name:'시계', cost:115, income:14, favorite:'plain' },
  { name:'악기', cost:145, income:17, favorite:'hill' }, { name:'마법 도구', cost:180, income:21, favorite:'ruins' },
  { name:'향수', cost:210, income:24, favorite:'forest' }, { name:'장난감', cost:250, income:28, favorite:'plain' },
  { name:'전자제품', cost:300, income:33, favorite:'hill' }, { name:'보석', cost:360, income:39, favorite:'ruins' },
] as const;
export const CONTRACTS: { name: string; target: number; reward: number; progress: (g: Game) => number }[] = [
  { name:'상점 2곳 운영', target:2, reward:35, progress:g=>g.tiles.filter(t=>t.owner===1 && t.structure==='mine').length },
  { name:'도시 인구 60명', target:60, reward:55, progress:g=>population(g,1) },
  { name:'상권 8곳 확보', target:8, reward:80, progress:g=>territoryCount(g,1) },
  { name:'학교와 병원 설립', target:2, reward:110, progress:g=>Number(g.tiles.some(t=>t.owner===1 && t.structure==='school')) + Number(g.tiles.some(t=>t.owner===1 && t.structure==='hospital')) },
  { name:'공장과 놀이공원 설립', target:2, reward:160, progress:g=>Number(g.tiles.some(t=>t.owner===1 && t.structure==='factory')) + Number(g.tiles.some(t=>t.owner===1 && t.structure==='park')) },
  { name:'상권 15곳 확보', target:15, reward:220, progress:g=>territoryCount(g,1) },
];
export const TERRAIN: Record<Terrain, { name: string; claim: number; defense: number; income: number }> = {
  plain: { name: '주거 상권', claim: 4, defense: 0, income: 1 },
  forest: { name: '공원 상권', claim: 5, defense: 1, income: 1 },
  hill: { name: '언덕 상권', claim: 7, defense: 3, income: 1 },
  ruins: { name: '중앙역 상권', claim: 8, defense: 2, income: 4 },
};
export const label: Record<1 | 2 | 3, string> = { 1: '등불상회', 2: '월광상단', 3: '여우상회' };
export const names: Record<1 | 2 | 3, string> = { 1: '내 회사', 2: '월광상단', 3: '여우상회' };
const index = (x: number, y: number) => y * SIZE + x;
export function neighbors(i: number): number[] {
  const x = i % SIZE, y = Math.floor(i / SIZE), out: number[] = [];
  if (x > 0) out.push(i - 1); if (x < SIZE - 1) out.push(i + 1);
  if (y > 0) out.push(i - SIZE); if (y < SIZE - 1) out.push(i + SIZE);
  return out;
}
export function newGame(): Game {
  const ruins = new Set([index(4,4),index(2,3),index(6,5),index(2,6),index(6,2)]);
  const hills = new Set([index(2,0),index(5,0),index(2,2),index(4,2),index(0,3),index(8,3),index(2,4),index(6,4),index(3,6),index(5,6),index(2,8),index(6,8)]);
  const tiles: Tile[] = Array.from({ length: SIZE * SIZE }, (_, i) => {
    const x = i % SIZE, y = Math.floor(i / SIZE);
    return { terrain: ruins.has(i) ? 'ruins' : hills.has(i) ? 'hill' : (x * 7 + y * 11) % 5 < 2 ? 'forest' : 'plain', owner: 0, capital: 0, structure: null, product: 0, staff: 0 };
  });
  for (const [side, positions] of [[1,[index(0,8),index(0,7),index(1,8)]],[2,[index(8,0),index(7,0),index(8,1)]],[3,[index(8,8),index(7,8),index(8,7)]]] as const) {
    for (const i of positions) tiles[i].owner = side;
    tiles[positions[0]].capital = side;
  }
  for (const i of [index(1,8), index(7,0), index(7,8)]) tiles[i].structure = 'mine';
  return { tiles, factions: { 1:{ gold:22,troops:18,soldiers:0,stock:3,alive:true }, 2:{ gold:20,troops:15,soldiers:0,stock:3,alive:true }, 3:{ gold:20,troops:15,soldiers:0,stock:3,alive:true } }, unlocked:[0], demand:0, nextDemand:30, contract:0, battleFx:null,
    time:0, cooldown:0, nextIncome:6, nextAI:{ 2:5, 3:7 }, status:'playing', seed: 917, log:['인접한 상권을 확보하고 상점을 운영하세요.'] };
}
export const territoryCount = (g: Game, side: Side) => g.tiles.filter(t => t.owner === side).length;
export function cityRequirements(g: Game): { housing: number; services: number } {
  const owned = g.tiles.filter(t => t.owner === 1);
  const housing = owned.filter(t => t.structure === 'housing').length;
  const services = (['school','factory','hospital','park'] as const).filter(id => owned.some(t => t.structure === id)).length;
  return { housing, services };
}
export function population(g: Game, side: 1 | 2 | 3): number {
  return territoryCount(g, side) * 5 + g.tiles.filter(t => t.owner === side && t.structure === 'housing').reduce((sum,t) => sum + 25 + t.staff * 8, 0);
}
export function income(g: Game, side: 1 | 2 | 3): { gold: number; troops: number; soldiers: number; supply: number; used: number; shortage: number } {
  const tiles = g.tiles.filter(t => t.owner === side);
  const supply = 1 + tiles.filter(t => t.structure === 'factory').reduce((sum,t) => sum + 3 + t.staff * 2, 0);
  const used = tiles.filter(t => t.structure === 'mine').length;
  const shortage = Math.max(0, used - (g.factions[side].stock + supply));
  return { gold: 4 + Math.floor(population(g, side) / 20) - shortage * 2 + tiles.reduce((sum,t) => sum + TERRAIN[t.terrain].income - t.staff +
      (t.structure === 'mine' ? PRODUCTS[t.product].income + t.staff * 4 + (PRODUCTS[t.product].favorite === t.terrain ? 2 : 0) + (t.product === g.demand ? 4 : 0) : t.structure === 'factory' ? 4 + t.staff * 2 : t.structure === 'hospital' ? 2 : t.structure === 'park' ? 8 + t.staff * 2 : 0), 0),
    troops: 4 + tiles.reduce((sum,t) => sum + (t.structure === 'barracks' || t.structure === 'school' ? (t.structure === 'school' ? 4 : 3) + t.staff * 2 : t.structure === 'park' ? 3 + t.staff : 0), 0),
    soldiers: tiles.filter(t => t.structure === 'army').reduce((sum,t) => sum + 4 + t.staff * 2, 0), supply, used, shortage };
}
export function defense(t: Tile): number { return 5 + TERRAIN[t.terrain].defense + (t.structure === 'tower' ? 6 + t.staff * 2 : t.structure === 'hospital' ? 5 + t.staff * 2 : 0) + (t.capital ? 22 : 0); }
export function adjacent(g: Game, i: number, side: Side): boolean { return neighbors(i).some(n => g.tiles[n].owner === side); }
export function log(g: Game, message: string) { g.log.unshift(message); g.log = g.log.slice(0, 8); }
function endCheck(g: Game): void {
  if (!g.factions[1].alive) { g.status = 'lost'; log(g, '본점을 빼앗겼습니다.'); return; }
  const city = cityRequirements(g);
  if ((territoryCount(g,1) >= GOAL && city.housing >= 2 && city.services >= 3) || (!g.factions[2].alive && !g.factions[3].alive)) { g.status = 'won'; log(g, '도시의 대표 기업이 되었습니다!'); return; }
  for (const side of [2,3] as const) if (territoryCount(g,side) >= GOAL) { g.status = 'lost'; log(g, `${label[side]}이 도시를 장악했습니다.`); return; }
}
function take(g: Game, i: number, side: 1 | 2 | 3, military = false): boolean {
  const tile = g.tiles[i], faction = g.factions[side];
  if (!tile || tile.owner === side || !adjacent(g,i,side)) return false;
  if (tile.owner === 0) {
    const amount = TERRAIN[tile.terrain].claim;
    if (faction.gold < amount) return false;
    faction.gold -= amount;
  } else {
    const enemy = tile.owner, need = defense(tile);
    if (military ? faction.soldiers < need : faction.troops < need) return false;
    if (military) faction.soldiers -= need; else faction.troops -= need;
    if (tile.capital === enemy) {
      g.factions[enemy].alive = false;
      for (const t of g.tiles) if (t.owner === enemy) { t.owner = 0; t.structure = null; t.capital = 0; t.staff = 0; }
      log(g, `${label[enemy]} 본점이 인수됐습니다.`);
    }
  }
  tile.owner = side; tile.structure = null; tile.capital = 0; tile.product = 0; tile.staff = 0;
  endCheck(g); return true;
}
export function canTake(g: Game, i: number, side: 1 | 2 | 3 = 1): boolean {
  const t = g.tiles[i]; if (!t || t.owner === side || !adjacent(g,i,side)) return false;
  return t.owner === 0 ? g.factions[side].gold >= TERRAIN[t.terrain].claim : g.factions[side].troops >= defense(t);
}
export function expand(g: Game, i: number): boolean {
  if (g.status !== 'playing' || g.cooldown > 0 || !canTake(g,i)) return false;
  const previous = g.tiles[i].owner;
  if (!take(g,i,1)) return false;
  g.cooldown = 0.8; log(g, previous ? `${names[previous]}의 상권을 인수했습니다.` : `${TERRAIN[g.tiles[i].terrain].name}을 확보했습니다.`); return true;
}
export function militaryAttack(g: Game, i: number): boolean {
  const t = g.tiles[i];
  if (g.status !== 'playing' || g.cooldown > 0 || territoryCount(g,1) < MILITARY_UNLOCK || !t || t.owner === 0 || t.owner === 1 || !adjacent(g,i,1) || g.factions[1].soldiers < defense(t)) return false;
  const defender = t.owner;
  if (!take(g,i,1,true)) return false;
  g.battleFx = { tile:i, attacker:1, defender, until:g.time + 1.5 };
  g.cooldown = 0.8; log(g, '군대를 출동시켜 상권을 확보했습니다.'); return true;
}
export function build(g: Game, i: number, b: Building): boolean {
  const tile = g.tiles[i], def = BUILDINGS[b];
  if (g.status !== 'playing' || g.cooldown > 0 || !tile || tile.owner !== 1 || tile.structure || !def || territoryCount(g,1) < def.requires || g.factions[1].gold < def.cost) return false;
  g.factions[1].gold -= def.cost; tile.structure = b; g.cooldown = 0.8; log(g, `${def.name}을 세웠습니다.`); endCheck(g); return true;
}
export function demolish(g: Game, i: number): boolean {
  const tile = g.tiles[i];
  if (g.status !== 'playing' || g.cooldown > 0 || !tile || tile.owner !== 1 || !tile.structure) return false;
  const name = BUILDINGS[tile.structure].name;
  const refund = Math.floor(BUILDINGS[tile.structure].cost / 2);
  tile.structure = null; tile.product = 0; tile.staff = 0; g.factions[1].gold += refund; g.cooldown = 0.8;
  log(g, `${name}을 정리하고 ${refund}G를 돌려받았습니다.`); return true;
}
export const hireCost = (staff: number) => 15 + staff * 10;
export function hire(g: Game, i: number): boolean {
  const t = g.tiles[i];
  if (g.status !== 'playing' || g.cooldown > 0 || !t || t.owner !== 1 || !t.structure || t.staff >= 3 || g.factions[1].gold < hireCost(t.staff)) return false;
  g.factions[1].gold -= hireCost(t.staff); t.staff++; g.cooldown = 0.8;
  log(g, `${BUILDINGS[t.structure].name}에 직원을 고용했습니다.`); return true;
}
export function chooseProduct(g: Game, i: number, product: number): boolean {
  const t = g.tiles[i], p = PRODUCTS[product];
  if (g.status !== 'playing' || g.cooldown > 0 || !t || t.owner !== 1 || t.structure !== 'mine' || !p) return false;
  if (!g.unlocked.includes(product)) {
    if (g.factions[1].gold < p.cost) return false;
    g.factions[1].gold -= p.cost; g.unlocked.push(product);
  }
  t.product = product; g.cooldown = 0.8; log(g, `${p.name} 판매를 시작했습니다.`); return true;
}
function random(g: Game): number { g.seed = (Math.imul(g.seed, 1664525) + 1013904223) >>> 0; return g.seed / 4294967296; }
function aiTurn(g: Game, side: 2 | 3): void {
  const f = g.factions[side]; if (!f.alive) return;
  const owned = g.tiles.map((t,i) => ({t,i})).filter(({t}) => t.owner === side);
  const empty = owned.filter(({t}) => !t.capital && !t.structure);
  if (empty.length && f.gold >= 10 && owned.filter(({t}) => t.structure === 'mine').length < Math.floor(owned.length / 3)) {
    const tile = empty[0].t; tile.structure = 'mine'; tile.product = Math.min(PRODUCTS.length - 1, Math.floor(g.time / 45)); f.gold -= 10;
    log(g, `${label[side]}${side === 3 ? "가" : "이"} 상점을 열었습니다.`); return;
  }
  if (owned.length >= MILITARY_UNLOCK && empty.length && f.gold >= 75 && !owned.some(({t}) => t.structure === 'army')) {
    empty[0].t.structure = 'army'; f.gold -= 75; log(g, `${label[side]}${side === 3 ? "가" : "이"} 군사 훈련소를 세웠습니다.`); return;
  }
  const understaffed = owned.find(({t}) => t.structure === 'mine' && t.staff < 2);
  if (understaffed && f.gold >= hireCost(understaffed.t.staff) + 30 && random(g) < .22) {
    f.gold -= hireCost(understaffed.t.staff); understaffed.t.staff++;
    log(g, `${label[side]}${side === 3 ? "가" : "이"} 직원을 고용했습니다.`); return;
  }
  const infrastructure = owned.filter(({t}) => t.structure && t.structure !== 'mine' && t.structure !== 'army').length;
  if (empty.length && infrastructure < Math.floor(owned.length / 5)) {
    const choices: Building[] = ['housing', 'barracks', 'factory', 'school', 'hospital', 'park'];
    const candidate = choices[infrastructure % choices.length], def = BUILDINGS[candidate];
    if (owned.length >= def.requires && f.gold >= def.cost) {
      empty[0].t.structure = candidate; f.gold -= def.cost;
      log(g, `${label[side]}에 ${def.name}이 들어섰습니다.`); return;
    }
  }
  let count = 0;
  for (let action = 0; action < 1 && g.status === 'playing'; action++) {
    const candidates = g.tiles.map((t,i) => ({ t,i })).filter(({t,i}) => canTake(g,i,side) || (t.owner !== 0 && t.owner !== side && adjacent(g,i,side) && f.soldiers >= defense(t)));
    if (!candidates.length) break;
    const scored = candidates.map(({t,i}) => {
      const capitalDistance = Math.abs(i % SIZE) + Math.abs(Math.floor(i / SIZE) - (SIZE - 1));
      const attack = t.owner !== 0;
      const score = (t.capital ? 25 : 0) + (t.terrain === 'ruins' ? 6 : 0) + (attack ? 3 : 0) - capitalDistance * .25 - (attack ? defense(t) * .35 : TERRAIN[t.terrain].claim * .15) + random(g) * 3;
      return { i, score };
    }).sort((a,b) => b.score-a.score);
    const target = g.tiles[scored[0].i];
    const useArmy = target.owner !== 0 && target.owner !== side && f.soldiers >= defense(target);
    const defender = target.owner;
    if (take(g,scored[0].i,side,useArmy)) {
      count++;
      if (useArmy) g.battleFx = { tile:scored[0].i, attacker:side, defender, until:g.time + 1.5 };
    }
  }
  if (count) log(g, `${label[side]}${side === 3 ? "가" : "이"} 상권 ${count}곳을 넓혔습니다.`);
}
/** 상대 진영과 수입이 게임 시간에 따라 동시에 진행된다. */
export function advance(g: Game, seconds: number): void {
  if (g.status !== 'playing') return;
  const dt = Math.min(1, Math.max(0, seconds));
  g.time += dt;
  if (g.battleFx && g.time >= g.battleFx.until) g.battleFx = null;
  g.cooldown = Math.max(0, g.cooldown - dt);
  if (g.time >= g.nextDemand) {
    g.demand = (g.demand + 3) % PRODUCTS.length;
    g.nextDemand += 30;
    log(g, `인기 상품이 ${PRODUCTS[g.demand].name}(으)로 바뀌었습니다.`);
  }
  while (g.time >= g.nextIncome && g.status === 'playing') {
    for (const side of [1,2,3] as const) {
      if (!g.factions[side].alive) continue;
      const profit = income(g,side); const f = g.factions[side];
      f.gold = Math.max(0, f.gold + profit.gold); f.troops += profit.troops; f.soldiers += profit.soldiers;
      f.stock = Math.min(99, Math.max(0, f.stock + profit.supply - profit.used));
    }
    g.nextIncome += 6;
  }
  for (const side of [2,3] as const) {
    if (g.time >= g.nextAI[side] && g.status === 'playing') {
      aiTurn(g,side); g.nextAI[side] += 4.5;
    }
  }
  while (g.status === 'playing' && CONTRACTS[g.contract] && CONTRACTS[g.contract].progress(g) >= CONTRACTS[g.contract].target) {
    const contract = CONTRACTS[g.contract++];
    g.factions[1].gold += contract.reward;
    log(g, `도시 계약 완료: ${contract.name} · +${contract.reward}G`);
  }
}
