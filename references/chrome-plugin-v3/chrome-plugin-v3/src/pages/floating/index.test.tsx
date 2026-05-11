/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { composeStories } from "@storybook/testing-react";
import "@testing-library/jest-dom";

// import Button stories file as a module
import userEvent from "@testing-library/user-event";
import * as stories from "./index.stories";

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level!
const { Default } = composeStories(stories);

describe("[Page: Floating", () => {
  test("Render floating button", async () => {
    render(<Default />);

    const logo = screen.getByTestId("logo");
    expect(logo).toBeInTheDocument();

    const badge = screen.getByText("10");
    expect(badge).toBeInTheDocument();

    const close = screen.getByText("X");
    expect(close).not.toBeVisible();
  });

  test("Render popup", (done) => {
    render(<Default />);

    const logo = screen.getByTestId("logo");

    userEvent.hover(logo);

    waitFor(() => {
      expect(screen.getByText(/10% de cashback/)).toBeInTheDocument();
      expect(screen.getByText(/Netshoes/)).toBeInTheDocument();
      expect(screen.getByText(/ativar cashback/)).toBeInTheDocument();

      userEvent.unhover(logo);

      waitFor(() => {
        expect(screen.getByText(/10% de cashback/)).toBeInTheDocument();
        expect(screen.getByText(/Netshoes/)).toBeInTheDocument();
        expect(screen.getByText(/ativar cashback/)).toBeInTheDocument();

        done();
      });
    });
  });
});
