/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/testing-react";
import "@testing-library/jest-dom";

// import Button stories file as a module
import * as stories from "./index.stories";

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level!
const { Default, PercentageCashback, FixedCashback } = composeStories(stories);

test("Renders default", () => {
  render(<Default />);

  expect(screen.getByTestId("pigImage")?.firstChild).toBeInTheDocument();
  expect(screen.getByText(/1%/)).toBeInTheDocument();
  expect(screen.getByText(/Americanas/)).toBeInTheDocument();
  expect(screen.queryByText(/era/)).toBeNull();
});

test("Renders cashback with %", () => {
  render(<PercentageCashback />);

  expect(screen.getByTestId("pigImage")?.firstChild).toBeInTheDocument();
  expect(screen.getByText(/4%/)).toBeInTheDocument();
  expect(screen.getByText(/Americanas/)).toBeInTheDocument();
  expect(screen.getByText(/2%/)).toBeInTheDocument();
});

test("Renders cashback with R$", () => {
  render(<FixedCashback />);

  expect(screen.getByTestId("pigImage")?.firstChild).toBeInTheDocument();
  expect(screen.getByText(/R\$ 4,00/)).toBeInTheDocument();
  expect(screen.getByText(/Americanas/)).toBeInTheDocument();
  expect(screen.getByText(/R\$ 2,00/)).toBeInTheDocument();
});
