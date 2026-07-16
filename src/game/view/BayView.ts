import Phaser from "phaser";

const ART_WIDTH = 98;
const ART_HEIGHT = 92;

export class BayView {
  private readonly slot: Phaser.GameObjects.Graphics;
  private readonly drive: Phaser.GameObjects.Container;
  private readonly led: Phaser.GameObjects.Arc;
  private readonly hitCross: Phaser.GameObjects.Graphics;
  private readonly hitZone: Phaser.GameObjects.Rectangle;
  private animationId = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly index: number,
    readonly x: number,
    readonly y: number,
    hitSize: number,
    private readonly reducedMotion: boolean,
    onPress: (index: number) => void,
  ) {
    this.slot = this.createSlot();
    const driveParts = this.createDrive();
    this.drive = driveParts.container;
    this.led = driveParts.led;
    this.hitCross = driveParts.hitCross;

    this.hitZone = scene.add
      .rectangle(x, y, hitSize, hitSize, 0xffffff, 0.001)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });

    this.hitZone.on("pointerdown", () => onPress(index));
    this.hitZone.on("pointerover", () => this.setHovered(true));
    this.hitZone.on("pointerout", () => this.setHovered(false));
  }

  pop(): void {
    const animationId = ++this.animationId;
    this.scene.tweens.killTweensOf(this.drive);
    this.scene.tweens.killTweensOf(this.hitCross);
    this.drive
      .setVisible(true)
      .setAlpha(1)
      .setAngle(0)
      .setPosition(this.x, this.y + 20)
      .setScale(this.reducedMotion ? 0.96 : 0.72);
    this.hitCross.setVisible(false).setAlpha(1).setScale(1);
    this.led.setFillStyle(0x63f2d0);

    this.scene.tweens.add({
      targets: this.drive,
      y: this.y - 9,
      scale: 1,
      duration: this.reducedMotion ? 45 : 145,
      ease: this.reducedMotion ? "Linear" : "Back.Out",
      onComplete: () => {
        if (animationId === this.animationId) this.drive.setPosition(this.x, this.y - 9);
      },
    });
  }

  retract(): void {
    const animationId = ++this.animationId;
    this.scene.tweens.killTweensOf(this.drive);
    this.scene.tweens.killTweensOf(this.hitCross);
    this.hitCross.setVisible(false);
    this.led.setFillStyle(0xefb94f);
    this.scene.tweens.add({
      targets: this.drive,
      y: this.y + 20,
      scale: 0.78,
      alpha: 0,
      duration: this.reducedMotion ? 45 : 140,
      ease: "Quad.In",
      onComplete: () => {
        if (animationId === this.animationId) this.drive.setVisible(false);
      },
    });
  }

  hit(): void {
    const animationId = ++this.animationId;
    this.scene.tweens.killTweensOf(this.drive);
    this.scene.tweens.killTweensOf(this.hitCross);
    this.led.setFillStyle(0xff5d4d);
    this.hitCross
      .setVisible(true)
      .setAlpha(1)
      .setScale(this.reducedMotion ? 1 : 0.35);
    this.createSparks();

    if (!this.reducedMotion) {
      this.scene.tweens.add({
        targets: this.hitCross,
        scale: 1,
        duration: 75,
        ease: "Back.Out",
      });
    }

    this.scene.tweens.add({
      targets: this.drive,
      y: this.y + 22,
      scaleX: 0.82,
      scaleY: 0.66,
      angle: this.reducedMotion ? 0 : Phaser.Math.Between(-7, 7),
      alpha: 0,
      delay: this.reducedMotion ? 120 : 230,
      duration: this.reducedMotion ? 55 : 100,
      ease: "Cubic.In",
      onComplete: () => {
        if (animationId === this.animationId) {
          this.drive.setVisible(false);
          this.hitCross.setVisible(false);
        }
      },
    });
  }

  reset(): void {
    this.animationId += 1;
    this.scene.tweens.killTweensOf(this.drive);
    this.scene.tweens.killTweensOf(this.hitCross);
    this.drive.setVisible(false).setAlpha(0).setAngle(0);
    this.hitCross.setVisible(false).setAlpha(1).setScale(1);
    this.led.setFillStyle(0x314b52);
  }

  private createSlot(): Phaser.GameObjects.Graphics {
    const slot = this.scene.add.graphics().setDepth(2);
    slot.fillStyle(0x020609, 0.95);
    slot.fillRoundedRect(this.x - 52, this.y - 48, 104, 99, 13);
    slot.lineStyle(2, 0x1c3740, 1);
    slot.strokeRoundedRect(this.x - 52, this.y - 48, 104, 99, 13);
    slot.fillStyle(0x0c1b22, 1);
    slot.fillRoundedRect(this.x - 45, this.y + 30, 90, 13, 5);
    slot.fillStyle(0x26414a, 0.55);
    slot.fillRect(this.x - 38, this.y + 35, 76, 2);

    this.scene.add
      .text(this.x - 43, this.y - 42, `BAY ${String(this.index + 1).padStart(2, "0")}`, {
        fontFamily: "Rajdhani",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#56747c",
        letterSpacing: 1,
      })
      .setDepth(3);
    return slot;
  }

  private createDrive(): {
    container: Phaser.GameObjects.Container;
    led: Phaser.GameObjects.Arc;
    hitCross: Phaser.GameObjects.Graphics;
  } {
    const container = this.scene.add.container(this.x, this.y + 20).setDepth(10).setVisible(false);
    const shadow = this.scene.add.graphics();
    shadow.fillStyle(0x000000, 0.42);
    shadow.fillRoundedRect(-ART_WIDTH / 2 + 4, -ART_HEIGHT / 2 + 8, ART_WIDTH, ART_HEIGHT, 11);

    const body = this.scene.add.graphics();
    body.fillStyle(0x6f858c, 1);
    body.fillRoundedRect(-ART_WIDTH / 2, -ART_HEIGHT / 2, ART_WIDTH, ART_HEIGHT, 10);
    body.fillStyle(0xc7d4d4, 1);
    body.fillRoundedRect(-ART_WIDTH / 2 + 4, -ART_HEIGHT / 2 + 4, ART_WIDTH - 8, ART_HEIGHT - 12, 8);
    body.lineStyle(2, 0xe8f1ef, 0.55);
    body.strokeRoundedRect(-ART_WIDTH / 2 + 5, -ART_HEIGHT / 2 + 5, ART_WIDTH - 10, ART_HEIGHT - 14, 7);
    body.fillStyle(0x253b43, 1);
    body.fillRoundedRect(-ART_WIDTH / 2 + 7, ART_HEIGHT / 2 - 18, ART_WIDTH - 14, 12, 3);

    const platter = this.scene.add.graphics();
    platter.fillStyle(0x354950, 1);
    platter.fillCircle(-12, -8, 27);
    platter.lineStyle(5, 0x8fa4a7, 1);
    platter.strokeCircle(-12, -8, 21);
    platter.lineStyle(2, 0xdce6e4, 0.75);
    platter.strokeCircle(-12, -8, 12);
    platter.fillStyle(0x1f3036, 1);
    platter.fillCircle(-12, -8, 6);
    platter.fillStyle(0xf2cb5b, 1);
    platter.fillCircle(-12, -8, 2.5);

    const arm = this.scene.add.graphics();
    arm.lineStyle(5, 0x6a7c80, 1);
    arm.beginPath();
    arm.moveTo(28, 19);
    arm.lineTo(18, -9);
    arm.lineTo(4, -17);
    arm.strokePath();
    arm.fillStyle(0x33484e, 1);
    arm.fillCircle(28, 19, 7);

    const label = this.scene.add
      .text(28, -32, "DRV", {
        fontFamily: "Orbitron",
        fontSize: "9px",
        fontStyle: "bold",
        color: "#193038",
      })
      .setOrigin(0.5);

    const led = this.scene.add.circle(34, 34, 3.5, 0x314b52);

    const hitCross = this.scene.add.graphics().setVisible(false);
    hitCross.lineStyle(11, 0x26080a, 0.82);
    hitCross.beginPath();
    hitCross.moveTo(-34, -34);
    hitCross.lineTo(34, 34);
    hitCross.moveTo(34, -34);
    hitCross.lineTo(-34, 34);
    hitCross.strokePath();
    hitCross.lineStyle(7, 0xff3f35, 1);
    hitCross.beginPath();
    hitCross.moveTo(-34, -34);
    hitCross.lineTo(34, 34);
    hitCross.moveTo(34, -34);
    hitCross.lineTo(-34, 34);
    hitCross.strokePath();

    container.add([shadow, body, platter, arm, label, led, hitCross]);
    return { container, led, hitCross };
  }

  private setHovered(hovered: boolean): void {
    if (this.reducedMotion) return;
    this.scene.tweens.add({
      targets: this.slot,
      alpha: hovered ? 0.82 : 1,
      duration: 90,
    });
  }

  private createSparks(): void {
    if (this.reducedMotion) return;

    for (let index = 0; index < 6; index += 1) {
      const spark = this.scene.add
        .circle(this.x, this.y - 8, Phaser.Math.Between(2, 4), index % 2 ? 0xffc54d : 0x64f4d3)
        .setDepth(30);
      const angle = Phaser.Math.FloatBetween(-2.8, -0.35);
      const distance = Phaser.Math.Between(24, 52);
      this.scene.tweens.add({
        targets: spark,
        x: this.x + Math.cos(angle) * distance,
        y: this.y - 8 + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(180, 280),
        ease: "Quad.Out",
        onComplete: () => spark.destroy(),
      });
    }
  }
}
