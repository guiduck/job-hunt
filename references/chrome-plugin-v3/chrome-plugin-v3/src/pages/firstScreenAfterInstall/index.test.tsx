/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/testing-react";
import "@testing-library/jest-dom";

// import Button stories file as a module
import * as stories from "./index.stories";

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level!
const { Default } = composeStories(stories);

describe("[Page: Tutorial", () => {
  it("should renders tutorial page and not show pular tour button on first time", () => {
    render(<Default />);
    expect(screen.queryByText("pular tour")).toBeNull();
    expect(screen.getByText("começar")).toBeInTheDocument();
  });
});
