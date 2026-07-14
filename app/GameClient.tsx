"use client";

import { useEffect } from "react";
import type Phaser from "phaser";

export function GameClient(): React.JSX.Element {
  useEffect(() => {
    let disposed = false;
    let game: Phaser.Game | undefined;

    void import("../src/main").then(async ({ startGame }) => {
      const instance = await startGame();
      if (disposed) {
        instance.destroy(true);
      } else {
        game = instance;
      }
    });

    return () => {
      disposed = true;
      game?.destroy(true);
    };
  }, []);

  return (
    <main id="game-shell" aria-label="Wack a Drive game">
      <div id="game-root" />
      <div id="rotate-prompt" role="status">
        <strong>ROTATE TO PLAY</strong>
        <span>This drive rack works best in portrait.</span>
      </div>
      <p id="game-status" className="sr-only" aria-live="polite" />
    </main>
  );
}
