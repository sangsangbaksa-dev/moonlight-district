import { BUILDINGS, CITY_EVENTS, DIFFICULTIES, newGame, POLICIES, PRODUCTS, RESEARCH, SIZE, TACTICS, TERRAIN, type Game, type Research, type Tile } from './territory';

/** 이전 9×9 저장을 바깥쪽 여백이 있는 11×11 지도로 옮긴다. */
export function restoreGame(raw: string): Game | null {
  try {
    const saved = JSON.parse(raw) as Game;
    if (!saved || !Array.isArray(saved.tiles) || ![81,SIZE*SIZE].includes(saved.tiles.length) || !saved.factions || !Array.isArray(saved.unlocked) ||
      !Number.isInteger(saved.demand) || saved.demand < 0 || saved.demand >= PRODUCTS.length || !Number.isInteger(saved.contract) || saved.contract < 0 ||
      !Number.isFinite(saved.nextDemand) || !Number.isFinite(saved.time) || saved.time < 0 || !Number.isFinite(saved.nextIncome) || !saved.nextAI ||
      !Number.isFinite(saved.nextAI[2]) || !Number.isFinite(saved.nextAI[3]) || !['playing','won','lost'].includes(saved.status)) return null;
    if (!saved.tiles.every(t => t && Object.hasOwn(TERRAIN,t.terrain) && [0,1,2,3].includes(t.owner) && [0,1,2,3].includes(t.capital) &&
      (t.structure === null || Object.hasOwn(BUILDINGS,t.structure)) && Number.isInteger(t.product) && t.product >= 0 && t.product < PRODUCTS.length &&
      Number.isInteger(t.staff) && t.staff >= 0 && t.staff <= 3)) return null;
    for (const side of [1,2,3] as const) { const f=saved.factions[side]; if (!f || !Number.isFinite(f.gold) || !Number.isFinite(f.troops) || !Number.isFinite(f.soldiers) || !Number.isFinite(f.stock) || typeof f.alive !== 'boolean') return null; }
    if (!Array.isArray(saved.log) || !saved.log.every(x => typeof x === 'string') || !saved.unlocked.every(x => Number.isInteger(x) && x >= 0 && x < PRODUCTS.length)) return null;
    const legacy = saved.tiles.length === 81;
    const defaults = newGame();
    const tiles = legacy ? defaults.tiles.map(t => ({...t, owner:0, capital:0, structure:null, product:0, staff:0, level:0} as Tile)) : saved.tiles;
    if (legacy) for (let i=0;i<81;i++) tiles[(Math.floor(i/9)+1)*SIZE+(i%9)+1] = saved.tiles[i];
    for (const t of tiles) t.level = t.structure ? (Number.isInteger(t.level) && t.level >= 1 && t.level <= 3 ? t.level : 1) : 0;
    const levels = { ...defaults.research };
    for (const id of Object.keys(RESEARCH) as Research[]) {
      const n = saved.research?.[id]; if (Number.isInteger(n) && n >= 0 && n <= 3) levels[id] = n;
    }
    const activeEvent = saved.event && Number.isInteger(saved.event.kind) && saved.event.kind >= 0 && saved.event.kind < CITY_EVENTS.length && Number.isFinite(saved.event.expiresAt) && saved.event.expiresAt > saved.time ? saved.event : null;
    const d = saved.delivery;
    const delivery = d && Number.isInteger(d.product) && d.product >= 0 && d.product < PRODUCTS.length && Number.isFinite(d.stock) && d.stock > 0 && d.stock <= 99 && Number.isFinite(d.reward) && d.reward >= 0 && Number.isFinite(d.expiresAt) && d.expiresAt > saved.time ? d : null;
    const b = saved.battle;
    const battle = !legacy && b && Number.isInteger(b.tile) && b.tile >= 0 && b.tile < SIZE*SIZE && [2,3].includes(b.defender) && Object.hasOwn(TACTICS,b.tactic) && Number.isFinite(b.committed) && b.committed > 0 && Number.isFinite(b.startedAt) && Number.isFinite(b.arrivesAt) ? b : null;
    return { ...defaults, ...saved, tiles, research:levels, event:activeEvent, delivery, battle,
      pacts:{2:Number.isFinite(saved.pacts?.[2]) ? Math.max(0,saved.pacts[2]) : 0, 3:Number.isFinite(saved.pacts?.[3]) ? Math.max(0,saved.pacts[3]) : 0},
      mapSeed:Number.isInteger(saved.mapSeed) ? saved.mapSeed >>> 0 : 917,
      deliveries:Number.isInteger(saved.deliveries) && saved.deliveries >= 0 ? saved.deliveries : 0,
      nextDelivery:Number.isFinite(saved.nextDelivery) ? saved.nextDelivery : saved.time + 45,
      policy:saved.policy && Object.hasOwn(POLICIES,saved.policy) ? saved.policy : 'balanced',
      difficulty:saved.difficulty && Object.hasOwn(DIFFICULTIES,saved.difficulty) ? saved.difficulty : 'standard',
      nextPolicyChange:Number.isFinite(saved.nextPolicyChange) ? saved.nextPolicyChange : 0,
      eventIndex:Number.isInteger(saved.eventIndex) && saved.eventIndex >= 0 ? saved.eventIndex : 0,
      nextEvent:Number.isFinite(saved.nextEvent) ? saved.nextEvent : saved.time + 45,
      era:Number.isInteger(saved.era) && saved.era >= 1 && saved.era <= 4 ? saved.era : 1,
      endless: saved.endless === true,
      status:legacy && saved.status === 'won' ? 'playing' : saved.status,
      battleFx:legacy ? null : saved.battleFx ?? null };
  } catch { return null; }
}
