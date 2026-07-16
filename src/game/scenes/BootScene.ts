import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#071a29");
    this.scene.start("game");
  }
}
