/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/testing-react";
import "@testing-library/jest-dom";

// import Button stories file as a module
import * as stories from "./index.stories";

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level!
const { Default, DefaultWithBrand, DefaultNoBrand, DefaultNoResults } =
  composeStories(stories);

describe("Page: Search with term", () => {
  it("If a term exists, should render related offers and brands.", () => {
    render(<DefaultWithBrand />);
    expect(screen.queryAllByTestId("brand")).toHaveLength(2);
  });

  it("Can't have a testId of noBrand, must have a brand testId and should have input", () => {
    render(<DefaultWithBrand />);
    expect(screen.queryByTestId("noBrandContent")).not.toBeInTheDocument();
    expect(screen.queryByTestId("brandContent")).toBeInTheDocument();
    expect(
      screen.queryByTestId("brandContent")?.getElementsByTagName("input")
    ).toHaveLength(1);
  });

  it("Must have a testId of noBrand, can't have a brand testId and should have input", () => {
    render(<DefaultNoBrand />);
    expect(screen.queryByTestId("brandContent")).not.toBeInTheDocument();
    expect(screen.queryByTestId("noBrandContent")).toBeInTheDocument();
    expect(
      screen.queryByTestId("noBrandContent")?.getElementsByTagName("input")
    ).toHaveLength(1);
  });

  it("Suggestions should be rendered with a noBrand testId", () => {
    render(<DefaultNoBrand />);
    expect(screen.queryByTestId("noBrand")).toBeInTheDocument();
  });

  it("Should render suggestions if no term is set to be searched", () => {
    render(<DefaultNoResults />);
    expect(screen.queryByTestId("noBrand")).toBeInTheDocument();
    expect(screen.queryByTestId("brand")).not.toBeInTheDocument();
    expect(screen.getByText("Sugestões para você:")).toBeInTheDocument();
  });

  it("Should render suggestions with message for no results and can't render any brand testId", () => {
    render(<Default />);
    expect(screen.queryByTestId("noBrand")).toBeInTheDocument();
    expect(screen.queryByTestId("brand")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Não encontrei o que você buscou, mas separei ofertas incríveis para você! 👀"
      )
    ).toBeInTheDocument();
  });
});
