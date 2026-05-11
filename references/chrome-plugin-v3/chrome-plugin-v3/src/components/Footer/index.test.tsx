/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/testing-react";
import iconsMock from "./mockData";
import "@testing-library/jest-dom";

// import Footer stories file as a module
import * as stories from "./index.stories";

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level!
const { Default } = composeStories(stories);

it("should render Footer component", () => {
  render(<Default />);
  expect(screen.getByTestId("footer")).toBeInTheDocument();
});

it("should return if all icons were rendered", () => {
  render(<Default />);
  expect(screen.getAllByTestId("footer-icon")).toHaveLength(iconsMock.length);
});
