/** 실시간 도시 경영 규칙. UI와 분리해 같은 입력에 같은 결과가 나도록 한다. */
export type Side = 0 | 1 | 2 | 3;
export type Terrain = 'plain' | 'forest' | 'hill' | 'ruins';
export type Structure = 'mine' | 'barracks' | 'tower' | 'housing' | 'school' | 'factory' | 'hospital' | 'park' | 'army' | 'warehouse' | 'bank' | 'lab' | 'station' | null;
export type Tile = { terrain: Terrain; owner: Side; capital: Side; structure: Structure; product: number; staff: number; level: number };
export type Faction = { gold: number; troops: number; soldiers: number; stock: number; alive: boolean };
export type Research = 'commerce' | 'industry' | 'planning' | 'security' | 'military';
export type Policy = 'balanced' | 'expansion' | 'commerce' | 'security' | 'industry';
export type Difficulty = 'relaxed' | 'standard' | 'hard';
export type CityEvent = { kind: number; expiresAt: number };
export type Delivery = { product: number; stock: number; reward: number; expiresAt: number };
export type Tactic = 'rapid' | 'balanced' | 'siege';
export type Battle = { tile:number; defender:Side; tactic:Tactic; committed:number; startedAt:number; arrivesAt:number };
export type Game = { tiles: Tile[]; factions: Record<1 | 2 | 3, Faction>; unlocked: number[]; research: Record<Research, number>; policy: Policy; difficulty: Difficulty; nextPolicyChange: number; pacts: Record<2 | 3, number>; mapSeed: number; era: number; endless: boolean; event: CityEvent | null; eventIndex: number; nextEvent: number; delivery: Delivery | null; nextDelivery: number; deliveries: number; demand: number; nextDemand: number; contract: number; battle: Battle | null; battleFx: { tile: number; attacker: Side; defender: Side; until: number } | null; time: number; cooldown: number; nextIncome: number; nextAI: Record<2 | 3, number>; status: 'playing' | 'won' | 'lost'; log: string[]; seed: number };
export type Building = Exclude<Structure, null>;
export const SIZE = 11;
export const START_TILE = SIZE * (SIZE - 1);
export const GOAL = 85;
export const MILITARY_UNLOCK = 18;
export const RESEARCH: Record<Research, { name: string; detail: string; cost: number }> = {
  commerce: { name:'유통 혁신', detail:'상점 매출 15% 증가', cost:80 },
  industry: { name:'생산 자동화', detail:'공장마다 물자 +2', cost:90 },
  planning: { name:'도시 계획', detail:'빈 상권 확보 비용 10% 절감', cost:75 },
  security: { name:'지역 안전망', detail:'모든 상권 충성도 +2', cost:85 },
  military: { name:'군수 연구', detail:'훈련소마다 병력 +2', cost:100 },
};
export const POLICIES: Record<Policy, { name:string; detail:string }> = {
  balanced: { name:'균형 운영', detail:'추가 효과 없음' },
  expansion: { name:'확장 우선', detail:'빈 상권 비용 −20% · 골드 수입 −10%' },
  commerce: { name:'상업 진흥', detail:'골드 수입 +15% · 정산 영업력 −2' },
  security: { name:'지역 보호', detail:'상권 충성도 +3 · 골드 수입 −10%' },
  industry: { name:'생산 지원', detail:'공장당 물자 +2 · 정산 영업력 −1' },
};
export const DIFFICULTIES: Record<Difficulty, { name:string; detail:string; interval:number }> = {
  relaxed: { name:'여유', detail:'경쟁사가 천천히 확장합니다.', interval:8 },
  standard: { name:'보통', detail:'도시 건설과 경쟁을 균형 있게 진행합니다.', interval:5.5 },
  hard: { name:'도전', detail:'경쟁사가 빠르게 확장합니다.', interval:4 },
};
export const TACTICS: Record<Tactic, { name:string; duration:number; force:number; loss:number; gold:number; detail:string }> = {
  rapid: { name:'기습', duration:5, force:1.4, loss:.95, gold:0, detail:'빠르게 도착하지만 손실이 큽니다.' },
  balanced: { name:'정규 진군', duration:10, force:1.2, loss:.7, gold:0, detail:'시간과 손실이 보통입니다.' },
  siege: { name:'포위 작전', duration:16, force:1, loss:.45, gold:25, detail:'느리지만 손실이 적습니다. 보급비 25G.' },
};
export const CITY_EVENTS = [
  { name:'물류 차질', detail:'물자 생산이 정산마다 2개 줄어듭니다.', gold:60, resource:'troops', amount:20, action:'운송 지원', alternative:'영업력 투입' },
  { name:'지역 축제', detail:'축제 기간 상점마다 매출이 3G 늘어납니다.', gold:70, resource:'stock', amount:12, action:'축제 후원', alternative:'물자 후원' },
  { name:'상권 분쟁', detail:'내 상권의 충성도가 2 낮아집니다.', gold:75, resource:'troops', amount:25, action:'분쟁 중재', alternative:'영업력 투입' },
  { name:'전력 점검', detail:'도시 매출이 20% 감소합니다.', gold:90, resource:'stock', amount:15, action:'긴급 보수', alternative:'물자 투입' },
] as const;
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
  warehouse: { name: '물류 창고', cost: 65, requires: 14, detail: '물자 +1 · 보관 한도 +35', icon: '▦' },
  bank: { name: '금융센터', cost: 90, requires: 16, detail: '수익 +12 / 정산', icon: '▥' },
  lab: { name: '연구소', cost: 75, requires: 20, detail: '단계당 연구비 10% 할인 · 최대 30%', icon: '⌬' },
  station: { name: '환승역', cost: 110, requires: 24, detail: '단계에 따라 2~4칸까지 확장', icon: '⇆' },
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
  { name:'시청 연구 2단계', target:2, reward:150, progress:g=>Object.values(g.research).reduce((a,b)=>a+b,0) },
  { name:'직원 5명 고용', target:5, reward:190, progress:g=>g.tiles.filter(t=>t.owner===1).reduce((n,t)=>n+t.staff,0) },
  { name:'상품 4종 개발', target:4, reward:230, progress:g=>g.unlocked.length },
  { name:'시설 강화 3회', target:3, reward:300, progress:g=>g.tiles.filter(t=>t.owner===1).reduce((n,t)=>n+Math.max(0,t.level-1),0) },
  { name:'도시 인구 400명', target:400, reward:400, progress:g=>population(g,1) },
  { name:'상권 60곳 확보', target:60, reward:600, progress:g=>territoryCount(g,1) },
  { name:'특별 납품 3회', target:3, reward:650, progress:g=>g.deliveries },
  { name:'환승역 건설', target:1, reward:750, progress:g=>Number(g.tiles.some(t=>t.owner===1 && t.structure==='station')) },
  { name:'시설 강화 10회', target:10, reward:900, progress:g=>g.tiles.filter(t=>t.owner===1).reduce((n,t)=>n+Math.max(0,t.level-1),0) },
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
export function newGame(seed = 917): Game {
  const ruins = new Set([index(5,5),index(2,3),index(8,7),index(2,7),index(8,3),index(5,1),index(5,9)]);
  const hills = new Set([index(2,0),index(5,0),index(8,0),index(2,2),index(4,2),index(7,2),index(0,3),index(10,3),index(2,4),index(8,4),index(3,6),index(7,6),index(2,8),index(6,8),index(9,8),index(2,10),index(8,10)]);
  const tiles: Tile[] = Array.from({ length: SIZE * SIZE }, (_, i) => {
    const x = i % SIZE, y = Math.floor(i / SIZE);
    let hash = (Math.imul(x+1, 73856093) ^ Math.imul(y+1,19349663) ^ seed) >>> 0;
    hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b) >>> 0;
    return { terrain: ruins.has(i) ? 'ruins' : hills.has(i) || hash % 17 === 0 ? 'hill' : hash % 5 < 2 ? 'forest' : 'plain', owner: 0, capital: 0, structure: null, product: 0, staff: 0, level: 0 };
  });
  for (const [side, positions] of [[1,[index(0,SIZE-1),index(0,SIZE-2),index(1,SIZE-1)]],[2,[index(SIZE-1,0),index(SIZE-2,0),index(SIZE-1,1)]],[3,[index(SIZE-1,SIZE-1),index(SIZE-2,SIZE-1),index(SIZE-1,SIZE-2)]]] as const) {
    for (const i of positions) tiles[i].owner = side;
    tiles[positions[0]].capital = side;
  }
  for (const i of [index(1,SIZE-1), index(SIZE-2,0), index(SIZE-2,SIZE-1)]) { tiles[i].structure = 'mine'; tiles[i].level = 1; }
  return { tiles, factions: { 1:{ gold:22,troops:18,soldiers:0,stock:3,alive:true }, 2:{ gold:20,troops:15,soldiers:0,stock:3,alive:true }, 3:{ gold:20,troops:15,soldiers:0,stock:3,alive:true } }, unlocked:[0], research:{commerce:0,industry:0,planning:0,security:0,military:0}, policy:'balanced', difficulty:'standard', nextPolicyChange:0, pacts:{2:0,3:0}, mapSeed:seed >>> 0, era:1, endless:false, event:null, eventIndex:0, nextEvent:55, delivery:null, nextDelivery:45, deliveries:0, demand:0, nextDemand:30, contract:0, battle:null, battleFx:null,
    time:0, cooldown:0, nextIncome:6, nextAI:{ 2:5, 3:7 }, status:'playing', seed: seed >>> 0, log:['인접한 상권을 확보하고 상점을 운영하세요.'] };
}
export const territoryCount = (g: Game, side: Side) => g.tiles.filter(t => t.owner === side).length;
export function cityRequirements(g: Game): { housing: number; services: number } {
  const owned = g.tiles.filter(t => t.owner === 1);
  const housing = owned.filter(t => t.structure === 'housing').length;
  const services = (['school','factory','hospital','park'] as const).filter(id => owned.some(t => t.structure === id)).length;
  return { housing, services };
}
export function eraGoals(g: Game): { label: string; value: number; target: number }[] {
  const owned = g.tiles.filter(t => t.owner === 1);
  const city = cityRequirements(g);
  const shops = owned.filter(t => t.structure === 'mine').length;
  const research = Object.values(g.research).reduce((a,b) => a+b, 0);
  const upgrades = owned.reduce((sum,t) => sum + Math.max(0,t.level-1), 0);
  if (g.era === 1) return [
    { label:'상권', value:owned.length, target:12 }, { label:'상점', value:shops, target:2 }, { label:'주거시설', value:city.housing, target:1 },
  ];
  if (g.era === 2) return [
    { label:'상권', value:owned.length, target:30 }, { label:'주거시설', value:city.housing, target:2 },
    { label:'기반시설 종류', value:city.services, target:3 }, { label:'연구 단계', value:research, target:2 },
  ];
  if (g.era === 3) return [
    { label:'상권', value:owned.length, target:55 }, { label:'주거시설', value:city.housing, target:4 },
    { label:'기반시설 종류', value:city.services, target:4 }, { label:'연구 단계', value:research, target:7 },
    { label:'시설 강화', value:upgrades, target:6 }, { label:'개발 상품', value:g.unlocked.length, target:6 }, { label:'납품', value:g.deliveries, target:2 },
  ];
  return [
    { label:'상권', value:owned.length, target:GOAL }, { label:'주거시설', value:city.housing, target:6 },
    { label:'기반시설 종류', value:city.services, target:4 }, { label:'연구 단계', value:research, target:12 },
    { label:'시설 강화', value:upgrades, target:12 }, { label:'개발 상품', value:g.unlocked.length, target:10 },
    { label:'납품', value:g.deliveries, target:5 }, { label:'경쟁사 퇴출', value:Number(!g.factions[2].alive)+Number(!g.factions[3].alive), target:2 },
  ];
}
export const ERA_NAMES = ['','동네 상권','산업 도시','광역 도시','도시 연합'] as const;
export function claimCost(g: Game, t: Tile, side: 1 | 2 | 3 = 1): number {
  const base = TERRAIN[t.terrain].claim + Math.floor(Math.max(0,territoryCount(g,side)-3) / 6) * 2;
  return Math.max(2, Math.floor(base * (side === 1 ? (1 - g.research.planning * 0.1) * (g.policy === 'expansion' ? .8 : 1) : 1)));
}
export function population(g: Game, side: 1 | 2 | 3): number {
  return territoryCount(g, side) * 5 + g.tiles.filter(t => t.owner === side && t.structure === 'housing').reduce((sum,t) => sum + 25 * t.level + t.staff * 8, 0);
}
export function stockCapacity(g: Game, side: 1 | 2 | 3): number {
  return 99 + g.tiles.filter(t => t.owner === side && t.structure === 'warehouse').reduce((sum,t)=>sum+35*t.level,0);
}
export function income(g: Game, side: 1 | 2 | 3): { gold: number; troops: number; soldiers: number; supply: number; used: number; shortage: number } {
  const tiles = g.tiles.filter(t => t.owner === side);
  const supply = Math.max(0, 1 + tiles.filter(t => t.structure === 'factory').reduce((sum,t) => sum + 3 * t.level + t.staff * 2 + (side === 1 ? g.research.industry * 2 + (g.policy === 'industry' ? 2 : 0) : 0), 0) + tiles.filter(t=>t.structure==='warehouse').reduce((sum,t)=>sum+t.level+t.staff,0) - (side === 1 && g.event?.kind === 0 ? 2 : 0));
  const used = tiles.filter(t => t.structure === 'mine').length;
  const shortage = Math.max(0, used - (g.factions[side].stock + supply));
  const gross = 4 + Math.floor(population(g, side) / 20) - shortage * 2 + tiles.reduce((sum,t) => sum + TERRAIN[t.terrain].income - t.staff +
      (t.structure === 'mine' ? Math.floor((PRODUCTS[t.product].income * t.level + t.staff * 4 + (PRODUCTS[t.product].favorite === t.terrain ? 2 : 0) + (t.product === g.demand ? 4 : 0)) * (side === 1 ? 1 + g.research.commerce * .15 : 1)) + (side === 1 && g.event?.kind === 1 ? 3 : 0) : t.structure === 'factory' ? 4 * t.level + t.staff * 2 : t.structure === 'hospital' ? 2 * t.level : t.structure === 'park' ? 8 * t.level + t.staff * 2 : t.structure === 'bank' ? 12 * t.level + t.staff * 2 : 0), 0);
  const policyRate = side === 1 ? (g.policy === 'commerce' ? 1.15 : g.policy === 'expansion' || g.policy === 'security' ? .9 : 1) : 1;
  return { gold: Math.floor(gross * policyRate * (side === 1 && g.event?.kind === 3 ? .8 : 1)),
    troops: Math.max(1, 4 + tiles.reduce((sum,t) => sum + (t.structure === 'barracks' || t.structure === 'school' ? (t.structure === 'school' ? 4 : 3) * t.level + t.staff * 2 : t.structure === 'park' ? 3 * t.level + t.staff : t.structure === 'station' || t.structure === 'lab' ? t.staff : 0), 0) - (side === 1 && g.policy === 'commerce' ? 2 : side === 1 && g.policy === 'industry' ? 1 : 0)),
    soldiers: tiles.filter(t => t.structure === 'army').reduce((sum,t) => sum + 4 * t.level + t.staff * 2 + (side === 1 ? g.research.military * 2 : 0), 0), supply, used, shortage };
}
export function defense(t: Tile, g?: Game): number { return Math.max(1, 5 + TERRAIN[t.terrain].defense + (t.structure === 'tower' ? 6 * t.level + t.staff * 2 : t.structure === 'hospital' ? 5 * t.level + t.staff * 2 : 0) + (t.owner === 1 && g ? g.research.security * 2 + (g.policy === 'security' ? 3 : 0) - (g.event?.kind === 2 ? 2 : 0) : 0) + (t.capital ? 22 : 0)); }
export function adjacent(g: Game, i: number, side: Side): boolean {
  if (neighbors(i).some(n => g.tiles[n].owner === side)) return true;
  const x=i%SIZE,y=Math.floor(i/SIZE);
  return g.tiles.some((t,n) => t.owner === side && t.structure === 'station' &&
    Math.abs(n%SIZE-x)+Math.abs(Math.floor(n/SIZE)-y) <= 1+t.level);
}
export function protectedByPact(g: Game, a: Side, b: Side): boolean {
  const rival = a === 1 ? b : b === 1 ? a : 0;
  return (rival === 2 || rival === 3) && g.pacts[rival] > g.time;
}
export const pactCost = (g: Game, side: 2 | 3) => 80 + territoryCount(g,side) * 3;
export function offerPact(g: Game, side: 2 | 3): boolean {
  if (g.status !== 'playing' || g.cooldown > 0 || !g.factions[side].alive || protectedByPact(g,1,side) || g.battle?.defender === side || g.factions[1].gold < pactCost(g,side)) return false;
  g.factions[1].gold -= pactCost(g,side);g.pacts[side]=g.time+45;g.cooldown=1.2;
  log(g, `${label[side]}과 45초간 휴전 협정을 맺었습니다.`);return true;
}
export function log(g: Game, message: string) { g.log.unshift(message); g.log = g.log.slice(0, 8); }
function endCheck(g: Game): void {
  if (!g.factions[1].alive) { g.status = 'lost'; log(g, '본점을 빼앗겼습니다.'); return; }
  if (!g.endless && g.era === 4 && eraGoals(g).every(x => x.value >= x.target)) { g.status = 'won'; log(g, '도시 연합 건설을 완성했습니다.'); return; }
  for (const side of [2,3] as const) if (territoryCount(g,side) >= GOAL) { g.status = 'lost'; log(g, `${label[side]}이 도시를 장악했습니다.`); return; }
}
function transfer(g: Game, i: number, side: 1 | 2 | 3): void {
  const tile = g.tiles[i], enemy = tile.owner;
  if (enemy !== 0 && tile.capital === enemy) {
    g.factions[enemy].alive = false;
    for (const t of g.tiles) if (t.owner === enemy) { t.owner = 0; t.structure = null; t.capital = 0; t.staff = 0; t.level = 0; }
    log(g, `${label[enemy]} 본점이 인수됐습니다.`);
  }
  tile.owner = side; tile.structure = null; tile.capital = 0; tile.product = 0; tile.staff = 0; tile.level = 0;
  endCheck(g);
}
function take(g: Game, i: number, side: 1 | 2 | 3, military = false): boolean {
  const tile = g.tiles[i], faction = g.factions[side];
  if (!tile || tile.owner === side || !adjacent(g,i,side) || protectedByPact(g,side,tile.owner)) return false;
  if (tile.owner === 0) {
    const amount = claimCost(g,tile,side);
    if (faction.gold < amount) return false;
    faction.gold -= amount;
  } else {
    const need = defense(tile,g);
    if (military ? faction.soldiers < need : faction.troops < need) return false;
    if (military) faction.soldiers -= need; else faction.troops -= need;
  }
  transfer(g,i,side); return true;
}
export function canTake(g: Game, i: number, side: 1 | 2 | 3 = 1): boolean {
  const t = g.tiles[i]; if (!t || t.owner === side || !adjacent(g,i,side) || protectedByPact(g,side,t.owner)) return false;
  return t.owner === 0 ? g.factions[side].gold >= claimCost(g,t,side) : g.factions[side].troops >= defense(t,g);
}
export function expand(g: Game, i: number): boolean {
  if (g.status !== 'playing' || g.cooldown > 0 || !canTake(g,i)) return false;
  const previous = g.tiles[i].owner;
  if (!take(g,i,1)) return false;
  g.cooldown = 1.2; log(g, previous ? `${names[previous]}의 상권을 인수했습니다.` : `${TERRAIN[g.tiles[i].terrain].name}을 확보했습니다.`); return true;
}
export function battleQuote(g: Game, i: number, tactic: Tactic) {
  const t=g.tiles[i], spec=TACTICS[tactic];
  if (!t || !spec) return null;
  const strength=defense(t,g);
  return { committed:Math.ceil(strength*spec.force), loss:Math.ceil(strength*spec.loss), duration:spec.duration, gold:spec.gold };
}
export function militaryAttack(g: Game, i: number, tactic: Tactic = 'balanced'): boolean {
  const t = g.tiles[i];
  const quote=battleQuote(g,i,tactic), f=g.factions[1];
  if (g.status !== 'playing' || g.cooldown > 0 || g.battle || territoryCount(g,1) < MILITARY_UNLOCK || !t || t.owner === 0 || t.owner === 1 || !adjacent(g,i,1) || protectedByPact(g,1,t.owner) || !quote || f.soldiers < quote.committed || f.gold < quote.gold) return false;
  f.soldiers -= quote.committed; f.gold -= quote.gold;
  g.battle = { tile:i, defender:t.owner, tactic, committed:quote.committed, startedAt:g.time, arrivesAt:g.time+quote.duration };
  g.cooldown=1.2; log(g, `${TACTICS[tactic].name} 부대가 출발했습니다.`); return true;
}
export function recallBattle(g: Game): boolean {
  if (g.status !== 'playing' || !g.battle) return false;
  const returned = Math.floor(g.battle.committed * .8);
  g.factions[1].soldiers += returned; g.battle = null;
  log(g, `부대를 철수했습니다. ${returned}명이 복귀했습니다.`); return true;
}
export function build(g: Game, i: number, b: Building): boolean {
  const tile = g.tiles[i], def = BUILDINGS[b];
  if (g.status !== 'playing' || g.cooldown > 0 || !tile || tile.owner !== 1 || tile.structure || !def || territoryCount(g,1) < def.requires || g.factions[1].gold < def.cost) return false;
  g.factions[1].gold -= def.cost; tile.structure = b; tile.level = 1; g.cooldown = 1.2; log(g, `${def.name}을 세웠습니다.`); endCheck(g); return true;
}
export function demolish(g: Game, i: number): boolean {
  const tile = g.tiles[i];
  if (g.status !== 'playing' || g.cooldown > 0 || !tile || tile.owner !== 1 || !tile.structure) return false;
  const name = BUILDINGS[tile.structure].name;
  const refund = demolishRefund(tile);
  tile.structure = null; tile.product = 0; tile.staff = 0; tile.level = 0; g.factions[1].gold += refund; g.cooldown = 1.2;
  log(g, `${name}을 정리하고 ${refund}G를 돌려받았습니다.`); return true;
}
export function demolishRefund(t: Tile): number {
  if (!t.structure) return 0;
  const base=BUILDINGS[t.structure].cost;
  let spent=base;
  for(let level=1;level<t.level;level++) spent+=Math.ceil(base*(1.5+level));
  return Math.floor(spent/2);
}
export const hireCost = (staff: number) => 15 + staff * 10;
export function hire(g: Game, i: number): boolean {
  const t = g.tiles[i];
  if (g.status !== 'playing' || g.cooldown > 0 || !t || t.owner !== 1 || !t.structure || t.staff >= 3 || g.factions[1].gold < hireCost(t.staff)) return false;
  g.factions[1].gold -= hireCost(t.staff); t.staff++; g.cooldown = 1.2;
  log(g, `${BUILDINGS[t.structure].name}에 직원을 고용했습니다.`); return true;
}
export function chooseProduct(g: Game, i: number, product: number): boolean {
  const t = g.tiles[i], p = PRODUCTS[product];
  if (g.status !== 'playing' || g.cooldown > 0 || !t || t.owner !== 1 || t.structure !== 'mine' || !p) return false;
  if (!g.unlocked.includes(product)) {
    if (g.factions[1].gold < p.cost) return false;
    g.factions[1].gold -= p.cost; g.unlocked.push(product);
  }
  t.product = product; g.cooldown = 1.2; log(g, `${p.name} 판매를 시작했습니다.`); return true;
}
export function upgradeCost(t: Tile): number { return t.structure ? Math.ceil(BUILDINGS[t.structure].cost * (1.5 + t.level)) : 0; }
export function upgrade(g: Game, i: number): boolean {
  const t = g.tiles[i];
  if (g.status !== 'playing' || g.cooldown > 0 || !t || t.owner !== 1 || !t.structure || t.level >= 3 || g.factions[1].gold < upgradeCost(t)) return false;
  g.factions[1].gold -= upgradeCost(t); t.level++; g.cooldown = 1.2; log(g, `${BUILDINGS[t.structure].name}을 ${t.level}단계로 강화했습니다.`); return true;
}
export const researchCost = (g: Game, id: Research) => Math.ceil(RESEARCH[id].cost * (g.research[id] + 1) * (1 - Math.min(.3,g.tiles.filter(t=>t.owner===1 && t.structure==='lab').reduce((sum,t)=>sum+t.level,0) * .1)));
export function research(g: Game, id: Research): boolean {
  if (g.status !== 'playing' || g.cooldown > 0 || !RESEARCH[id] || g.research[id] >= 3 || g.factions[1].gold < researchCost(g,id)) return false;
  g.factions[1].gold -= researchCost(g,id); g.research[id]++; g.cooldown = 1.2; log(g, `${RESEARCH[id].name} 연구가 ${g.research[id]}단계가 되었습니다.`); return true;
}
export function setPolicy(g: Game, id: Policy): boolean {
  if (g.status !== 'playing' || g.cooldown > 0 || g.time < g.nextPolicyChange || !Object.hasOwn(POLICIES,id) || g.policy === id || g.factions[1].gold < 40) return false;
  g.factions[1].gold -= 40; g.policy = id; g.nextPolicyChange = g.time + 30; g.cooldown = 1.2;
  log(g, `도시 정책을 ${POLICIES[id].name}(으)로 바꿨습니다.`); return true;
}
export function resolveEvent(g: Game, option: 'gold' | 'resource'): boolean {
  if (g.status !== 'playing' || g.cooldown > 0 || !g.event) return false;
  const event = CITY_EVENTS[g.event.kind], f = g.factions[1];
  if (!event) return false;
  if (option === 'gold') { if (f.gold < event.gold) return false; f.gold -= event.gold; }
  else { if (f[event.resource] < event.amount) return false; f[event.resource] -= event.amount; }
  if (g.event.kind === 1) f.troops += 35;
  log(g, `${event.name} 대응을 완료했습니다.${g.event.kind === 1 ? ' 영업력 +35' : ''}`);
  g.event = null; g.nextEvent = g.time + 50; g.cooldown = 1.2;
  return true;
}
export function canDeliver(g: Game): boolean {
  const d = g.delivery;
  return !!d && g.time < d.expiresAt && g.factions[1].stock >= d.stock &&
    g.tiles.some(t => t.owner === 1 && t.structure === 'mine' && t.product === d.product);
}
export function deliver(g: Game): boolean {
  if (g.status !== 'playing' || g.cooldown > 0 || !g.delivery || !canDeliver(g)) return false;
  const d = g.delivery;
  g.factions[1].stock -= d.stock; g.factions[1].gold += d.reward; g.factions[1].troops += 12;
  g.deliveries++; g.delivery = null; g.nextDelivery = g.time + 45; g.cooldown = 1.2;
  log(g, `${PRODUCTS[d.product].name} 납품 완료 · +${d.reward}G, 영업력 +12`); return true;
}
function random(g: Game): number { g.seed = (Math.imul(g.seed, 1664525) + 1013904223) >>> 0; return g.seed / 4294967296; }
function aiTurn(g: Game, side: 2 | 3): void {
  const f = g.factions[side]; if (!f.alive) return;
  const owned = g.tiles.map((t,i) => ({t,i})).filter(({t}) => t.owner === side);
  const empty = owned.filter(({t}) => !t.capital && !t.structure);
  if (empty.length && f.gold >= 10 && owned.filter(({t}) => t.structure === 'mine').length < Math.floor(owned.length / 3)) {
    const tile = empty[0].t; tile.structure = 'mine'; tile.level = 1; tile.product = Math.min(PRODUCTS.length - 1, Math.floor(g.time / 45)); f.gold -= 10;
    log(g, `${label[side]}${side === 3 ? "가" : "이"} 상점을 열었습니다.`); return;
  }
  if (owned.length >= MILITARY_UNLOCK && empty.length && f.gold >= 75 && !owned.some(({t}) => t.structure === 'army')) {
    empty[0].t.structure = 'army'; empty[0].t.level = 1; f.gold -= 75; log(g, `${label[side]}${side === 3 ? "가" : "이"} 군사 훈련소를 세웠습니다.`); return;
  }
  const understaffed = owned.find(({t}) => t.structure === 'mine' && t.staff < 2);
  if (understaffed && f.gold >= hireCost(understaffed.t.staff) + 30 && random(g) < .22) {
    f.gold -= hireCost(understaffed.t.staff); understaffed.t.staff++;
    log(g, `${label[side]}${side === 3 ? "가" : "이"} 직원을 고용했습니다.`); return;
  }
  const infrastructure = owned.filter(({t}) => t.structure && t.structure !== 'mine' && t.structure !== 'army').length;
  if (empty.length && infrastructure < Math.floor(owned.length / 5)) {
    const choices: Building[] = ['housing', 'barracks', 'factory', 'school', 'hospital', 'park', 'warehouse', 'bank', 'lab', 'station'];
    const candidate = choices[infrastructure % choices.length], def = BUILDINGS[candidate];
    if (owned.length >= def.requires && f.gold >= def.cost) {
      empty[0].t.structure = candidate; empty[0].t.level = 1; f.gold -= def.cost;
      log(g, `${label[side]}에 ${def.name}이 들어섰습니다.`); return;
    }
  }
  let count = 0;
  for (let action = 0; action < 1 && g.status === 'playing'; action++) {
    const candidates = g.tiles.map((t,i) => ({ t,i })).filter(({t,i}) => canTake(g,i,side) || (t.owner !== 0 && t.owner !== side && !protectedByPact(g,side,t.owner) && adjacent(g,i,side) && f.soldiers >= defense(t,g)));
    if (!candidates.length) break;
    const scored = candidates.map(({t,i}) => {
      const capitalDistance = Math.abs(i % SIZE) + Math.abs(Math.floor(i / SIZE) - (SIZE - 1));
      const attack = t.owner !== 0;
      const score = (t.capital ? 25 : 0) + (t.terrain === 'ruins' ? 6 : 0) + (attack ? 3 : 0) - capitalDistance * .25 - (attack ? defense(t,g) * .35 : claimCost(g,t,side) * .15) + random(g) * 3;
      return { i, score };
    }).sort((a,b) => b.score-a.score);
    const target = g.tiles[scored[0].i];
    const useArmy = target.owner !== 0 && target.owner !== side && f.soldiers >= defense(target,g);
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
  if (g.battle && g.time >= g.battle.arrivesAt) {
    const b=g.battle, tile=g.tiles[b.tile]; g.battle=null;
    if (!tile || tile.owner !== b.defender || !adjacent(g,b.tile,1)) {
      g.factions[1].soldiers += b.committed;
      log(g, '목표 상권이 변경되어 부대가 복귀했습니다.');
    } else if (b.committed < defense(tile,g)) {
      const returned=Math.floor(b.committed*.5);g.factions[1].soldiers+=returned;
      log(g, `상대 방어가 강화되어 작전에 실패했습니다. ${returned}명 복귀.`);
    } else {
      const loss=Math.min(b.committed,Math.ceil(defense(tile,g)*TACTICS[b.tactic].loss));
      g.factions[1].soldiers += b.committed-loss;
      transfer(g,b.tile,1);
      g.battleFx={tile:b.tile,attacker:1,defender:b.defender,until:g.time+1.5};
      log(g, `전투 승리 · 병력 ${loss}명 손실`);
    }
  }
  if (g.battleFx && g.time >= g.battleFx.until) g.battleFx = null;
  g.cooldown = Math.max(0, g.cooldown - dt);
  if (g.event && g.time >= g.event.expiresAt) {
    log(g, `${CITY_EVENTS[g.event.kind].name}이 종료됐습니다.`);
    g.event = null; g.nextEvent = g.time + 50;
  }
  if (!g.event && g.era >= 2 && g.time >= g.nextEvent) {
    const kind = g.eventIndex++ % CITY_EVENTS.length;
    g.event = { kind, expiresAt:g.time+40 };
    log(g, `도시 현안 발생: ${CITY_EVENTS[kind].name}`);
  }
  if (g.delivery && g.time >= g.delivery.expiresAt) {
    log(g, `${PRODUCTS[g.delivery.product].name} 납품 기한이 지났습니다.`);
    g.delivery = null; g.nextDelivery = g.time + 45;
  }
  if (!g.delivery && g.era >= 2 && g.time >= g.nextDelivery) {
    const product = g.unlocked[Math.floor(random(g) * g.unlocked.length)] ?? 0;
    const stock = Math.min(24, 8 + Math.floor(g.time / 90) * 2);
    g.delivery = { product, stock, reward:stock * 4 + PRODUCTS[product].income * 5, expiresAt:g.time + 60 };
    log(g, `${PRODUCTS[product].name} 납품 주문이 도착했습니다.`);
  }
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
      f.stock = Math.min(stockCapacity(g,side), Math.max(0, f.stock + profit.supply - profit.used));
    }
    g.nextIncome += 6;
  }
  for (const side of [2,3] as const) {
    if (g.time >= g.nextAI[side] && g.status === 'playing') {
      aiTurn(g,side); g.nextAI[side] += DIFFICULTIES[g.difficulty].interval;
    }
  }
  while (g.status === 'playing' && CONTRACTS[g.contract] && CONTRACTS[g.contract].progress(g) >= CONTRACTS[g.contract].target) {
    const contract = CONTRACTS[g.contract++];
    g.factions[1].gold += contract.reward;
    log(g, `도시 계약 완료: ${contract.name} · +${contract.reward}G`);
  }
  if (g.status === 'playing' && g.era < 4 && eraGoals(g).every(x => x.value >= x.target)) {
    g.era++;
    const reward = g.era === 2 ? 100 : g.era === 3 ? 250 : 500;
    g.factions[1].gold += reward;
    log(g, `${ERA_NAMES[g.era]} 단계 달성 · 지원금 +${reward}G`);
  }
  if (g.status === 'playing') endCheck(g);
}
