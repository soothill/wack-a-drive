import Phaser from "phaser";

const ART_WIDTH = 98;
const ART_HEIGHT = 92;
const BAY_ACCENTS = [0xff675c, 0xffcf4a, 0x4de0bd, 0x62a8ff] as const;

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
      .setAngle(this.reducedMotion ? 0 : Phaser.Math.Between(-4, 4))
      .setPosition(this.x, this.y + 20)
      .setScale(this.reducedMotion ? 0.96 : 0.66);
    this.hitCross.setVisible(false).setAlpha(1).setScale(1);
    this.led.setFillStyle(0x4de0bd);

    this.scene.tweens.add({
      targets: this.drive,
      y: this.y - 9,
      scale: 1,
      angle: 0,
      duration: this.reducedMotion ? 45 : 175,
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
    this.led.setFillStyle(0xffcf4a);
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
    this.led.setFillStyle(0xff4d48);
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
    this.led.setFillStyle(0x34576a);
  }

  private createSlot(): Phaser.GameObjects.Graphics {
    const accent = BAY_ACCENTS[this.index % BAY_ACCENTS.length] ?? BAY_ACCENTS[0];
    const slot = this.scene.add.graphics().setDepth(2);
    slot.fillStyle(0x04131f, 0.65);
    slot.fillRoundedRect(this.x - 49, this.y - 44, 104, 99, 15);
    slot.fillStyle(0x071825, 1);
    slot.fillRoundedRect(this.x - 53, this.y - 49, 104, 99, 15);
    slot.lineStyle(3, 0x06141f, 1);
    slot.strokeRoundedRect(this.x - 53, this.y - 49, 104, 99, 15);
    slot.lineStyle(2, accent, 0.65);
    slot.strokeRoundedRect(this.x - 48, this.y - 44, 94, 89, 11);

    slot.fillStyle(accent, 1);
    slot.fillRoundedRect(this.x - 46, this.y - 43, 41, 19, 8);
    slot.fillStyle(0x17384a, 1);
    slot.fillRoundedRect(this.x - 44, this.y + 28, 86, 14, 7);
    slot.fillStyle(accent, 0.75);
    slot.fillRoundedRect(this.x - 35, this.y + 33, 68, 4, 2);
    slot.fillStyle(0xfff4d6, 0.65);
    slot.fillCircle(this.x + 38, this.y - 36, 2.5);

    this.scene.add
      .text(this.x - 25, this.y - 34, `#${String(this.index + 1).padStart(2, "0")}`, {
        fontFamily: "Bungee",
        fontSize: "9px",
        color: "#071a29",
      })
      .setOrigin(0.5)
      .setDepth(3);
    return slot;
  }

  private createDrive(): {
    container: Phaser.GameObjects.Container;
    led: Phaser.GameObjects.Arc;
    hitCross: Phaser.GameObjects.Graphics;
  } {
    const accent = BAY_ACCENTS[this.index % BAY_ACCENTS.length] ?? BAY_ACCENTS[0];
    const container = this.scene.add.container(this.x, this.y + 20).setDepth(10).setVisible(false);
    const burst = this.scene.add.graphics();
    burst.fillStyle(accent, 0.16);
    burst.fillCircle(0, 0, 53);
    burst.lineStyle(3, accent, 0.82);
    burst.strokeCircle(0, 0, 49);
    burst.lineStyle(4, 0xfff4d6, 0.75);
    burst.lineBetween(-52, 0, -45, 0);
    burst.lineBetween(45, 0, 52, 0);
    burst.lineBetween(0, -52, 0, -45);
    burst.lineBetween(0, 45, 0, 52);

    const shadow = this.scene.add.graphics();
    shadow.fillStyle(0x020d15, 0.8);
    shadow.fillRoundedRect(-ART_WIDTH / 2 + 5, -ART_HEIGHT / 2 + 8, ART_WIDTH, ART_HEIGHT, 14);

    const body = this.scene.add.graphics();
    body.fillStyle(0x071a29, 1);
    body.fillRoundedRect(-ART_WIDTH / 2, -ART_HEIGHT / 2, ART_WIDTH, ART_HEIGHT, 14);
    body.fillStyle(0xfff4d6, 1);
    body.fillRoundedRect(-ART_WIDTH / 2 + 5, -ART_HEIGHT / 2 + 5, ART_WIDTH - 10, ART_HEIGHT - 12, 10);
    body.fillStyle(accent, 1);
    body.fillRoundedRect(-ART_WIDTH / 2 + 5, -ART_HEIGHT / 2 + 5, ART_WIDTH - 10, 15, 8);
    body.fillStyle(0x17384a, 1);
    body.fillRoundedRect(-ART_WIDTH / 2 + 8, ART_HEIGHT / 2 - 20, ART_WIDTH - 16, 13, 5);
    body.fillStyle(0xfff4d6, 1);
    body.fillRoundedRect(-18, ART_HEIGHT / 2 - 16, 8, 5, 2);
    body.fillRoundedRect(-5, ART_HEIGHT / 2 - 16, 8, 5, 2);
    body.fillRoundedRect(8, ART_HEIGHT / 2 - 16, 8, 5, 2);
    body.fillStyle(0x071a29, 0.7);
    body.fillCircle(-38, -32, 2.5);
    body.fillCircle(38, -32, 2.5);

    const platter = this.scene.add.graphics();
    platter.fillStyle(0x0c2a3b, 1);
    platter.fillCircle(-13, -6, 27);
    platter.lineStyle(5, accent, 1);
    platter.strokeCircle(-13, -6, 21);
    platter.lineStyle(3, 0xfff4d6, 0.9);
    platter.strokeCircle(-13, -6, 12);
    platter.fillStyle(0x071a29, 1);
    platter.fillCircle(-13, -6, 7);
    platter.fillStyle(0xffcf4a, 1);
    platter.fillCircle(-13, -6, 3);

    const arm = this.scene.add.graphics();
    arm.lineStyle(7, 0x071a29, 1);
    arm.beginPath();
    arm.moveTo(29, 20);
    arm.lineTo(20, -7);
    arm.lineTo(5, -15);
    arm.strokePath();
    arm.lineStyle(3, accent, 1);
    arm.beginPath();
    arm.moveTo(29, 20);
    arm.lineTo(20, -7);
    arm.lineTo(5, -15);
    arm.strokePath();
    arm.fillStyle(0x071a29, 1);
    arm.fillCircle(29, 20, 8);
    arm.fillStyle(accent, 1);
    arm.fillCircle(29, 20, 4);

    const tag = this.scene.add.graphics();
    tag.fillStyle(accent, 1);
    tag.fillRoundedRect(15, -37, 29, 17, 7);

    const label = this.scene.add
      .text(29, -28, "BAD!", {
        fontFamily: "Bungee",
        fontSize: "7px",
        color: "#071a29",
      })
      .setOrigin(0.5);

    const led = this.scene.add.circle(36, 34, 4.5, 0x34576a);
    led.setStrokeStyle(2, 0x071a29);

    const hitCross = this.scene.add.graphics().setVisible(false);
    hitCross.lineStyle(13, 0xfff4d6, 0.95);
    hitCross.beginPath();
    hitCross.moveTo(-35, -35);
    hitCross.lineTo(35, 35);
    hitCross.moveTo(35, -35);
    hitCross.lineTo(-35, 35);
    hitCross.strokePath();
    hitCross.lineStyle(8, 0xff3f35, 1);
    hitCross.beginPath();
    hitCross.moveTo(-35, -35);
    hitCross.lineTo(35, 35);
    hitCross.moveTo(35, -35);
    hitCross.lineTo(-35, 35);
    hitCross.strokePath();

    container.add([burst, shadow, body, platter, arm, tag, label, led, hitCross]);
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

    for (let index = 0; index < 9; index += 1) {
      const spark = this.scene.add
        .circle(
          this.x,
          this.y - 8,
          Phaser.Math.Between(3, 5),
          [0xffcf4a, 0xff675c, 0xfff4d6][index % 3],
        )
        .setDepth(30);
      const angle = Phaser.Math.FloatBetween(-2.8, -0.35);
      const distance = Phaser.Math.Between(24, 52);
      this.scene.tweens.add({
        targets: spark,
        x: this.x + Math.cos(angle) * distance,
        y: this.y - 8 + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(220, 340),
        ease: "Quad.Out",
        onComplete: () => spark.destroy(),
      });
    }
  }
}
