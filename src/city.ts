import { advance, adjacent, BUILDINGS, build, canTake, cityRequirements, chooseProduct, CONTRACTS, defense, demolish, expand, GOAL, hire, hireCost, income, MILITARY_UNLOCK, militaryAttack, names, newGame, population, PRODUCTS, SIZE, START_TILE, TERRAIN, territoryCount, type Building, type Game } from './territory';
import { createCityMap, createInterior } from './cityMap';

const KEY = 'waldo.market-city.v1';
const $ = <T extends Element>(root: ParentNode, selector: string) => root.querySelector<T>(selector)!;
const fmt = (n: number) => Math.floor(n).toLocaleString('ko-KR');
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const icons = { plain:'·', forest:'♧', hill:'▲', ruins:'✦' };
const text = (root: ParentNode, selector: string, value: string) => { const e = $(root,selector); if (e.textContent !== value) e.textContent = value; };
function load(): Game | null {
  try {
    const raw = localStorage.getItem(KEY); if (!raw) return null;
    const g = JSON.parse(raw) as Game;
    if (!Array.isArray(g.tiles) || g.tiles.length !== SIZE*SIZE || !g.factions || !Array.isArray(g.unlocked) || !Number.isInteger(g.demand) || g.demand < 0 || g.demand >= PRODUCTS.length || !Number.isInteger(g.contract) || g.contract < 0 || !Number.isFinite(g.nextDemand) || !Number.isFinite(g.time) || !Number.isFinite(g.nextIncome) || !g.nextAI || !Number.isFinite(g.nextAI[2]) || !Number.isFinite(g.nextAI[3]) || !['playing','won','lost'].includes(g.status)) return null;
    if (!g.tiles.every(t => t && t.terrain in TERRAIN && [0,1,2,3].includes(t.owner) && [0,1,2,3].includes(t.capital) && (t.structure === null || t.structure in BUILDINGS) && Number.isInteger(t.product) && t.product >= 0 && t.product < PRODUCTS.length && Number.isInteger(t.staff) && t.staff >= 0 && t.staff <= 3)) return null;
    for (const side of [1,2,3] as const) { const f = g.factions[side]; if (!f || !Number.isFinite(f.gold) || !Number.isFinite(f.troops) || !Number.isFinite(f.soldiers) || !Number.isFinite(f.stock) || typeof f.alive !== 'boolean') return null; }
    if (!Array.isArray(g.log) || !g.log.every(x => typeof x === 'string') || !g.unlocked.every(x => Number.isInteger(x) && x >= 0 && x < PRODUCTS.length)) return null;
    return g;
  } catch { return null; }
}
function save(g: Game) { try { localStorage.setItem(KEY, JSON.stringify(g)); } catch { /* session only */ } }
export function mountCity(root: HTMLElement): void {
  let game = load() ?? newGame();
  let selected = START_TILE + 1, paused = true, last = performance.now(), lastSave = 0, lastRender = 0;
  let boardSignature = '', detailSignature = '', shownResult = '', resumeAfterModal = false;
  let interior: { dispose: () => void } | null = null;
  root.innerHTML = `<div class="city-app"><header class="city-header"><div class="city-brand"><span class="city-logo">◈</span><div><b>달빛 상권</b><small>MOONLIGHT DISTRICT</small></div></div><div class="header-note"><span class="live-lamp"></span> 실시간 도시 경영 <i></i> 세 회사의 경쟁</div><div class="header-tools"><button data-action="pause" class="header-button">일시정지</button><button data-action="help" class="header-button">게임 방법</button><button data-action="reset-dialog" class="header-icon" aria-label="새 게임">↻</button></div></header>
  <main class="city-layout"><section class="map-panel"><div class="map-topline"><div><span class="eyebrow-city">THE NIGHT MARKET / 01</span><h1>우리의 도시를 키워요<span>.</span></h1><p>상권을 넓히고 시설을 지어 경쟁 회사를 앞서세요.</p></div><div class="clock-label"><span>다음 정산</span><b id="income-clock">6초</b></div></div>
  <div class="resource-bar"><div><span>보유 골드</span><strong id="gold">0</strong><small> G</small><em id="gold-rate"></em></div><div><span>영업력</span><strong id="influence">0</strong><small> 점</small><em id="influence-rate"></em></div><div><span>도시 인구</span><strong id="people">0</strong><small> 명</small><em>주거시설로 증가</em></div><div><span>물자 재고</span><strong id="stock">0</strong><small> 개</small><em id="stock-rate"></em></div><div><span>보유 병력</span><strong id="soldiers">0</strong><small> 명</small><em id="military-rate">후반 콘텐츠</em></div></div><div class="market-signal"><span>MARKET SIGNAL</span><b id="demand-name"></b><small id="demand-time"></small><em>인기 상품 매출 +4G</em></div>
  <div class="map-frame"><div class="map-frame-head"><div><span class="map-dot"></span> DISTRICT MAP <span class="map-subtitle">상권 지도</span></div><div class="map-tools"><button data-action="zoom-out" aria-label="지도 축소">−</button><button data-action="zoom-in" aria-label="지도 확대">+</button><span id="time-label">00:00</span></div></div><div class="city-map" role="group" aria-label="도시 상권 지도"></div><div class="map-legend"><span><i class="legend-player"></i>내 회사</span><span><i class="legend-moon"></i>월광상단</span><span><i class="legend-fox"></i>여우상회</span><span><i class="legend-neutral"></i>미개발</span><small>인접한 상권부터 확보할 수 있어요</small></div></div></section>
  <aside class="city-sidebar"><div class="sidebar-heading"><div><span class="eyebrow-city">YOUR BUSINESS</span><h2>도시 운영</h2></div><span class="company-badge">등불상회</span></div><section class="district-card"><div id="district-detail"></div><div id="district-controls"></div></section><section class="contract-note"><span>도시 계약</span><strong id="contract-name"></strong><small id="contract-progress"></small></section><div class="section-label"><span>경쟁 현황</span><small>MARKET SHARE</small></div><div class="rival-list"><div class="rival"><i class="legend-player"></i><div><b>등불상회 <small>내 회사</small></b><div class="rival-track"><i id="bar-1"></i></div></div><strong id="count-1"></strong></div><div class="rival"><i class="legend-moon"></i><div><b>월광상단 <small>AI</small></b><div class="rival-track"><i id="bar-2"></i></div></div><strong id="count-2"></strong></div><div class="rival"><i class="legend-fox"></i><div><b>여우상회 <small>AI</small></b><div class="rival-track"><i id="bar-3"></i></div></div><strong id="count-3"></strong></div></div><div class="goal-note"><span>✦</span><p><b>도시의 대표 기업</b><br><span id="goal-detail"></span><br>또는 경쟁 회사의 본점을 모두 인수하면 승리합니다.</p></div><div class="section-label"><span>도시 소식</span><small>LIVE FEED</small></div><div class="city-feed" aria-live="polite"></div><div class="sidebar-foot">WALDO CITY <span>·</span> 작은 상점에서 시작하는 도시</div></aside></main><div class="mobile-dock"><div><span id="dock-owner"></span><b id="dock-title"></b></div><button id="dock-battle" data-action="battle" hidden>출동</button><button id="dock-action"></button></div><div class="city-message" role="status"></div><div class="city-modal-root"></div></div>`;
  const app = $('.city-app') as HTMLElement;
  const map3d = createCityMap($('.city-map') as HTMLElement, i => { selected=i; detailSignature=''; render(); });
  function $(selector: string): Element { return root.querySelector(selector)!; }
  function message(s: string) { const el = $('.city-message') as HTMLElement; el.textContent = s; el.classList.add('show'); window.setTimeout(() => el.classList.remove('show'), 2200); }
  function showModal(kind: 'intro' | 'help' | 'build' | 'products' | 'interior' | 'reset' | 'result') {
    interior?.dispose(); interior = null;
    const wrap = $('.city-modal-root') as HTMLElement;
    const close = `<button class="modal-close" data-action="close" aria-label="닫기">×</button>`;
    let body = '';
    if (kind === 'intro' || kind === 'help') {
      if (kind === 'intro') paused = true;
      body = `<div class="city-modal narrow">${kind === 'help' ? close : ''}<span class="eyebrow-city">WELCOME TO WALDO CITY</span><h2>작은 상점에서<br>도시의 대표 기업까지.</h2><p class="modal-lead">상대 AI도 실시간으로 도시를 키웁니다. 지도에서 인접한 상권을 확보하고, 어떤 시설에 투자할지 결정하세요.</p><div class="guide-list"><div><b>01</b><span><strong>상권 확보</strong><small>빈 땅은 골드로, 경쟁 상권은 영업력으로 인수해요.</small></span></div><div><b>02</b><span><strong>도시 건설</strong><small>시설을 짓고 내부에서 직원을 고용하세요. 인기 상품과 물자도 관리해야 합니다.</small></span></div><div><b>03</b><span><strong>후반 전략</strong><small>상권 ${MILITARY_UNLOCK}곳을 확보하면 군사 훈련소와 전투가 열립니다.</small></span></div></div><button class="modal-primary" data-action="start">${kind === 'intro' ? '도시 경영 시작하기' : '계속하기'} <span>→</span></button></div>`;
    } else if (kind === 'build') {
      const count = territoryCount(game,1);
      body = `<div class="city-modal wide">${close}<span class="eyebrow-city">BUILD YOUR CITY</span><h2>어떤 시설을 지을까요?</h2><p class="modal-lead">시설은 상권마다 하나씩 지을 수 있습니다. 정산은 6초마다 이루어져요.</p><div class="choice-grid">${(Object.entries(BUILDINGS) as [Building, typeof BUILDINGS[Building]][]).map(([id,b]) => `<button class="facility-choice" data-build="${id}" ${count < b.requires || game.factions[1].gold < b.cost || game.cooldown > 0 ? 'disabled' : ''}><span class="choice-icon">${b.icon}</span><span><b>${b.name}</b><small>${b.detail}</small><em>${count < b.requires ? `상권 ${b.requires}곳 필요` : `${b.cost} G`}</em></span></button>`).join('')}</div></div>`;
    } else if (kind === 'products') {
      const t = game.tiles[selected];
      body = `<div class="city-modal wide">${close}<span class="eyebrow-city">PRODUCT COLLECTION</span><h2>무엇을 판매할까요?</h2><p class="modal-lead">새 상품은 한 번만 개발하면 다른 상점에서도 팔 수 있어요. 상권 적합 +2G, 인기 상품 +4G. 상점은 정산마다 물자 1개를 소비합니다.</p><div class="choice-grid product-grid">${PRODUCTS.map((p,i) => { const unlocked = game.unlocked.includes(i); const selectedProduct = t?.product === i; return `<button class="facility-choice ${selectedProduct ? 'current' : ''}" data-product="${i}" ${game.cooldown > 0 || (!unlocked && game.factions[1].gold < p.cost) ? 'disabled' : ''}><span class="choice-icon">${['◌','♨','✧','◇','▤','✿','◆','◷','♫','✺','❀','★','▧','♦'][i]}</span><span><b>${p.name}${selectedProduct ? ' · 판매 중' : ''}</b><small>수익 +${p.income}${p.favorite === t?.terrain ? ' +2 적합' : ''}${i === game.demand ? ' +4 인기' : ''} G / 정산</small><em>${unlocked ? '상품 선택' : `개발 ${p.cost} G`}</em></span></button>`; }).join('')}</div></div>`;
    } else if (kind === 'interior') {
      const tile = game.tiles[selected];
      if (!tile.structure || tile.owner !== 1) return;
      const building = BUILDINGS[tile.structure];
      const effects: Record<Building,string> = { mine:'매출 +4G', housing:'인구 +8명', barracks:'영업력 +2', school:'영업력 +2', tower:'충성도 +2', factory:'물자 +2 · 매출 +2G', hospital:'충성도 +2', park:'매출 +2G · 영업력 +1', army:'병력 +2' };
      body = `<div class="city-modal interior-modal">${close}<div class="interior-heading"><span class="eyebrow-city">INSIDE THE BUILDING</span><h2>${building.name}</h2><p>${TERRAIN[tile.terrain].name} · 시설 내부</p></div><div class="interior-layout"><div class="interior-visual" aria-label="${building.name}의 3D 내부"></div><div class="interior-info"><span class="overline-interior">STAFF / 직원 관리</span><h3>직원 ${tile.staff} / 3명</h3><p>직원 한 명당 정산마다 ${effects[tile.structure]} 효과가 있습니다. 급여는 1G입니다.</p><div class="staff-slots">${[0,1,2].map(i=>`<span class="staff-slot ${i<tile.staff?'filled':''}">${i<tile.staff?'●':'+'}</span>`).join('')}</div><button class="modal-primary hire-button" data-action="hire" ${tile.staff >= 3 || game.cooldown > 0 || game.factions[1].gold < hireCost(tile.staff) ? 'disabled' : ''}>${tile.staff >= 3 ? '직원 정원 도달' : `직원 고용 · ${hireCost(tile.staff)}G`}</button>${tile.structure === 'mine' ? '<button class="interior-secondary" data-action="products">판매 상품 변경 →</button>' : ''}<button class="interior-tertiary" data-action="demolish">시설 정리 · ${Math.floor(building.cost / 2)}G 환급</button></div></div></div>`;
    } else if (kind === 'reset') {
      body = `<div class="city-modal narrow">${close}<span class="eyebrow-city">NEW GAME</span><h2>새 도시를 시작할까요?</h2><p class="modal-lead">현재 도시의 진행 상황이 지워지고 세 회사가 처음부터 다시 경쟁합니다.</p><div class="modal-actions"><button class="modal-secondary" data-action="close">돌아가기</button><button class="modal-primary danger" data-action="reset">새로 시작</button></div></div>`;
    } else {
      body = `<div class="city-modal narrow result-modal"><span class="eyebrow-city">${game.status === 'won' ? 'THE CITY IS YOURS' : 'A NEW BEGINNING'}</span><h2>${game.status === 'won' ? '도시의 대표 기업이<br>되었습니다.' : '경쟁에서 밀렸지만,<br>도시는 다시 시작됩니다.'}</h2><p class="modal-lead">${game.status === 'won' ? '작은 상점에서 시작해 도시를 키워냈어요.' : '다른 시설과 상권을 선택해 다시 도전해 보세요.'}</p><div class="result-stat"><span>확보한 상권 <b>${territoryCount(game,1)}곳</b></span><span>도시 인구 <b>${population(game,1)}명</b></span></div><button class="modal-primary" data-action="reset">새 도시 시작하기 →</button></div>`;
    }
    wrap.innerHTML = `<div class="city-shade">${body}</div>`; wrap.setAttribute('data-kind',kind);
    if (kind === 'interior' && game.tiles[selected].structure) interior = createInterior(wrap.querySelector<HTMLElement>('.interior-visual')!, game.tiles[selected].structure!, game.tiles[selected].staff);
    wrap.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({preventScroll:true});
  }
  function closeModal() { interior?.dispose(); interior=null; const wrap = $('.city-modal-root'); wrap.innerHTML = ''; wrap.removeAttribute('data-kind'); }
  function render() {
    const player = game.factions[1], inc = income(game,1), count = territoryCount(game,1);
    text(app,'#gold',fmt(player.gold)); text(app,'#stock',fmt(player.stock)); text(app,'#stock-rate', `+${inc.supply} / 소비 ${inc.used}${inc.shortage ? ' · 부족' : ''}`);
    text(app,'#demand-name', `인기 상품: ${PRODUCTS[game.demand].name}`); text(app,'#demand-time', `${Math.max(0,Math.ceil(game.nextDemand-game.time))}초 후 변경`);
    const contract = CONTRACTS[game.contract]; text(app,'#contract-name', contract?.name ?? '모든 계약 완료'); text(app,'#contract-progress', contract ? `${Math.min(contract.target,contract.progress(game))}/${contract.target} · 보상 ${contract.reward}G` : '도시의 모든 계약을 완료했어요'); text(app,'#influence',fmt(player.troops)); text(app,'#soldiers',fmt(player.soldiers)); text(app,'#people',fmt(population(game,1)));
    text(app,'#gold-rate', `+${inc.gold} / 정산`); text(app,'#influence-rate', `+${inc.troops} / 정산`); text(app,'#military-rate', inc.soldiers ? `+${inc.soldiers} / 정산` : `상권 ${MILITARY_UNLOCK}곳부터`);
    const city = cityRequirements(game); text(app,'#goal-detail', `상권 ${Math.min(count,GOAL)}/${GOAL} · 주거 ${Math.min(city.housing,2)}/2 · 기반시설 ${Math.min(city.services,3)}/3`);
    text(app,'#income-clock', `${Math.max(0,Math.ceil(game.nextIncome-game.time))}초`);
    text(app,'#time-label',`${String(Math.floor(game.time/60)).padStart(2,'0')}:${String(Math.floor(game.time%60)).padStart(2,'0')}`);
    text(app,'[data-action="pause"]', paused ? '게임 재개' : '일시정지');
    for (const side of [1,2,3] as const) { const n=territoryCount(game,side); text(app,`#count-${side}`,`${n}곳`); ($(`#bar-${side}`) as HTMLElement).style.width=`${Math.min(100,n/GOAL*100)}%`; }
    const boardSig = `${selected}|${game.battleFx?.tile ?? '-'}|` + game.tiles.map(t => `${t.owner}${t.structure ?? '-'}${t.capital}${t.product}`).join(',');
    if (boardSig !== boardSignature) {
      boardSignature = boardSig;
      if (map3d) map3d.draw(game, selected);
      else $('.city-map').innerHTML = game.tiles.map((t,i) => {
        const near = t.owner !== 1 && adjacent(game,i,1), building = t.structure ? BUILDINGS[t.structure] : null;
        const title = `${TERRAIN[t.terrain].name}, ${t.owner ? names[t.owner as 1|2|3] : '미개발'}${t.capital ? ' 본점' : ''}${building ? `, ${building.name}` : ''}`;
        return `<button class="map-tile terrain-${t.terrain} owner-${t.owner} ${near ? 'frontier' : ''} ${i===selected ? 'selected' : ''}" data-tile="${i}" aria-label="${title}" aria-pressed="${i===selected}"><span class="tile-art">${t.capital ? '✹' : building ? building.icon : icons[t.terrain]}</span>${t.capital ? '<span class="tile-capital">본점</span>' : building ? `<span class="tile-building">${building.name}</span>` : ''}${near ? '<span class="frontier-mark">+</span>' : ''}</button>`;
      }).join('');
    }
    const t = game.tiles[selected], near = adjacent(game,selected,1), ownerName = t.owner ? names[t.owner as 1|2|3] : '미개발 상권';
    const ds = `${selected}|${t.owner}|${t.structure}|${t.capital}|${t.product}|${t.staff}|${near}`;
    if (ds !== detailSignature) {
      detailSignature = ds;
      $('#district-detail').innerHTML = `<div class="district-label"><span class="district-icon terrain-${t.terrain}">${icons[t.terrain]}</span><div><span>${ownerName}</span><h3>${TERRAIN[t.terrain].name}${t.capital ? ' · 본점' : ''}</h3></div></div><p>${t.owner === 1 ? t.structure ? `${BUILDINGS[t.structure].name}${t.structure === 'mine' ? ` · ${PRODUCTS[t.product].name} 판매 중` : ''}` : '아직 시설이 없는 내 상권입니다.' : t.owner === 0 ? `확보 비용 ${TERRAIN[t.terrain].claim}G · 정산 수익 +${TERRAIN[t.terrain].income}G` : `인수에 필요한 영업력 ${defense(t)} · 본점 인수 시 해당 회사는 퇴출`}</p>`;
      $('#district-controls').innerHTML = t.owner === 1 ? t.structure ? `<button class="district-primary" data-action="interior">건물 입장 · 직원 ${t.staff}명 <span>→</span></button>` : `<button class="district-primary" data-action="build">시설 짓기 <span>→</span></button>` : !near ? `<div class="built-label">내 상권과 맞닿은 곳부터 확장할 수 있어요.</div>` : `<button class="district-primary" data-action="expand">${t.owner === 0 ? `상권 확보 · ${TERRAIN[t.terrain].claim}G` : `상권 인수 · 영업력 ${defense(t)}`} <span>→</span></button>${t.owner !== 0 && count >= MILITARY_UNLOCK ? `<button class="district-secondary" data-action="battle">군대 출동 · 병력 ${defense(t)}</button>` : ''}`;
    }
    text(app, '#dock-owner', ownerName);
    text(app, '#dock-title', TERRAIN[t.terrain].name + (t.capital ? ' · 본점' : ''));
    const dock = root.querySelector<HTMLButtonElement>('#dock-action')!;
    const dockBattle = root.querySelector<HTMLButtonElement>('#dock-battle')!;
    dockBattle.hidden = !(t.owner !== 0 && t.owner !== 1 && near && count >= MILITARY_UNLOCK);
    dockBattle.disabled = player.soldiers < defense(t) || game.cooldown > 0 || paused;
    if (t.owner === 1 && !t.structure) { dock.dataset.action='build'; dock.textContent='시설 짓기'; dock.disabled = paused || game.cooldown > 0; }
    else if (t.owner === 1 && t.structure) { dock.dataset.action='interior'; dock.textContent='건물 입장'; dock.disabled = paused || game.cooldown > 0; }
    else if (!near) { dock.dataset.action=''; dock.textContent='인접 상권 필요'; dock.disabled=true; }
    else { dock.dataset.action='expand'; dock.textContent=t.owner === 0 ? `확보 ${TERRAIN[t.terrain].claim}G` : `인수 ${defense(t)}영업력`; dock.disabled=paused || game.cooldown > 0 || !canTake(game,selected); }
    const expandBtn = root.querySelector<HTMLButtonElement>('[data-action="expand"]'); if (expandBtn) expandBtn.disabled = !canTake(game,selected) || game.cooldown > 0 || paused;
    const battleBtn = root.querySelector<HTMLButtonElement>('[data-action="battle"]'); if (battleBtn) battleBtn.disabled = player.soldiers < defense(t) || game.cooldown > 0 || paused;
    const buildBtn = root.querySelector<HTMLButtonElement>('[data-action="build"]'); if (buildBtn) buildBtn.disabled = game.cooldown > 0 || paused;
    const demolishBtn = root.querySelector<HTMLButtonElement>('[data-action="demolish"]'); if (demolishBtn) demolishBtn.disabled = game.cooldown > 0 || paused;
    const interiorBtn = root.querySelector<HTMLButtonElement>('[data-action="interior"]'); if (interiorBtn) interiorBtn.disabled = paused;
    const productBtn = root.querySelector<HTMLButtonElement>('[data-action="products"]'); if (productBtn) productBtn.disabled = game.cooldown > 0 || paused;
    $('.city-feed').innerHTML = game.log.slice(0,4).map((line,i)=>`<div><span>${i===0?'●':'·'}</span>${escape(line)}</div>`).join('');
    const kind = $('.city-modal-root').getAttribute('data-kind');
    if (kind === 'interior') { const tile=game.tiles[selected]; if (tile.owner !== 1 || !tile.structure) { closeModal(); message('이 상권의 소유권이 변경됐습니다.'); } else { const h=root.querySelector<HTMLButtonElement>('[data-action="hire"]'); if(h) h.disabled=paused || game.cooldown>0 || tile.staff>=3 || player.gold<hireCost(tile.staff); } }
    if (kind === 'build') for (const b of root.querySelectorAll<HTMLButtonElement>('[data-build]')) { const def=BUILDINGS[b.dataset.build as Building]; b.disabled = count < def.requires || player.gold < def.cost || game.cooldown > 0 || game.tiles[selected].owner !== 1 || !!game.tiles[selected].structure; }
    if (kind === 'products') for (const b of root.querySelectorAll<HTMLButtonElement>('[data-product]')) { const i=Number(b.dataset.product); b.disabled = game.cooldown > 0 || (!game.unlocked.includes(i) && player.gold < PRODUCTS[i].cost) || game.tiles[selected].owner !== 1 || game.tiles[selected].structure !== 'mine'; }
    if (game.status !== 'playing' && shownResult !== game.status) { shownResult = game.status; paused = true; showModal('result'); }
  }
  app.addEventListener('click', event => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button'); if (!button || button.disabled) return;
    if (button.dataset.tile !== undefined) { selected = Number(button.dataset.tile); detailSignature=''; render(); return; }
    if (button.dataset.build) { const b=button.dataset.build as Building; if (build(game,selected,b)) { closeModal(); detailSignature=''; message(`${BUILDINGS[b].name} 완공`); save(game); } }
    else if (button.dataset.product !== undefined) { const i=Number(button.dataset.product); if (chooseProduct(game,selected,i)) { closeModal(); detailSignature=''; message(`${PRODUCTS[i].name} 판매 시작`); save(game); } }
    else switch (button.dataset.action) {
      case 'expand': if (expand(game,selected)) { detailSignature=''; message('상권을 확보했습니다'); save(game); } break;
      case 'battle': if (militaryAttack(game,selected)) { detailSignature=''; message('전투에서 승리했습니다'); save(game); } break;
      case 'zoom-in': map3d?.zoom(.85); break;
      case 'zoom-out': map3d?.zoom(1.18); break;
      case 'pause': paused=!paused; last=performance.now(); break;
      case 'help': resumeAfterModal=!paused; paused=true; showModal('help'); break;
      case 'build': showModal('build'); break;
      case 'demolish': if (demolish(game,selected)) { closeModal(); detailSignature=''; message('시설을 정리했습니다'); save(game); } break;
      case 'interior': showModal('interior'); break;
      case 'hire': if (hire(game,selected)) { detailSignature=''; showModal('interior'); message('직원을 고용했습니다'); save(game); } break;
      case 'products': showModal('products'); break;
      case 'reset-dialog': resumeAfterModal=!paused; paused=true; showModal('reset'); break;
      case 'close': closeModal(); if (resumeAfterModal) { paused=false; last=performance.now(); } resumeAfterModal=false; break;
      case 'start': closeModal(); paused=false; last=performance.now(); break;
      case 'reset': game=newGame(); selected=START_TILE + 1; boardSignature=''; detailSignature=''; shownResult=''; paused=false; last=performance.now(); closeModal(); save(game); break;
    }
    render();
  });
  window.addEventListener('pagehide',()=>save(game));
  document.addEventListener('visibilitychange',()=>{ if (document.hidden) { paused=true; save(game); } last=performance.now(); });
  function frame(now: number) { const dt=Math.max(0,Math.min(.25,(now-last)/1000)); last=now; if (!paused && !document.hidden) advance(game,dt); if(now-lastRender>150) {render(); lastRender=now;} if(now-lastSave>3000) {save(game); lastSave=now;} requestAnimationFrame(frame); }
  render(); showModal('intro'); requestAnimationFrame(frame);
}
