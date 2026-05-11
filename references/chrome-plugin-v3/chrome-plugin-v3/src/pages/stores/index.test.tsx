/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/testing-react";
import userEvent from "@testing-library/user-event";

// import Button stories file as a module
import * as stories from "./index.stories";

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level!
const { Default, NoStoreFound } = composeStories(stories);

describe("[Page: Stores", () => {
  test("Render default screen", () => {
    render(<Default />);

    expect(screen.getAllByTestId("image").length).toBe(1);
    expect(screen.getByText("Netshoes")).toBeInTheDocument();
    expect(screen.getByText(/4.5% de cashback/)).toBeInTheDocument();
    expect(screen.getByText(/15 cupons/)).toBeInTheDocument();
  });

  test("Render and search a non existent store", () => {
    render(<Default />);

    const input = screen.getByPlaceholderText("buscar lojas");

    expect(input).toBeInTheDocument();

    userEvent.type(input, "ameri");

    expect(screen.queryByTestId("image")).not.toBeInTheDocument();
    expect(screen.queryByText("Netshoes")).not.toBeInTheDocument();
    expect(screen.queryByText(/4.5% de cashback/)).not.toBeInTheDocument();
    expect(screen.queryByText(/15 cupons/)).not.toBeInTheDocument();
  });

  test("Render and search a non existent store", () => {
    render(<NoStoreFound />);

    expect(
      screen.getByText(/Essa loja não tem cupons e cashback/g)
    ).toBeInTheDocument();
  });
});
