import Phaser from "phaser";
export class EventBus extends Phaser.Events.EventEmitter {}
export const events = new EventBus();

export const EVT = {
  START_GAME: "START_GAME",
  PAUSE_GAME: "PAUSE_GAME",
  RESUME_GAME: "RESUME_GAME",
  QUIT_TO_MENU: "QUIT_TO_MENU",
} as const;