import "./style.css";
import Phaser from "phaser";
import { STAGE } from "./game/config";
import { BootScene } from "./game/scenes/BootScene";
import { GameScene } from "./game/scenes/GameScene";

async function startGame(): Promise<void> {
  await document.fonts.ready;

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game-root",
    width: STAGE.width,
    height: STAGE.height,
    backgroundColor: "#07131b",
    scene: [BootScene, GameScene],
    input: {
      activePointers: 3,
      smoothFactor: 0,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: STAGE.width,
      height: STAGE.height,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: true,
    },
    autoFocus: false,
    disableContextMenu: true,
  });

  game.canvas.setAttribute("role", "application");
  game.canvas.setAttribute(
    "aria-label",
    "Wack a Drive. Start a round, then tap active hard drives as they emerge from the nine bays.",
  );
}

void startGame();
