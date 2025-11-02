export type SceneKeys = {
  boot: string;
  menu: string;
  play: string;
  pause: string;
  gameOver?: string;
};

export const defaultSceneKeys: SceneKeys = {
  boot: "Boot",
  menu: "MainMenu",
  play: "Play",
  pause: "Pause",
};
