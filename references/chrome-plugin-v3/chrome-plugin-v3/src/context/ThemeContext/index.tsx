import React, { createContext, useMemo, useState } from "react";
import { ThemeProvider as StyleProvider } from "styled-components";
import { cuponeriaTheme, eloTheme } from "../../mocks/themeMock";

type themeType = "elo" | "cuponeria";

interface ThemeContextType {
  theme?: themeType;
  setTheme: (theme: themeType) => void;
  getThemeObject: () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

interface ThemeProviderType {
  children?: JSX.Element[] | JSX.Element;
}

export const ThemeContext = createContext<ThemeContextType>(
  {} as ThemeContextType
);

export const ThemeProvider: React.FC<ThemeProviderType> = ({ children }) => {
  const [theme, setTheme] = useState<"elo" | "cuponeria">("cuponeria");

  const getThemeObject = () => {
    switch (theme) {
      case "elo":
        return eloTheme;
      default:
        return cuponeriaTheme;
    }
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      getThemeObject,
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <StyleProvider theme={{ ...getThemeObject(), theme }}>
        {children}
      </StyleProvider>
    </ThemeContext.Provider>
  );
};
