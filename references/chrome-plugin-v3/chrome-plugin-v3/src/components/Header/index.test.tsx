/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/testing-react";

import "@testing-library/jest-dom";

// import Button stories file as a module
import * as stories from "./index.stories";

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level!
const {
  HeaderLogo,
  HeaderDefaultProps,
  HeaderButtons,
  HeaderWalletButtons,
  HeaderEngine,
} = composeStories(stories);

describe("Test Header Component", () => {
  it("Can't have anything other than logo and must have logo", () => {
    render(<HeaderLogo />);
    expect(screen.getByTestId("logo")).toBeInTheDocument();
    expect(screen.queryByTestId("logoWithWallet")).not.toBeInTheDocument();
    expect(screen.queryByTestId("content")).toBeEmptyDOMElement();
  });

  it("Should't have any content nor logo", () => {
    render(<HeaderDefaultProps />);
    expect(screen.queryByTestId("content")).toBeEmptyDOMElement();
    expect(screen.queryByTestId("logo")).toBeEmptyDOMElement();
    expect(screen.getByTestId("logo").firstChild).toBeNull();
  });

  it("Need to render both close and minimize buttons without the wallet display", () => {
    render(<HeaderButtons />);
    expect(screen.queryByTestId("logoWithWallet")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("buttons")?.getElementsByTagName("svg")
    ).toHaveLength(2);
  });

  it("Must have both buttons, the logo and the wallet", () => {
    render(<HeaderWalletButtons />);
    expect(screen.queryByTestId("logo")).not.toBeInTheDocument();
    expect(screen.queryByTestId("logoWithWallet")).toBeInTheDocument();
    expect(screen.queryByTestId("wallet")).toBeInTheDocument();
    expect(
      screen.queryByTestId("buttons")?.getElementsByTagName("svg")
    ).toHaveLength(2);
  });

  it("Has wallet credits display, walletTitle and Arrow icon", () => {
    render(<HeaderWalletButtons />);
    expect(screen.queryByText("R$0,00")).toBeInTheDocument();
    expect(screen.getByText("seus créditos")).toBeInTheDocument();
    expect(
      screen.queryByTestId("wallet")?.getElementsByTagName("svg")
    ).toHaveLength(1);
  });

  it("Settings icon must be rendered and nothing else but the logo", () => {
    render(<HeaderEngine />);
    expect(screen.queryByTestId("wallet")).not.toBeInTheDocument();
    expect(screen.getByTestId("logo")).toBeInTheDocument();
    expect(screen.queryByTestId("logoWithWallet")).not.toBeInTheDocument();
    expect(screen.queryByTestId("buttons")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("content")?.getElementsByTagName("svg")
    ).toHaveLength(1);
  });
});
