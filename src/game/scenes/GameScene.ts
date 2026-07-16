import Phaser from "phaser";
import { AudioSynth } from "../AudioSynth";
import { BOARD, STAGE } from "../config";
import { RoundController } from "../RoundController";
import { loadBestScore, saveBestScore } from "../storage";
import type { RoundEvent } from "../types";
import { BayView } from "../view/BayView";

const COLORS = {
  cream: 0xfff4d6,
  coral: 0xff675c,
  yellow: 0xffcf4a,
  mint: 0x4de0bd,
  panelLight: 0x1b4b61,
  ink: 0x071a29,
} as const;

export class GameScene extends Phaser.Scene {
  private controller = new RoundController();
  private readonly audio = new AudioSynth();
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  private bays: BayView[] = [];
  private scoreText!: Phaser.GameObjects.Text;
  private bestText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private soundText!: Phaser.GameObjects.Text;
  private readyOverlay!: Phaser.GameObjects.Container;
  private endOverlay!: Phaser.GameObjects.Container;
  private pauseOverlay!: Phaser.GameObjects.Container;
  private endScoreText!: Phaser.GameObjects.Text;
  private bestScore = 0;
  private lastShownSecond = -1;
  private readonly visibilityHandler = (): void => this.handleVisibilityChange();

  constructor() {
    super("game");
  }

  create(): void {
    this.bestScore = loadBestScore();
    this.drawBackdrop();
    this.drawHeader();
    this.createHud();
    this.drawRack();
    this.createBays();
    this.createFooter();
    this.createOverlays();
    document.addEventListener("visibilitychange", this.visibilityHandler);
    this.events.once("shutdown", () => {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
    });
    this.announce("Wack a Drive ready. Press start to begin a 45 second round.");
  }

  update(): void {
    const events = this.controller.tick(performance.now());
    this.processEvents(events);
    this.refreshHud();
  }

  private drawBackdrop(): void {
    this.cameras.main.setBackgroundColor("#071a29");
    const graphics = this.add.graphics();
    graphics.fillStyle(0x0d2c40, 1);
    graphics.fillRect(0, 0, STAGE.width, STAGE.height);
    graphics.fillStyle(0x174a5f, 0.75);
    graphics.fillCircle(350, 82, 170);
    graphics.fillStyle(COLORS.coral, 0.08);
    graphics.fillCircle(28, 710, 185);
    graphics.fillStyle(COLORS.yellow, 0.055);
    graphics.fillCircle(30, 40, 120);

    graphics.fillStyle(COLORS.cream, 0.12);
    for (let row = 0; row < 14; row += 1) {
      for (let column = 0; column < 7; column += 1) {
        graphics.fillCircle(24 + column * 58 + (row % 2) * 12, 22 + row * 58, 1.4);
      }
    }

    graphics.fillStyle(0x04131f, 0.46);
    graphics.fillRoundedRect(8, 9, 378, 768, 28);
    graphics.lineStyle(4, 0x051621, 0.9);
    graphics.strokeRoundedRect(8, 9, 374, 764, 27);
    graphics.lineStyle(2, 0x2e6374, 0.8);
    graphics.strokeRoundedRect(12, 13, 366, 756, 24);

    graphics.fillStyle(COLORS.yellow, 1);
    graphics.fillCircle(23, 25, 4);
    graphics.fillCircle(367, 25, 4);
    graphics.fillStyle(COLORS.coral, 1);
    graphics.fillCircle(23, 755, 4);
    graphics.fillCircle(367, 755, 4);
  }

  private drawHeader(): void {
    const badge = this.add.graphics();
    badge.fillStyle(COLORS.coral, 1);
    badge.fillRoundedRect(136, 23, 118, 20, 10);
    this.add
      .text(195, 33, "RACK ATTACK!", {
        fontFamily: "Rajdhani",
        fontSize: "12px",
        fontStyle: "bold",
        color: "#fff4d6",
        letterSpacing: 1.5,
      })
      .setOrigin(0.5);
    this.add
      .text(195, 64, "WACK-A-DRIVE", {
        fontFamily: "Bungee",
        fontSize: "28px",
        color: "#fff4d6",
      })
      .setOrigin(0.5);
    this.add
      .text(195, 89, "SMASH THE BAD DISKS", {
        fontFamily: "Rajdhani",
        fontSize: "13px",
        fontStyle: "bold",
        color: "#4de0bd",
        letterSpacing: 2,
      })
      .setOrigin(0.5);
  }

