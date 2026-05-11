/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/testing-react";
import "@testing-library/jest-dom";

import * as stories from "./index.stories";

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level!
const {
  FirstPageWithClickedActive,
  ThirdPageWithClickedActive,
  ThirdPageWithClickedNotActive,
} = composeStories(stories);

it("should renders circle navigation indicator for the first page on clicked style", () => {
  render(<FirstPageWithClickedActive />);
  expect(screen.getByTestId("circle-navigation-indicator")).toBeInTheDocument();
});

it("should renders circle navigation indicator for the third page on clicked style", () => {
  render(<ThirdPageWithClickedActive />);
  expect(screen.getByTestId("circle-navigation-indicator")).toBeInTheDocument();
});

it("should renders circle navigation indicator for the third page without clicked style", () => {
  render(<ThirdPageWithClickedNotActive />);
  expect(screen.getByTestId("circle-navigation-indicator")).toBeInTheDocument();
});
