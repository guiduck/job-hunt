/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/testing-react";
import "@testing-library/jest-dom";

// import DashedButton stories file as a module
import * as stories from "./index.stories";

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level!
const { DiscountCouponButton, DiscountCouponButtonActive, OfferButton } =
  composeStories(stories);

it("should renders a discount coupon button with label and icon", () => {
  render(<DiscountCouponButton />);

  const component = screen.getByTestId("card-coupon-button");
  const svg = screen.getByTestId("card-coupon-svg");

  expect(component).toBeInTheDocument();
  expect(component).toContainElement(svg);
  expect(screen.getByText("CUPONERIA15")).toBeInTheDocument();

  expect(svg.firstChild).toBeInTheDocument();
});

it("should return a discount coupon button with label and button when it is clicked", () => {
  render(<DiscountCouponButtonActive />);

  const component = screen.getByTestId("card-coupon-button");
  const svg = screen.getByTestId("card-coupon-svg");

  expect(component).toBeInTheDocument();
  expect(screen.getByText("CUPONERIA15")).toBeInTheDocument();
  expect(component).toContainElement(svg);

  expect(svg.firstChild).toBeInTheDocument();
});

it("should render a offer button with only a label", () => {
  render(<OfferButton />);

  const component = screen.getByTestId("card-coupon-button");

  expect(component).toBeInTheDocument();
  expect(component.childElementCount).toEqual(1);
  expect(screen.getByText("aproveitar oferta")).toBeInTheDocument();
});
