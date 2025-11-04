import type { GameServices } from "./types";

export function getServices(game: Phaser.Game): GameServices {
  // Single knowledge point of where services live
  return game.registry.get("services") as GameServices;
}