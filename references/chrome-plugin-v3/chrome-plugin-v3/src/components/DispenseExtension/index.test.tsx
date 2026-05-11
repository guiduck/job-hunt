/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/testing-react";
import "@testing-library/jest-dom";

import { userEvent } from "@storybook/testing-library";
import * as stories from "./index.stories";

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level!
const { DispenseExtensionDefault } = composeStories(stories);

describe("Test Dispense Extension Component", () => {
  it("Must find gear icon and simulate click button", () => {
    render(<DispenseExtensionDefault />);
    expect(screen.getByTestId("wrapper")?.firstChild).toBeInTheDocument();

    const button = screen.getByTestId("wrapper");

    userEvent.click(button);
    expect(screen.getByText("Dispensar por 24h")).toBeInTheDocument();
    expect(screen.getByText("Dispensar neste site")).toBeInTheDocument();

    setTimeout(() => {
      userEvent.click(button);
      expect(screen.getByText("Dispensar por 24h")).not.toBeInTheDocument();
      expect(screen.getByText("Dispensar neste site")).not.toBeInTheDocument();
    }, 1000);
  });

  it("Must find gear icon and simulate click 24hs button", () => {
    const mockFn = jest.fn();
    render(<DispenseExtensionDefault onOptionClick={mockFn} />);

    expect(screen.getByTestId("wrapper")?.firstChild).toBeInTheDocument();

    userEvent.click(screen.getByTestId("wrapper"));

    userEvent.click(screen.getByText("Dispensar por 24h"));

    expect(mockFn).toBeCalled();
  });

  it("Must find gear icon and simulate click forever button", () => {
    const mockFn = jest.fn();
    render(<DispenseExtensionDefault onOptionClick={mockFn} />);

    expect(screen.getByTestId("wrapper")?.firstChild).toBeInTheDocument();

    userEvent.click(screen.getByTestId("wrapper"));

    userEvent.click(screen.getByText("Dispensar neste site"));

    expect(mockFn).toBeCalled();
  });
});
