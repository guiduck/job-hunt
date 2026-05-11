/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/testing-react";
import { userEvent } from "@storybook/testing-library";
import "@testing-library/jest-dom";

// import Button stories file as a module
import * as stories from "./index.stories";

const { AutoCompleteDefaultProps } = composeStories(stories);

describe("Test Store Search Autocomplete Component", () => {
  it("updates on change", (done) => {
    render(<AutoCompleteDefaultProps />);

    const searchInput = screen.getByTestId("autocompleteRule");

    act(() => {
      userEvent.type(searchInput, "ame");
    });

    setTimeout(() => {
      expect(screen.getByText("Americanas")).toBeInTheDocument();
      const suggestion = screen.getByTestId("suggestionRule1");

      act(() => {
        fireEvent.click(suggestion);
      });

      expect(searchInput).toHaveValue("Americanas");
    }, 2000);

    done();
  });

  it("inserting value in input that does not return result", (done) => {
    render(<AutoCompleteDefaultProps />);

    const searchInput = screen.getByTestId("autocompleteRule");
    userEvent.type(searchInput, "teste");

    setTimeout(() => {
      expect(
        screen.getByText("Nenhum resultado encontrado.")
      ).toBeInTheDocument();
    }, 2000);

    done();
  });
});
