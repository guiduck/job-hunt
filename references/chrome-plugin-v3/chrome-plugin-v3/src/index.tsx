/**
 * Main wrapper.
 * Setup and initilize everything that should be available to all components.
 */

import React from "react";
import ReactDOM from "react-dom";
import Pages from "./pages";
import reportWebVitals from "./utils/reportWebVitals";
import { ThemeProvider } from "./context/ThemeContext";

export interface Theme {
  color?: {
    first?: string;
    second?: string;
  };
}

export interface DefaultProps {
  theme?: Theme;
}

const defaultProps: DefaultProps = {
  theme: {
    color: {
      first: "##EFEFEF",
      second: "#0099FF",
    },
  },
};

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider>
      <Pages {...defaultProps} />
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// CRA vitals setup. More info at https://bit.ly/CRA-vitals
// eslint-disable-next-line no-console
reportWebVitals(console.log);