  private createHud(): void {
    this.createHudCard(68, "SCORE", COLORS.mint);
    this.createHudCard(195, "TIME", COLORS.yellow);
    this.createHudCard(322, "BEST", COLORS.coral);

    const valueStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "Bungee",
      fontSize: "24px",
      color: "#fff4d6",
    };
    this.scoreText = this.add.text(68, 153, "00", valueStyle).setOrigin(0.5);
    this.timerText = this.add.text(195, 153, "45", valueStyle).setOrigin(0.5);
    this.bestText = this.add.text(322, 153, this.formatScore(this.bestScore), valueStyle).setOrigin(0.5);
  }

  private createHudCard(x: number, label: string, accent: number): void {
    const card = this.add.graphics();
    card.fillStyle(0x03131f, 0.72);
    card.fillRoundedRect(x - 54, 112, 108, 71, 15);
    card.lineStyle(3, 0x214e61, 1);
    card.strokeRoundedRect(x - 54, 112, 108, 71, 15);
    card.fillStyle(accent, 1);
    card.fillRoundedRect(x - 31, 105, 62, 23, 11);
    this.add
      .text(x, 116, label, {
        fontFamily: "Rajdhani",
        fontSize: "12px",
        fontStyle: "bold",
        color: "#071a29",
        letterSpacing: 1.5,
      })
      .setOrigin(0.5);
  }

  private drawRack(): void {
    const rack = this.add.graphics();
    rack.fillStyle(0x020f18, 0.7);
    rack.fillRoundedRect(18, 207, 360, 379, 22);
    rack.fillStyle(COLORS.panelLight, 1);
    rack.fillRoundedRect(13, 202, 364, 379, 22);
    rack.lineStyle(4, COLORS.ink, 1);
    rack.strokeRoundedRect(13, 202, 364, 379, 22);
    rack.lineStyle(2, 0x36768a, 1);
    rack.strokeRoundedRect(21, 210, 348, 363, 17);

    rack.fillStyle(COLORS.yellow, 1);
    rack.fillRoundedRect(137, 193, 116, 24, 12);
    rack.lineStyle(3, COLORS.ink, 1);
    rack.strokeRoundedRect(137, 193, 116, 24, 12);
    this.add
      .text(195, 205, "BAD DISK BAY", {
        fontFamily: "Rajdhani",
        fontSize: "12px",
        fontStyle: "bold",
        color: "#071a29",
        letterSpacing: 1.2,
      })
      .setOrigin(0.5)
      .setDepth(4);

    rack.fillStyle(COLORS.cream, 1);
    [[30, 220], [360, 220], [30, 563], [360, 563]].forEach(([x, y]) => {
      if (x !== undefined && y !== undefined) rack.fillCircle(x, y, 4);
    });
    rack.fillStyle(COLORS.ink, 1);
    rack.fillCircle(30, 220, 1.5);
    rack.fillCircle(360, 220, 1.5);
    rack.fillCircle(30, 563, 1.5);
    rack.fillCircle(360, 563, 1.5);
  }

  private createBays(): void {
    let index = 0;
    for (const y of BOARD.centersY) {
      for (const x of BOARD.centersX) {
        this.bays.push(
          new BayView(
            this,
            index,
            x,
            y,
            BOARD.hitSize,
            this.reducedMotion,
            (bayIndex) => this.handleBayPress(bayIndex),
          ),
        );
        index += 1;
      }
    }
  }

  private createFooter(): void {
    const statusPlate = this.add.graphics();
    statusPlate.fillStyle(0x071a29, 0.82);
    statusPlate.fillRoundedRect(18, 601, 354, 39, 13);
    statusPlate.lineStyle(2, 0x24576a, 1);
    statusPlate.strokeRoundedRect(18, 601, 354, 39, 13);
    this.statusText = this.add
      .text(195, 620, "READY WHEN YOU ARE!", {
        fontFamily: "Rajdhani",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#9bc4ca",
        letterSpacing: 1.4,
      })
      .setOrigin(0.5);

    this.progressBar = this.add.graphics();
    this.drawProgress(0);

    const soundButton = this.add.container(319, 704).setSize(104, 42);
    const soundBackground = this.add.graphics();
    soundBackground.fillStyle(COLORS.cream, 1);
    soundBackground.fillRoundedRect(-52, -21, 104, 42, 11);
    soundBackground.lineStyle(3, COLORS.ink, 1);
    soundBackground.strokeRoundedRect(-52, -21, 104, 42, 11);
    this.soundText = this.add
      .text(0, 0, "SFX ON", {
        fontFamily: "Rajdhani",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#0b3d4c",
      })
      .setOrigin(0.5);
    soundButton.add([soundBackground, this.soundText]);
    soundButton.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, 104, 42),
      Phaser.Geom.Rectangle.Contains,
    );
    soundButton.on("pointerdown", () => this.toggleSound());

    this.add
      .text(24, 704, "TAP THE BAD ONES!", {
        fontFamily: "Bungee",
        fontSize: "13px",
        color: "#ffcf4a",
      })
      .setOrigin(0, 0.5);
  }

  private createOverlays(): void {
    const ready = this.createOverlayBase();
    ready.add([
      this.makeOverlayTitle("DRIVES GONE WILD!", 283, COLORS.coral),
      this.makeOverlayBody("Nine bays. 45 seconds.\nTap every troublemaker.", 352),
      this.createButton(195, 462, 242, 64, "START WHACKING", () => this.startRound()),
      this.add
        .text(195, 520, "Fast fingers save the server room", {
          fontFamily: "Rajdhani",
          fontSize: "16px",
          fontStyle: "bold",
          color: "#345568",
        })
        .setOrigin(0.5),
    ]);
    this.readyOverlay = ready;

    const finished = this.createOverlayBase().setVisible(false);
    this.endScoreText = this.add
      .text(195, 364, "00 DRIVES WHACKED", {
        fontFamily: "Bungee",
        fontSize: "17px",
        color: "#0b8e78",
      })
      .setOrigin(0.5);
    finished.add([
      this.makeOverlayTitle("RACK RESCUED!", 284, COLORS.mint),
      this.endScoreText,
      this.makeOverlayBody("Nice work, hotshot.", 410),
      this.createButton(195, 484, 242, 64, "WHACK AGAIN", () => this.startRound()),
    ]);
    this.endOverlay = finished;

    const paused = this.createOverlayBase().setVisible(false);
    paused.add([
      this.makeOverlayTitle("QUICK BREAK!", 315, COLORS.yellow),
      this.makeOverlayBody("The clock is frozen.", 373),
      this.createButton(195, 452, 242, 64, "JUMP BACK IN", () => this.resumeRound()),
    ]);
    this.pauseOverlay = paused;
  }

  private createOverlayBase(): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0).setDepth(100);
    const dim = this.add.rectangle(0, 0, STAGE.width, STAGE.height, 0x03121e, 0.74).setOrigin(0);
    const card = this.add.graphics();
    card.fillStyle(0x020e17, 0.6);
    card.fillRoundedRect(31, 235, 336, 337, 28);
    card.fillStyle(COLORS.cream, 1);
    card.fillRoundedRect(23, 225, 344, 337, 28);
    card.lineStyle(5, COLORS.ink, 1);
    card.strokeRoundedRect(23, 225, 344, 337, 28);
    card.fillStyle(COLORS.yellow, 1);
    card.fillTriangle(49, 247, 60, 232, 67, 251);
    card.fillStyle(COLORS.mint, 1);
    card.fillCircle(337, 250, 8);
    card.lineStyle(3, COLORS.ink, 1);
    card.strokeCircle(337, 250, 8);
    container.add([dim, card]);
    return container;
  }

  private makeOverlayTitle(text: string, y: number, color: number): Phaser.GameObjects.Text {
    return this.add
      .text(195, y, text, {
        fontFamily: "Bungee",
        fontSize: "21px",
        color: Phaser.Display.Color.IntegerToColor(color).rgba,
      })
      .setOrigin(0.5);
  }

  private makeOverlayBody(text: string, y: number): Phaser.GameObjects.Text {
    return this.add
      .text(195, y, text, {
        fontFamily: "Rajdhani",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#17364a",
        align: "center",
        lineSpacing: 4,
      })
      .setOrigin(0.5);
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onPress: () => void,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setSize(width, height);
    const shadow = this.add.graphics();
    shadow.fillStyle(COLORS.ink, 1);
    shadow.fillRoundedRect(-width / 2 + 5, -height / 2 + 7, width, height, 15);
    const background = this.add.graphics();
    background.fillStyle(COLORS.coral, 1);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, 15);
    background.lineStyle(3, COLORS.ink, 1);
    background.strokeRoundedRect(-width / 2, -height / 2, width, height, 15);
    background.lineStyle(2, 0xffa49a, 1);
    background.lineBetween(-width / 2 + 16, -height / 2 + 10, width / 2 - 16, -height / 2 + 10);
    const text = this.add
      .text(0, 0, label, {
        fontFamily: "Bungee",
        fontSize: "15px",
        color: "#fff4d6",
      })
      .setOrigin(0.5);
    container.add([shadow, background, text]);
    container.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains,
    );
    container.on("pointerdown", onPress);
    if (!this.reducedMotion) {
      container.on("pointerover", () => container.setScale(1.035));
      container.on("pointerout", () => container.setScale(1));
    }
    return container;
  }

  private startRound(): void {
    void this.audio.unlock().then(() => this.audio.playStart());
    this.readyOverlay.setVisible(false);
    this.endOverlay.setVisible(false);
    this.pauseOverlay.setVisible(false);
    this.bays.forEach((bay) => bay.reset());
    this.controller.start(performance.now());
    this.lastShownSecond = -1;
    this.statusText.setText("GO! WATCH ALL NINE BAYS").setColor("#4de0bd");
    this.announce("Round started. 45 seconds remaining.");
    this.refreshHud();
  }

  private resumeRound(): void {
    void this.audio.unlock();
    this.controller.resume(performance.now());
    this.pauseOverlay.setVisible(false);
    this.statusText.setText("BACK IN ACTION!").setColor("#4de0bd");
    this.announce("Round resumed.");
  }

  private handleBayPress(bayIndex: number): void {
    const result = this.controller.hitBay(bayIndex);
    if (!result.hit) return;

    this.bays[bayIndex]?.hit();
    this.audio.playHit(result.score);
    this.scoreText.setText(this.formatScore(result.score));
    this.statusText.setText(`WHACK! DRIVE ${String(bayIndex + 1).padStart(2, "0")} GOT IT`).setColor("#ffcf4a");
    this.tryVibrate();
  }

  private processEvents(events: RoundEvent[]): void {
    for (const event of events) {
      if (event.type === "spawn") {
        this.bays[event.bayIndex]?.pop();
      } else if (event.type === "retract") {
        this.bays[event.bayIndex]?.retract();
      } else {
        this.finishRound(event.score);
      }
    }
  }

  private finishRound(score: number): void {
    if (score > this.bestScore) {
      this.bestScore = score;
      saveBestScore(score);
    }
    this.audio.playEnd();
    this.endScoreText.setText(`${this.formatScore(score)} DRIVES WHACKED`);
    this.endOverlay.setVisible(true);
    this.statusText.setText("RACK RESCUED! NICE WORK").setColor("#9bc4ca");
    this.refreshHud();
    this.announce(`Round complete. You secured ${score} drives. Best score ${this.bestScore}.`);
  }

  private refreshHud(): void {
    const snapshot = this.controller.getSnapshot();
    const seconds = Math.ceil(snapshot.remainingMs / 1000);
    if (seconds !== this.lastShownSecond) {
      this.lastShownSecond = seconds;
      this.timerText.setText(String(seconds).padStart(2, "0"));
      this.timerText.setColor(seconds <= 10 && snapshot.phase === "playing" ? "#ff675c" : "#fff4d6");
    }
    this.scoreText.setText(this.formatScore(snapshot.score));
    this.bestText.setText(this.formatScore(this.bestScore));
    this.drawProgress(snapshot.elapsedMs / 45_000);
  }

  private drawProgress(progress: number): void {
    const clamped = Math.min(1, Math.max(0, progress));
    this.progressBar.clear();
    this.progressBar.fillStyle(0x061723, 1);
    this.progressBar.fillRoundedRect(24, 652, 342, 12, 6);
    this.progressBar.lineStyle(2, 0x285a6b, 1);
    this.progressBar.strokeRoundedRect(24, 652, 342, 12, 6);
    if (clamped > 0) {
      this.progressBar.fillStyle(clamped > 0.78 ? COLORS.coral : COLORS.mint, 1);
      this.progressBar.fillRoundedRect(26, 654, 338 * clamped, 8, 4);
    }
  }

  private toggleSound(): void {
    const muted = this.audio.toggleMuted();
    this.soundText.setText(muted ? "SFX OFF" : "SFX ON");
    this.soundText.setColor(muted ? "#75858a" : "#0b3d4c");
    if (!muted) void this.audio.unlock().then(() => this.audio.playHit(0));
  }

  private handleVisibilityChange(): void {
    if (!document.hidden) return;
    const snapshot = this.controller.getSnapshot();
    if (snapshot.phase !== "playing") return;
    this.controller.pause(performance.now());
    this.pauseOverlay.setVisible(true);
    this.statusText.setText("PAUSED - CLOCK STOPPED").setColor("#ffcf4a");
  }

  private tryVibrate(): void {
    try {
      navigator.vibrate?.(20);
    } catch {
      // Vibration is a progressive enhancement and may be blocked by the browser.
    }
  }

  private announce(message: string): void {
    const status = document.querySelector<HTMLElement>("#game-status");
    if (status) status.textContent = message;
  }

  private formatScore(score: number): string {
    return String(score).padStart(2, "0");
  }
}
