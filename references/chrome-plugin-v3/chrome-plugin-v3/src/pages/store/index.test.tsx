/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/testing-react";
import "@testing-library/jest-dom";

// import Button stories file as a module
import * as stories from "./index.stories";

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level!
const { Default } = composeStories(stories);

describe("[Page: Home", () => {
  test("Render activated screen", () => {
    render(<Default />);

    expect(screen.getByTestId("image")).toBeTruthy();
    expect(screen.getAllByText(/4% de cashback/).length).toBe(4);
    expect(screen.getAllByText(/Lojas Renner/).length).toBe(7);
    expect(screen.getAllByText(/15% OFF/).length).toBe(2);
    expect(screen.getByText(/ativar cashback/)).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /Cupom de Desconto Renner de 15% OFF em seleção de Sandálias/
      ).length
    ).toBe(1);
    expect(screen.getAllByText(/PRIMEIRA20/).length).toBe(4);
  });
});
