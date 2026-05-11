/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/testing-react";
import "@testing-library/jest-dom";

// import DashedButton stories file as a module
import * as stories from "./index.stories";

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level!
const {
  DiscountCoupon,
  OfferCard,
  // TodayVerificationDate,
  // YesterdayVerificationDate,
  TenDaysVerificationDate,
} = composeStories(stories);

it("should render DiscountCoupon component", () => {
  render(<DiscountCoupon />);

  expect(screen.getByText("CUPONERIA15")).toBeInTheDocument();
  expect(screen.getByText("Cupom de desconto")).toBeInTheDocument();
  expect(screen.getByText("ver regra")).toBeInTheDocument();
  expect(screen.getByTestId("card-coupon-svg")).toBeInTheDocument();
  expect(screen.getByTestId("card-coupon-footer").childElementCount).toBe(1);
});

it("should render OfferCard component", () => {
  render(<OfferCard />);

  expect(screen.getByText("aproveitar oferta")).toBeInTheDocument();
  expect(screen.getByText("Cupom de desconto")).toBeInTheDocument();
  expect(screen.getByText("ver regra")).toBeInTheDocument();
  expect(screen.getByTestId("card-coupon-footer").childElementCount).toBe(1);
});

// it("should render OfferCard with date at today", () => {
//   render(<TodayVerificationDate />);

//   expect(screen.getByText("aproveitar oferta")).toBeInTheDocument();
//   expect(screen.getByText("Cupom de desconto")).toBeInTheDocument();
//   expect(screen.getByText("ver regra")).toBeInTheDocument();
//   expect(screen.getByText("verificado hoje")).toBeInTheDocument();
//   expect(screen.getByTestId("card-coupon-footer").childElementCount).toBe(2);
// });

// it("should render OfferCard with date at yesterday", () => {
//   render(<YesterdayVerificationDate />);

//   expect(screen.getByText("aproveitar oferta")).toBeInTheDocument();
//   expect(screen.getByText("Cupom de desconto")).toBeInTheDocument();
//   expect(screen.getByText("ver regra")).toBeInTheDocument();
//   expect(screen.getByText("verificado ontem")).toBeInTheDocument();
//   expect(screen.getByTestId("card-coupon-footer").childElementCount).toBe(2);
// });

it("should render OfferCard with date over 7 days", () => {
  render(<TenDaysVerificationDate />);

  expect(screen.getByText("aproveitar oferta")).toBeInTheDocument();
  expect(screen.getByText("Cupom de desconto")).toBeInTheDocument();
  expect(screen.getByText("ver regra")).toBeInTheDocument();
  expect(screen.getByTestId("card-coupon-footer").childElementCount).toBe(1);
});
