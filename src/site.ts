import type Phaser from "phaser";
import { startGame } from "./main";
import "./style.css";

let game: Phaser.Game | undefined;

void startGame()
  .then((instance) => {
    game = instance;
  })
  .catch((error: unknown) => {
    const status = document.querySelector<HTMLElement>("#game-status");
    if (status) {
      status.textContent = "The game could not start. Please reload the page.";
    }
    console.error("Failed to start Wack a Drive", error);
  });

window.addEventListener(
  "pagehide",
  () => {
    game?.destroy(true);
  },
  { once: true },
);
