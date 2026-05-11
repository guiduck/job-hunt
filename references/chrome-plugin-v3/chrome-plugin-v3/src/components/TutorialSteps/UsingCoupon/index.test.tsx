import React from "react";
import { render, fireEvent } from "@testing-library/react";
import UsingCouponStep from ".";
import "@testing-library/jest-dom";

const mockProps = {
  currentStep: 1,
  goToStep: jest.fn(),
  theme: "cuponeria" as const,
  navigateTo: jest.fn(),
};

describe("UsingCouponStep", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly", () => {
    render(<UsingCouponStep {...mockProps} />);
    expect(render).toMatchSnapshot();
  });

  it("renders StoreHeader component", async () => {
    const { getByTestId } = render(<UsingCouponStep {...mockProps} />);
    expect(getByTestId("image")).toBeInTheDocument();
  });

  it("renders CardCoupon components", () => {
    const { getAllByTestId } = render(<UsingCouponStep {...mockProps} />);
    expect(getAllByTestId("card-coupon-footer")[0]).toBeInTheDocument();
  });

  it("renders Circles component", () => {
    const { getAllByTestId } = render(<UsingCouponStep {...mockProps} />);
    expect(
      getAllByTestId("circle-navigation-indicator")[0]
    ).toBeInTheDocument();
  });

  it("renders Button component", () => {
    const { getByText } = render(<UsingCouponStep {...mockProps} />);
    expect(getByText("próximo")).toBeInTheDocument();
  });

  it("calls goToStep function when Button is clicked", () => {
    const { getByText } = render(<UsingCouponStep {...mockProps} />);
    const button = getByText("próximo");
    fireEvent.click(button);
    expect(mockProps.goToStep).toHaveBeenCalledWith(3);
  });

  it("calls navigateTo function when AncorButton is clicked", () => {
    const { getByText } = render(<UsingCouponStep {...mockProps} />);
    const ancorButton = getByText("pular tour");
    fireEvent.click(ancorButton);
    expect(mockProps.navigateTo).toHaveBeenCalled();
  });
});
