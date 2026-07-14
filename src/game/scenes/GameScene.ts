import Phaser from "phaser";
import { AudioSynth } from "../AudioSynth";
import { BOARD, STAGE } from "../config";
import { RoundController } from "../RoundController";
import { loadBestScore, saveBestScore } from "../storage";
import type { RoundEvent } from "../types";
import { BayView } from "../view/BayView";

const COLORS = {
  cyan: 0x63f2d0,
  yellow: 0xf3c95d,
  red: 0xff6254,
  panel: 0x101f27,
  panelLight: 0x182d36,
  ink: 0x061016,
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
    this.cameras.main.setBackgroundColor("#07131b");
    const graphics = this.add.graphics();
    graphics.fillStyle(0x0c202a, 1);
    graphics.fillRect(0, 0, STAGE.width, STAGE.height);
    graphics.fillStyle(0x071219, 1);
    graphics.fillTriangle(0, 0, STAGE.width, 0, STAGE.width, 410);
    graphics.fillStyle(0x102c34, 0.34);
    graphics.fillCircle(340, 88, 155);
    graphics.fillStyle(0x071117, 0.72);
    graphics.fillCircle(30, 720, 190);

    graphics.lineStyle(1, 0x5ad4cc, 0.055);
    for (let x = -300; x < 500; x += 18) {
      graphics.lineBetween(x, 0, x + 390, 780);
    }

    graphics.fillStyle(0x050c11, 0.82);
    graphics.fillRoundedRect(6, 6, 378, 768, 21);
    graphics.lineStyle(1, 0x7edbd5, 0.15);
    graphics.strokeRoundedRect(6, 6, 378, 768, 21);
  }

  private drawHeader(): void {
    this.add
      .text(195, 43, "WACK A DRIVE", {
        fontFamily: "Orbitron",
        fontSize: "27px",
        fontStyle: "bold",
        color: "#efffff",
        letterSpacing: 2,
      })
      .setOrigin(0.5);
    this.add
      .text(195, 76, "DATA CENTER EMERGENCY RESPONSE", {
        fontFamily: "Rajdhani",
        fontSize: "12px",
        fontStyle: "bold",
        color: "#63f2d0",
        letterSpacing: 2,
      })
      .setOrigin(0.5);
  }

  private createHud(): void {
    this.createHudCard(68, "SCORE");
    this.createHudCard(195, "TIME");
    this.createHudCard(322, "BEST");

    const valueStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "Orbitron",
      fontSize: "25px",
      fontStyle: "bold",
      color: "#f5fbfc",
    };
    this.scoreText = this.add.text(68, 146, "00", valueStyle).setOrigin(0.5);
    this.timerText = this.add.text(195, 146, "45", valueStyle).setOrigin(0.5);
    this.bestText = this.add.text(322, 146, this.formatScore(this.bestScore), valueStyle).setOrigin(0.5);
  }

  private createHudCard(x: number, label: string): void {
    const card = this.add.graphics();
    card.fillStyle(COLORS.panel, 0.95);
    card.fillRoundedRect(x - 56, 101, 112, 77, 12);
    card.lineStyle(1, 0x4c7c83, 0.5);
    card.strokeRoundedRect(x - 56, 101, 112, 77, 12);
    this.add
      .text(x, 117, label, {
        fontFamily: "Rajdhani",
        fontSize: "12px",
        fontStyle: "bold",
        color: "#74969e",
        letterSpacing: 2,
      })
      .setOrigin(0.5);
  }

  private drawRack(): void {
    const rack = this.add.graphics();
    rack.fillStyle(0x0b161d, 1);
    rack.fillRoundedRect(15, 204, 360, 379, 18);
    rack.lineStyle(2, 0x2c4a52, 1);
    rack.strokeRoundedRect(15, 204, 360, 379, 18);
    rack.lineStyle(1, 0x71959b, 0.3);
    rack.strokeRoundedRect(20, 209, 350, 369, 14);

    rack.fillStyle(0x273d44, 1);
    [[29, 218], [361, 218], [29, 569], [361, 569]].forEach(([x, y]) => {
      if (x !== undefined && y !== undefined) rack.fillCircle(x, y, 4);
    });
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
    this.statusText = this.add
      .text(24, 618, "SYSTEM IDLE // AWAITING OPERATOR", {
        fontFamily: "Rajdhani",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#718f97",
        letterSpacing: 1,
      })
      .setOrigin(0, 0.5);

    this.progressBar = this.add.graphics();
    this.drawProgress(0);

    const soundButton = this.add.container(319, 704).setSize(104, 42);
    const soundBackground = this.add.graphics();
    soundBackground.fillStyle(COLORS.panelLight, 1);
    soundBackground.fillRoundedRect(-52, -21, 104, 42, 11);
    soundBackground.lineStyle(1, 0x4c7c83, 0.65);
    soundBackground.strokeRoundedRect(-52, -21, 104, 42, 11);
    this.soundText = this.add
      .text(0, 0, "SFX ON", {
        fontFamily: "Rajdhani",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#9edfd9",
      })
      .setOrigin(0.5);
    soundButton.add([soundBackground, this.soundText]);
    soundButton.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, 104, 42),
      Phaser.Geom.Rectangle.Contains,
    );
    soundButton.on("pointerdown", () => this.toggleSound());

    this.add
      .text(24, 704, "TAP ACTIVE DRIVES", {
        fontFamily: "Rajdhani",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#f3c95d",
        letterSpacing: 1,
      })
      .setOrigin(0, 0.5);
  }

  private createOverlays(): void {
    const ready = this.createOverlayBase();
    ready.add([
      this.makeOverlayTitle("DRIVE BREACH", 284, COLORS.yellow),
      this.makeOverlayBody("Nine unstable bays.\n45 seconds. Stay sharp.", 351),
      this.createButton(195, 462, 230, 62, "START SHIFT", () => this.startRound()),
      this.add
        .text(195, 520, "Tap or click the drives as they eject", {
          fontFamily: "Rajdhani",
          fontSize: "15px",
          color: "#8ca8af",
        })
        .setOrigin(0.5),
    ]);
    this.readyOverlay = ready;

    const finished = this.createOverlayBase().setVisible(false);
    this.endScoreText = this.add
      .text(195, 365, "00 DRIVES SECURED", {
        fontFamily: "Orbitron",
        fontSize: "19px",
        fontStyle: "bold",
        color: "#63f2d0",
      })
      .setOrigin(0.5);
    finished.add([
      this.makeOverlayTitle("SHIFT COMPLETE", 284, COLORS.cyan),
      this.endScoreText,
      this.makeOverlayBody("Rack stabilized. For now.", 410),
      this.createButton(195, 484, 230, 62, "RUN IT AGAIN", () => this.startRound()),
    ]);
    this.endOverlay = finished;

    const paused = this.createOverlayBase().setVisible(false);
    paused.add([
      this.makeOverlayTitle("SHIFT PAUSED", 315, COLORS.yellow),
      this.makeOverlayBody("The timer is stopped.", 373),
      this.createButton(195, 452, 230, 62, "RESUME SHIFT", () => this.resumeRound()),
    ]);
    this.pauseOverlay = paused;
  }

  private createOverlayBase(): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0).setDepth(100);
    const dim = this.add.rectangle(0, 0, STAGE.width, STAGE.height, 0x03090d, 0.78).setOrigin(0);
    const card = this.add.graphics();
    card.fillStyle(0x0d1c24, 0.98);
    card.fillRoundedRect(28, 229, 334, 337, 20);
    card.lineStyle(2, 0x4a777d, 0.72);
    card.strokeRoundedRect(28, 229, 334, 337, 20);
    card.lineStyle(1, 0x8ec3c4, 0.22);
    card.strokeRoundedRect(35, 236, 320, 323, 16);
    container.add([dim, card]);
    return container;
  }

  private makeOverlayTitle(text: string, y: number, color: number): Phaser.GameObjects.Text {
    return this.add
      .text(195, y, text, {
        fontFamily: "Orbitron",
        fontSize: "22px",
        fontStyle: "bold",
        color: Phaser.Display.Color.IntegerToColor(color).rgba,
        letterSpacing: 1,
      })
      .setOrigin(0.5);
  }

  private makeOverlayBody(text: string, y: number): Phaser.GameObjects.Text {
    return this.add
      .text(195, y, text, {
        fontFamily: "Rajdhani",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#d6e5e7",
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
    shadow.fillStyle(0x000000, 0.32);
    shadow.fillRoundedRect(-width / 2 + 3, -height / 2 + 5, width, height, 13);
    const background = this.add.graphics();
    background.fillStyle(COLORS.yellow, 1);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, 13);
    background.lineStyle(2, 0xffe69a, 0.72);
    background.strokeRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, 11);
    const text = this.add
      .text(0, 0, label, {
        fontFamily: "Orbitron",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#16232a",
        letterSpacing: 1,
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
    this.statusText.setText("SHIFT ACTIVE // WATCH ALL NINE BAYS").setColor("#63f2d0");
    this.announce("Round started. 45 seconds remaining.");
    this.refreshHud();
  }

  private resumeRound(): void {
    void this.audio.unlock();
    this.controller.resume(performance.now());
    this.pauseOverlay.setVisible(false);
    this.statusText.setText("SHIFT ACTIVE // WATCH ALL NINE BAYS").setColor("#63f2d0");
    this.announce("Round resumed.");
  }

  private handleBayPress(bayIndex: number): void {
    const result = this.controller.hitBay(bayIndex);
    if (!result.hit) return;

    this.bays[bayIndex]?.hit();
    this.audio.playHit(result.score);
    this.scoreText.setText(this.formatScore(result.score));
    this.statusText.setText(`DRIVE ${String(bayIndex + 1).padStart(2, "0")} SECURED`).setColor("#f3c95d");
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
    this.endScoreText.setText(`${this.formatScore(score)} DRIVES SECURED`);
    this.endOverlay.setVisible(true);
    this.statusText.setText("SHIFT COMPLETE // RACK STABILIZED").setColor("#718f97");
    this.refreshHud();
    this.announce(`Round complete. You secured ${score} drives. Best score ${this.bestScore}.`);
  }

  private refreshHud(): void {
    const snapshot = this.controller.getSnapshot();
    const seconds = Math.ceil(snapshot.remainingMs / 1000);
    if (seconds !== this.lastShownSecond) {
      this.lastShownSecond = seconds;
      this.timerText.setText(String(seconds).padStart(2, "0"));
      this.timerText.setColor(seconds <= 10 && snapshot.phase === "playing" ? "#ff6254" : "#f5fbfc");
    }
    this.scoreText.setText(this.formatScore(snapshot.score));
    this.bestText.setText(this.formatScore(this.bestScore));
    this.drawProgress(snapshot.elapsedMs / 45_000);
  }

  private drawProgress(progress: number): void {
    const clamped = Math.min(1, Math.max(0, progress));
    this.progressBar.clear();
    this.progressBar.fillStyle(0x13272f, 1);
    this.progressBar.fillRoundedRect(24, 646, 342, 9, 4);
    if (clamped > 0) {
      this.progressBar.fillStyle(clamped > 0.78 ? COLORS.red : COLORS.cyan, 1);
      this.progressBar.fillRoundedRect(24, 646, 342 * clamped, 9, 4);
    }
  }

  private toggleSound(): void {
    const muted = this.audio.toggleMuted();
    this.soundText.setText(muted ? "SFX OFF" : "SFX ON");
    this.soundText.setColor(muted ? "#71848a" : "#9edfd9");
    if (!muted) void this.audio.unlock().then(() => this.audio.playHit(0));
  }

  private handleVisibilityChange(): void {
    if (!document.hidden) return;
    const snapshot = this.controller.getSnapshot();
    if (snapshot.phase !== "playing") return;
    this.controller.pause(performance.now());
    this.pauseOverlay.setVisible(true);
    this.statusText.setText("SHIFT PAUSED // TIMER STOPPED").setColor("#f3c95d");
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
