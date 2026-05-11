/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/testing-react";
import "@testing-library/jest-dom";

import * as stories from "./index.stories";

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level!
const { Label } = composeStories(stories);

it("should renders a badge with '2% de cashback' written", () => {
  render(<Label />);
  expect(screen.getByText("2% de cashback")).toBeInTheDocument();
});
