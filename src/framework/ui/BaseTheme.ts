export abstract class BaseTheme {
  /** Title shown on main menu. */
  getTitle(): string { return "Your Game"; }

  /** Body font & sizes can be centralized here if you like. */
  textStyleLarge(): Phaser.Types.GameObjects.Text.TextStyle {
    return { fontFamily: "system-ui, sans-serif", fontSize: "48px", fontStyle: "bold", align: "center" };
  }
  textStyleMedium(): Phaser.Types.GameObjects.Text.TextStyle {
    return { fontFamily: "system-ui, sans-serif", fontSize: "20px", align: "center" };
  }
  textStyleSmall(): Phaser.Types.GameObjects.Text.TextStyle {
    return { fontFamily: "system-ui, sans-serif", fontSize: "16px", align: "center" };
  }
}