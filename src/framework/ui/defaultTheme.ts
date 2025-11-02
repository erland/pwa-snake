import type { Theme } from "./Theme";

export const defaultTheme: Theme = {
  title: "Your Game",
  typography: {
    family: "system-ui, sans-serif",
    large:  { fontFamily: "system-ui, sans-serif", fontSize: "48px", fontStyle: "bold", align: "center" },
    medium: { fontFamily: "system-ui, sans-serif", fontSize: "20px", align: "center" },
    small:  { fontFamily: "system-ui, sans-serif", fontSize: "16px", align: "center" },
  },
  palette: { fg: "#ffffff", bg: "#000000", accent: "#00e0ff" },
};
