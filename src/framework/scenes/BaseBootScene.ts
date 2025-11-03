// src/framework/scenes/BaseBootScene.ts
import Phaser from "phaser";
import { createDefaultServices } from "../core/services";
import { defaultSceneKeys, type SceneKeys } from "./sceneKeys";
import type { GameServices } from "../core/types";

/**
 * BaseBootScene
 * - Ensures GameServices exist before MainMenu runs.
 * - Merges optional overrides via getServiceOverrides().
 * - Optionally supplies theme/sceneKeys via hooks.
 * - Configures scale, then starts the Menu scene.
 */
export abstract class BaseBootScene extends Phaser.Scene {
  constructor() { super("Boot"); }

  /** Override to preload assets before create() if needed. */
  protected preloadAssets(): void {}

  /** Optional: provide a theme for createDefaultServices(). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getBootTheme(): any | undefined { return undefined; }

  /** Optional: provide explicit scene keys for createDefaultServices(). */
  protected getBootSceneKeys(): Partial<SceneKeys> | undefined { return undefined; }

  /** Optional: override to inject/override parts of the services object (e.g., ui flags). */
  protected getServiceOverrides(): Partial<GameServices> & { ui?: Record<string, unknown> } { return {}; }

  /** Accessor for scene keys from the registry or defaults. */
  protected getSceneKeys(): SceneKeys {
    const services: any = this.game.registry.get("services");
    return (services && services.sceneKeys) || defaultSceneKeys;
  }

  /** Called by Phaser once assets are loaded. */
  public preload(): void {
    this.preloadAssets();
  }

  /** Build/merge services, configure scale, then go to menu. */
  public create(): void {
    // 1) Ensure services are present
    const existing: any = this.game.registry.get("services");
    const base: any = existing ?? createDefaultServices(this.getBootSceneKeys(), this.getBootTheme());
    const overrides = this.getServiceOverrides() || {};

    // Shallow merge with a nested merge for 'ui'
    const merged: any = { ...base, ...overrides };
    if (base.ui || (overrides as any).ui) {
      merged.ui = { ...(base.ui || {}), ...((overrides as any).ui || {}) };
    }

    this.game.registry.set("services", merged);

    // 2) Configure scale (safe no-op if host already configured)
    this.configureScale();

    // 3) Continue to Menu
    this.scene.start(this.getSceneKeys().menu);
  }

  /** Default scale configuration; override if your game needs something special. */
  protected configureScale(): void {
    // Most setups already configure scale via GameHost; keep this conservative.
    try {
      const sm = this.scale;
      sm.autoCenter = Phaser.Scale.CENTER_BOTH;
      // RESIZE mode is common; if different, the host likely set it already.
    } catch {}
  }
}
