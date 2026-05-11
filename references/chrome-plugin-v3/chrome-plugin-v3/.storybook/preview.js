import React from "react";
import { ThemeProvider } from "styled-components";
import { addDecorator } from "@storybook/react";

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

const theme = {
  color: {
    first: "##EFEFEF",
    second: "#0099FF",
  },
};

const themeDecorator = (storyFn) => (
  <ThemeProvider theme={theme}>{storyFn()}</ThemeProvider>
);

addDecorator(themeDecorator);
