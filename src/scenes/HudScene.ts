import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { AudioBridge } from "../render/AudioBridge";
import { formatTime, ICONS, mount } from "../ui";
import type { World } from "../sim";
import { DASH_COOLDOWN } from "../sim/systems/playerAbilities";
export class HudScene extends Phaser.Scene {
  private world!: Readonly<World>;
  private ui!: HTMLDivElement;
  private trial = 0;
  private build = "";
  private toggle!: () => void;
  private home!: () => void;
  private dash!: () => void;
  private pulse!: () => void;
  private lastHit = 0;
  constructor() {
    super("Hud");
  }
  init(data: {
    world: World;
    trial: number;
    toggle: () => void;
    home: () => void;
    dash: () => void;
    pulse: () => void;
  }): void {
    this.world = data.world;
    this.trial = data.trial;
    this.toggle = data.toggle;
    this.home = data.home;
    this.dash = data.dash;
    this.pulse = data.pulse;
    this.build = "";
    this.lastHit = 0;
  }
  create(): void {
    this.ui = mount(
      this,
      "hud",
      `<div class="rear-warning" id="rear"></div><div class="fps-reticle" aria-hidden="true"></div><div class="touch-stick" hidden aria-hidden="true"><i></i></div><div class="xpbar"><i id="xp"></i></div><div class="hud-top"><div class="vitals"><div class="vitals-label"><span>파수꾼 <span id="level"></span></span><span id="hp"></span></div><div class="bar"><i id="health"></i></div></div><div class="clock"><b id="time">00:00</b><small id="stage"></small><small id="curse"></small></div><div class="hud-buttons"><button class="sound-button" id="sound" aria-label="소리 켜기 또는 끄기"></button><button class="sound-button" id="pause" aria-label="일시정지">Ⅱ</button></div></div><div class="boss" hidden><span>밤의 군주</span><div class="bar"><i></i></div></div><div class="hud-bottom"><div class="inventory"></div><div class="run-info"><span id="kills"></span><br><span class="keyboard-hint">${this.world.firstPerson ? "WASD 이동 · 클릭 발사 · Q/E 회전 · SHIFT 회피 · SPACE 폭발" : "WASD 이동 · F 발사 · SHIFT 회피 · SPACE 폭발"} · ESC 일시정지</span></div></div><div class="touch-hint">${this.world.firstPerson ? "왼쪽 이동 · 오른쪽 누르고 조준·발사" : "드래그해 이동·발사"}</div>`,
    );
    this.ui.querySelector("#pause")!.addEventListener("click", this.toggle);
    const hitmark = document.createElement("div");
    hitmark.className = "hit-marker";
    hitmark.setAttribute("aria-hidden", "true");
    hitmark.textContent = "×";
    this.ui.append(hitmark);
    const objective = document.createElement("div");
    objective.className = "beacon-objective";
    objective.hidden = true;
    this.ui.append(objective);
    const actions = document.createElement("div");
    actions.className = "combat-actions";
    actions.innerHTML = `<button class="ability dash-ability" aria-label="회피"><span class="ability-key">SHIFT</span><b>회피</b><small></small><i></i></button><button class="ability pulse-ability" aria-label="빛 폭발"><span class="ability-key">SPACE</span><b>빛 폭발</b><small></small><i></i></button>`;
    this.ui.append(actions);
    actions.querySelector<HTMLButtonElement>(".dash-ability")!.addEventListener("click", (e) => { this.dash(); (e.currentTarget as HTMLButtonElement).blur(); });
    actions.querySelector<HTMLButtonElement>(".pulse-ability")!.addEventListener("click", (e) => { this.pulse(); (e.currentTarget as HTMLButtonElement).blur(); });
    const sound = this.ui.querySelector<HTMLButtonElement>("#sound")!;
    const sync = () => {
      sound.textContent = AudioBridge.muted ? "◇" : "♪";
      sound.setAttribute("aria-label", "소리");
      sound.setAttribute("aria-pressed", String(!AudioBridge.muted));
    };
    sync();
    sound.onclick = () => {
      AudioBridge.toggle();
      sync();
    };
    if (this.world.curseDeadline === undefined)
      this.announce("속삭이는 숲", "2분간 살아남으세요");
    else this.announce("저주받은 시련", "저주가 닥치기 전에 불씨를 모으세요");
  }
  showHit(kill: boolean): void {
    const now = performance.now();
    if (!kill && now - this.lastHit < 100) return;
    this.lastHit = now;
    const marker = this.ui.querySelector<HTMLElement>(".hit-marker")!;
    marker.className = "hit-marker";
    void marker.offsetWidth;
    marker.classList.add(kill ? "kill" : "hit");
  }
  showTouchStick(touch: { x: number; y: number; dx: number; dy: number } | null): void {
    const stick = this.ui.querySelector<HTMLElement>(".touch-stick")!;
    stick.hidden = !touch;
    if (!touch) return;
    const length = Math.max(1, Math.hypot(touch.dx, touch.dy));
    stick.style.left = `${touch.x / GAME_WIDTH * 100}%`;
    stick.style.top = `${touch.y / GAME_HEIGHT * 100}%`;
    const knob = stick.querySelector<HTMLElement>("i")!;
    knob.style.transform = `translate(${touch.dx / length * 100}%, ${touch.dy / length * 100}%)`;
  }
  showDamage(): void {
    this.ui.classList.remove("hurt");
    void this.ui.offsetWidth;
    this.ui.classList.add("hurt");
  }
  announce(label: string, message: string): void {
    this.ui.querySelector(".toast")?.remove();
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `<small>${label}</small><b>${message}</b>`;
    this.ui.append(t);
    this.time.delayedCall(4000, () => t.remove());
  }
  update(): void {
    const w = this.world,
      p = w.player;
    this.ui.classList.toggle("low-health", p.hp > 0 && p.hp / p.stats.maxHp <= 0.25);
    const dash = this.ui.querySelector<HTMLButtonElement>(".dash-ability")!;
    const pulse = this.ui.querySelector<HTMLButtonElement>(".pulse-ability")!;
    dash.classList.toggle("ready", p.dashCooldown <= 0);
    pulse.classList.toggle("ready", p.pulseCharge >= 100);
    dash.querySelector("small")!.textContent = p.dashCooldown > 0 ? `${p.dashCooldown.toFixed(1)}초` : "준비됨";
    pulse.querySelector("small")!.textContent = p.pulseCharge >= 100 ? "준비됨" : `${Math.floor(p.pulseCharge)}%`;
    dash.querySelector<HTMLElement>("i")!.style.width = `${(1 - p.dashCooldown / DASH_COOLDOWN) * 100}%`;
    pulse.querySelector<HTMLElement>("i")!.style.width = `${p.pulseCharge}%`;
    const objective = this.ui.querySelector<HTMLElement>(".beacon-objective")!;
    objective.hidden = !w.beacon;
    if (w.beacon) {
      const dx = w.beacon.x - p.x, dy = w.beacon.y - p.y;
      const fx = w.firstPerson ? p.faceX : 0, fy = w.firstPerson ? p.faceY : -1;
      const angle = Math.atan2(fx * dy - fy * dx, fx * dx + fy * dy);
      const arrow = Math.abs(angle) < 0.45 ? "↑" : Math.abs(angle) > 2.7 ? "↓" : angle > 0 ? "→" : "←";
      objective.textContent = `${arrow} 빛의 봉화 · ${Math.ceil(Math.hypot(dx, dy) / 30)}걸음 · ${Math.max(0, Math.ceil(w.beacon.expiresAt - w.time))}초`;
    }
    const text = (id: string, v: string) => {
      const el = this.ui.querySelector(id)!;
      if (el.textContent !== v) el.textContent = v;
    };
    text("#level", `LV.${p.level}`);
    text("#hp", `${Math.ceil(Math.max(0, p.hp))} / ${p.stats.maxHp}`);
    text("#time", formatTime(w.time));
    text(
      "#curse",
      w.curseDeadline === undefined
        ? ""
        : `시련 ${this.trial}/5 · 저주까지 ${Math.max(0, Math.ceil(w.curseDeadline - w.time - 1e-7))}초`,
    );
    let behind = false;
    for (let i = 0; w.firstPerson && i < w.enemies.count; i++) {
      const dx = w.enemies.x[i] - p.x,
        dy = w.enemies.y[i] - p.y;
      if (dx * dx + dy * dy < 75 * 75 && dx * p.faceX + dy * p.faceY < -10) {
        behind = true;
        break;
      }
    }
    text("#rear", behind ? "▼ 후방 접근" : "");
    text(
      "#stage",
      w.stage.bossSpawned
        ? "FINAL / 밤의 군주"
        : `${["01 / 속삭이는 숲", "02 / 잊힌 폐허", "03 / 달빛 성역"][w.stage.index]} · ${formatTime(Math.max(0, Math.ceil(w.data.stages.stages[w.stage.index].duration - w.stage.time)))}`,
    );
    text(
      "#kills",
      `${w.stats.kills} 처치 · ${w.stats.score.toLocaleString()} 점수`,
    );
    (this.ui.querySelector("#health") as HTMLElement).style.width =
      `${Math.max(0, p.hp / p.stats.maxHp) * 100}%`;
    (this.ui.querySelector("#xp") as HTMLElement).style.width =
      `${(p.xp / p.xpToNext) * 100}%`;
    const items = [
      ...p.weapons.map((x) => ({
        id: w.data.weapons[x.def].id,
        name: w.data.weapons[x.def].name,
        level: x.level,
      })),
      ...p.passives.map((x) => ({
        id: w.data.passives[x.def].id,
        name: w.data.passives[x.def].name,
        level: x.level,
      })),
    ];
    const signature = items.map((x) => `${x.id}:${x.level}`).join();
    if (signature !== this.build) {
      this.build = signature;
      this.ui.querySelector(".inventory")!.innerHTML = items
        .map(
          (x) =>
            `<div class="slot" title="${x.name} Lv.${x.level}">${ICONS[x.id]}<small>${x.level}</small></div>`,
        )
        .join("");
    }
    const boss = this.ui.querySelector<HTMLElement>(".boss")!;
    boss.hidden = !w.stage.bossSpawned;
    if (w.stage.bossSpawned) {
      for (let i = 0; i < w.enemies.count; i++) {
        if (w.enemies.id[i] === w.stage.bossId) {
          boss.querySelector<HTMLElement>("i")!.style.width =
            `${Math.max(0, w.enemies.hp[i] / (w.data.enemies[w.enemies.kind[i]].hp * w.data.stages.boss.hpScale)) * 100}%`;
          break;
        }
      }
    }
    const menu = this.ui.querySelector(".pause-overlay");
    if (w.paused && !menu) {
      const el = document.createElement("div");
      el.className = "modal-shade pause-overlay";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-modal", "true");
      el.setAttribute("aria-label", "일시정지");
      el.innerHTML =
        '<section class="modal pause-menu"><div class="eyebrow">TAKE A BREATH</div><h2>잠시, 숨을 고르세요</h2><p>숲은 당신을 기다립니다.</p><button class="primary" id="resume">계속하기 <span>→</span></button><button class="text-button" id="exit">타이틀로 돌아가기</button></section>';
      this.ui.append(el);
      el.querySelector("#resume")!.addEventListener("click", this.toggle);
      el.querySelector("#exit")!.addEventListener("click", this.home);
      el.querySelector<HTMLButtonElement>("#resume")?.focus({ preventScroll: true });
    } else if (!w.paused && menu) {
      menu.remove();
      this.ui.querySelector<HTMLButtonElement>("#pause")?.focus({ preventScroll: true });
    }
  }
}
