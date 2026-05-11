/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/testing-react";
import "@testing-library/jest-dom";

// import Button stories file as a module
import * as stories from "./index.stories";

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level!
const {
  Card,
  CardDefaultProps,
  CardWithoutCashbackAndCoupon,
  CardMiniature,
  CardMiniatureWithoutCashbackAndCoupon,
  FixedCashbackCard,
} = composeStories(stories);

describe("Test Card Component", () => {
  it("Must have an image with title and alt attribute with value 'Americanas'", () => {
    render(<Card />);
    expect(screen.getByTestId("image")).toHaveAttribute("title", "Americanas");
    expect(screen.getByTestId("image")).toHaveAttribute("alt", "Americanas");
  });

  it("Has the texts 'Americanas', '5% de cashback' and '20 coupons'", () => {
    render(<Card />);
    expect(screen.getByText("Americanas")).toBeInTheDocument();
    expect(screen.getByText("5% de cashback")).toBeInTheDocument();
    expect(screen.getByText("+ 20 cupons")).toBeInTheDocument();
  });

  it("Has the texts 'Título', doesn't display the '1% de cashback', and '1 cupom'", () => {
    render(<CardDefaultProps />);
    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.queryByText("1% de cashback")).toBeNull();
    expect(screen.getByText("+ 1 cupom")).toBeInTheDocument();
  });

  it("Has the texts 'Americanas', 'R$ 1,00 de cashback' and '20 cupons'", () => {
    render(<FixedCashbackCard />);
    expect(screen.getByText("Americanas")).toBeInTheDocument();
    expect(screen.getByText("R$ 5,00 de cashback")).toBeInTheDocument();
    expect(screen.getByText("+ 20 cupons")).toBeInTheDocument();
  });

  it("Not has the texts '%', 'cupons' and 'cupom'", () => {
    render(<CardWithoutCashbackAndCoupon />);
    expect(screen.queryByText("%")).not.toBeInTheDocument();
    expect(screen.getByTestId("textCoupon")).not.toHaveTextContent("cupons");
    expect(screen.getByTestId("textCoupon")).not.toHaveTextContent("cupom");
  });
});

describe("Test CardMiniature Component", () => {
  it("Must have an image with title and alt attribute with value 'Americanas'", () => {
    render(<CardMiniature />);
    expect(screen.getByTestId("image")).toHaveAttribute("title", "Americanas");
    expect(screen.getByTestId("image")).toHaveAttribute("alt", "Americanas");
  });

  it("Has the texts '5% de cashback' and '20 coupons'", () => {
    render(<CardMiniature />);
    expect(screen.getByText("5%")).toBeInTheDocument();
    expect(screen.getByText("+ 20 cupons")).toBeInTheDocument();
  });

  it("Not has the texts '%', 'cupons' and 'cupom'", () => {
    render(<CardMiniatureWithoutCashbackAndCoupon />);
    expect(screen.queryByText("%")).not.toBeInTheDocument();
    expect(screen.getByTestId("textCoupon")).not.toHaveTextContent("cupons");
    expect(screen.getByTestId("textCoupon")).not.toHaveTextContent("cupom");
  });
});
