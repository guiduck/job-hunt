/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/testing-react";
import "@testing-library/jest-dom";

// import Button stories file as a module
import * as stories from "./index.stories";
import { Button } from ".";

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level!
const { LabelOnly, IconAndLabel } = composeStories(stories);

test("Renders the button only with the label and word 'começar'", () => {
  render(<LabelOnly />);
  expect(screen.queryByTestId("icon")).toBeFalsy();
  expect(screen.getByText("começar")).toBeInTheDocument();
});

test("Renders the button and icon, text 'ativar 8% de cashback'", () => {
  render(<IconAndLabel />);
  expect(screen.getByTestId("icon")).toBeTruthy();
  expect(screen.getByText("ativar 8% de cashback")).toBeInTheDocument();
});

test("Renders the button default", () => {
  render(<Button />);
  expect(screen.queryByTestId("icon")).toBeFalsy();
  expect(screen.getByText("Botão")).toBeInTheDocument();
});
