export type TextStyle = Phaser.Types.GameObjects.Text.TextStyle;

export interface Theme {
  title: string;
  typography: {
    family: string;
    large: TextStyle;
    medium: TextStyle;
    small: TextStyle;
  };
  palette?: {
    fg?: string;
    bg?: string;
    accent?: string;
  };
}
