import Phaser from "phaser";
import { IMAGE_ASSETS } from "./assets";
import type { State, Unit, GameEvent } from "./engine";
import type { Soundscape } from "./audio";
export const actorX = (u: Unit, enemy = false) =>
  u.name === "The Last Bellkeeper"
    ? 1030
    : u.name === "Bound Echo"
      ? 1350
      : enemy
        ? 1000 + (u.rank - 1) * 173
        : 660 - (u.rank - 1) * 153;
export class BattleStage extends Phaser.Scene {
  private backdrop!: Phaser.GameObjects.Image;
  private actors = new Map<string, Phaser.GameObjects.Container>();
  private sprites = new Map<string, Phaser.GameObjects.Image>();
  private rings = new Map<string, Phaser.GameObjects.Ellipse>();
  private idleTweens: Phaser.Tweens.Tween[] = [];
  private ambience?: Phaser.GameObjects.Particles.ParticleEmitter;
  private fire?: Phaser.GameObjects.Particles.ParticleEmitter;
  private current = "";
  private ready = false;
  private pending?: State;
  private callback: () => void;
  private audio: Soundscape;
  reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  constructor(audio: Soundscape, callback: () => void) {
    super("cathedral");
    this.audio = audio;
    this.callback = callback;
  }
  preload() {
    for (const [key, file] of Object.entries(IMAGE_ASSETS))
      this.load.image(key, "assets/exported/" + file);
  }
  create() {
    this.backdrop = this.add.image(800, 450, "camp").setDisplaySize(1600, 900);
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff);
    g.fillCircle(4, 4, 4);
    g.generateTexture("mote", 8, 8);
    g.destroy();
    this.ambience = this.add
      .particles(800, 750, "mote", {
        x: { min: -800, max: 800 },
        y: { min: -300, max: 130 },
        speedY: { min: -12, max: -35 },
        speedX: { min: -9, max: 9 },
        lifespan: 6500,
        frequency: 160,
        scale: { start: 0.35, end: 0 },
        alpha: { start: 0.35, end: 0 },
        tint: 0xd4ae70,
        blendMode: "ADD",
      })
      .setDepth(8);
    this.fire = this.add
      .particles(800, 580, "mote", {
        x: { min: -16, max: 16 },
        speedY: { min: -110, max: -55 },
        speedX: { min: -13, max: 13 },
        lifespan: 750,
        frequency: 22,
        scale: { start: 2.7, end: 0 },
        alpha: { start: 0.7, end: 0 },
        tint: [0xe27735, 0xffc96b, 0xad4528],
        blendMode: "ADD",
      })
      .setDepth(2);
    if (this.reduced) {
      this.ambience.stop();
      this.fire.stop();
    }
    this.ready = true;
    if (this.pending) this.sync(this.pending);
    this.callback();
  }
  sync(s: State) {
    if (!this.ready) {
      this.pending = s;
      return;
    }
    const scene = s.screen;
    const bg =
      scene === "rest"
        ? "rest"
        : ["camp", "summary", "shop"].includes(scene)
          ? scene === "shop"
            ? "town"
            : "camp"
          : "dungeon";
    this.backdrop.setTexture(bg).setDisplaySize(1600, 900);
    const show = scene === "combat";
    this.fire?.setVisible(!this.reduced && ["camp", "rest"].includes(s.screen));
    this.fire?.setPosition(800, scene === "rest" ? 735 : 580);
    const signature = show
      ? `${s.run}-${s.floor}-${s.battle?.encounter}-${[...s.party, ...(s.battle?.enemies ?? [])].map((u) => `${u.id}:${u.kind}:${u.name}`).join("|")}`
      : "none";
    if (signature !== this.current) {
      for (const tween of this.idleTweens) tween.stop();
      for (const a of this.actors.values()) a.destroy();
      this.actors.clear();
      this.sprites.clear();
      this.rings.clear();
      this.current = signature;
      this.idleTweens = [];
      if (show)
        for (const [u, enemy] of [
          ...s.party.map((u) => [u, false] as const),
          ...s.battle!.enemies.map((u) => [u, true] as const),
        ])
          this.makeActor(u, enemy);
    }
    if (show)
      for (const u of [...s.party, ...s.battle!.enemies]) {
        const a = this.actors.get(u.id)!,
          sprite = this.sprites.get(u.id)!;
        a.setPosition(actorX(u, u.id.startsWith("enemy")), 580);
        a.setAlpha(u.hp > 0 ? 1 : 0.22);
        this.pose(u.id, false);
        sprite.setTint(u.hp > 0 ? 0xffffff : 0x616775);
        this.rings.get(u.id)!.setAlpha(0);
      }
  }
  private makeActor(u: Unit, enemy: boolean) {
    const boss = u.name === "The Last Bellkeeper";
    const x = actorX(u, enemy),
      container = this.add.container(x, 580).setDepth(enemy ? 3 : 4);
    const shadow = this.add.ellipse(0, -29, 145, 24, 0x000000, 0.6);
    const ring = this.add
      .ellipse(0, -29, 150, 29)
      .setStrokeStyle(2, 0xe4bf75)
      .setAlpha(0);
    const sprite = this.add
      .image(0, 0, boss ? "bellkeeper" : u.kind)
      .setOrigin(0.5, 1)
      .setDisplaySize(
        boss ? 290 : enemy ? 220 : 205,
        boss ? 435 : enemy ? 305 : 285,
      );
    container.add([shadow, ring, sprite]);
    this.actors.set(u.id, container);
    this.sprites.set(u.id, sprite);
    this.rings.set(u.id, ring);
    const idle = this.tweens.add({
      targets: sprite,
      y: -4,
      duration: 1800 + u.rank * 170,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
      paused: this.reduced,
    });
    this.idleTweens.push(idle);
  }
  setReduced(value: boolean) {
    this.reduced = value;
    for (const t of this.idleTweens) value ? t.pause() : t.resume();
    if (value) {
      this.ambience?.stop();
      this.fire?.stop();
    } else {
      this.ambience?.start();
      this.fire?.start();
    }
  }
  private pose(id: string, action: boolean) {
    const img = this.sprites.get(id);
    if (!img || !["fighter", "rogue", "cleric", "wizard"].includes(id)) return;
    const key = id + "-action";
    if (action && this.textures.exists(key)) {
      const size = id === "rogue" ? 360 : id === "fighter" ? 355 : 285;
      img.setTexture(key);
      const frame = img.frame;
      img
        .setDisplaySize((size * frame.realWidth) / frame.realHeight, size)
        .setOrigin(
          0.5,
          id === "rogue" ? 0.925 : id === "fighter" ? 0.927 : 1.025,
        );
    } else img.setTexture(id).setOrigin(0.5, 1).setDisplaySize(205, 285);
  }
  highlight(ids: string[]) {
    for (const [id, r] of this.rings) r.setAlpha(ids.includes(id) ? 1 : 0);
  }
  private tween(targets: object, props: object, duration: number) {
    return new Promise<void>((resolve) => {
      const ms = this.reduced ? 1 : duration;
      let timer: ReturnType<typeof setTimeout>;
      const tween = this.tweens.add({
        targets,
        ...props,
        duration: ms,
        onComplete: () => {
          clearTimeout(timer);
          resolve();
        },
      });
      /* Occluded browser windows may stop animation frames. Never lock combat behind them. */ timer =
        setTimeout(() => {
          tween.stop();
          Object.assign(targets, props);
          resolve();
        }, ms + 80);
    });
  }
  private async burst(x: number, y: number, color: number) {
    const p = this.add
      .particles(x, y, "mote", {
        speed: { min: 70, max: 210 },
        lifespan: 420,
        quantity: 15,
        scale: { start: 0.75, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: color,
        emitting: false,
        blendMode: "ADD",
      })
      .setDepth(20);
    p.explode(this.reduced ? 3 : 18);
    this.time.delayedCall(700, () => p.destroy());
  }
  async play(
    events: GameEvent[],
    onImpact: (event: GameEvent) => void = () => {},
  ) {
    for (const e of events) {
      const source = this.actors.get(e.source ?? ""),
        target = this.actors.get(e.target ?? "");
      if (e.kind === "move") {
        if (source && target) {
          const x = source.x;
          await Promise.all([
            this.tween(source, { x: target.x }, 320),
            this.tween(target, { x }, 320),
          ]);
        }
        continue;
      }
      if (e.kind === "turn") {
        this.audio.play("turn");
        continue;
      }
      if (e.kind === "death") {
        onImpact(e);
        if (target) await this.tween(target, { alpha: 0.22 }, 240);
        continue;
      }
      if (!target) continue;
      const tx = target.x,
        ty = target.y - 140;
      const color =
        e.kind === "hit" && !e.value && e.blocked
          ? 0x9dccf0
          : e.kind === "heal"
            ? 0xa3deb6
            : e.kind === "block"
              ? 0x9dccf0
              : e.style === "poison"
                ? 0xa5cb67
                : 0xf0bf80;
      const melee = e.kind === "hit" && e.style === "strike" && source;
      const sx = source?.x ?? tx;
      if (source) this.pose(e.source!, true);
      if (melee) {
        await this.tween(source, { x: sx + (sx < tx ? -18 : 18) }, 100);
        await this.tween(source, { x: tx + (sx < tx ? -100 : 100) }, 145);
      } else if (e.kind === "hit" && source && source !== target) {
        const orb = this.add
          .circle(source.x, ty, 10, color, 0.95)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(12);
        await this.tween(orb, { x: tx }, 260);
        orb.destroy();
      }
      onImpact(e);
      if (melee) {
        const slash = this.add.graphics().setDepth(18);
        slash.fillStyle(0xffe5b6, 0.9);
        slash.fillTriangle(
          tx - 65,
          ty - 80,
          tx + 55,
          ty + 40,
          tx - 18,
          ty - 14,
        );
        void this.tween(slash, { alpha: 0 }, 180).then(() => slash.destroy());
      }
      const fullyBlocked = e.kind === "hit" && !e.value && !!e.blocked;
      this.audio.play(
        fullyBlocked
          ? "block"
          : e.kind === "hit"
            ? (e.style ?? "strike")
            : e.kind,
      );
      void this.burst(tx, ty, color);
      if (e.kind === "block" || fullyBlocked) {
        const shield = this.add
          .ellipse(tx, ty, 135, 230, 0x82b7e1, 0.09)
          .setStrokeStyle(3, 0xa9d6f5, 0.8)
          .setDepth(12);
        await this.tween(shield, { alpha: 0, scale: 1.15 }, 250);
        shield.destroy();
      }
      if (e.kind === "hit") {
        if (!this.reduced && !fullyBlocked) this.cameras.main.shake(100, 0.002);
        const sprite = this.sprites.get(e.target!);
        sprite?.setTintFill(color);
        await this.tween(target, { x: tx + (tx > sx ? 13 : -13) }, 55);
        sprite?.clearTint();
        await this.tween(target, { x: tx }, 110);
      }
      const text = this.add
        .text(
          tx,
          ty - 70,
          e.kind === "text"
            ? (e.text ?? "")
            : fullyBlocked
              ? "BLOCKED"
              : `${e.kind === "heal" ? "+" : e.kind === "block" ? "+" : ""}${e.value ?? ""}${e.blocked ? "\n" + e.blocked + " absorbed" : ""}`,
          {
            fontFamily: "Georgia",
            fontSize: fullyBlocked || e.kind === "text" ? "25px" : "36px",
            align: "center",
            color: Phaser.Display.Color.IntegerToColor(color).rgba,
            stroke: "#101219",
            strokeThickness: 5,
          },
        )
        .setOrigin(0.5)
        .setDepth(30);
      void this.tween(text, { y: ty - 135, alpha: 0 }, 850).then(() =>
        text.destroy(),
      );
      if (melee) await this.tween(source, { x: sx }, 200);
      if (source) this.pose(e.source!, false);
    }
  }
}
