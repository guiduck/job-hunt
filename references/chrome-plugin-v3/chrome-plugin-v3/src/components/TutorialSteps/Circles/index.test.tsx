import React from "react";
import { render, fireEvent } from "@testing-library/react";
import Circles from ".";
import "@testing-library/jest-dom";

const mockGoToStep = jest.fn();

describe("Circles component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(
      <Circles currentStep={1} goToStep={mockGoToStep} numberOfPages={3} />
    );
  });

  it("calls goToStep function with the correct index when NavigationCircles component is clicked", () => {
    const { getAllByTestId } = render(
      <Circles currentStep={1} goToStep={mockGoToStep} numberOfPages={3} />
    );

    fireEvent.click(getAllByTestId("circle-navigation-indicator")[1]);

    expect(mockGoToStep).toHaveBeenCalledWith(2);
  });

  it("does not call goToStep function when the current step is equal to the index", () => {
    const { getAllByTestId } = render(
      <Circles currentStep={1} goToStep={mockGoToStep} numberOfPages={3} />
    );

    fireEvent.click(getAllByTestId("circle-navigation-indicator")[0]);

    expect(mockGoToStep).not.toHaveBeenCalled();
  });

  it("does not call goToStep function when the current step is equal to the index (edge case)", () => {
    const { getAllByTestId } = render(
      <Circles currentStep={3} goToStep={mockGoToStep} numberOfPages={3} />
    );

    fireEvent.click(getAllByTestId("circle-navigation-indicator")[2]);

    expect(mockGoToStep).not.toHaveBeenCalled();
  });

  it("calls goToStep function with the correct index when NavigationCircles component is clicked (negative case)", () => {
    const { getAllByTestId } = render(
      <Circles currentStep={1} goToStep={mockGoToStep} numberOfPages={3} />
    );

    fireEvent.click(getAllByTestId("circle-navigation-indicator")[2]);

    expect(mockGoToStep).toHaveBeenCalled();
    expect(mockGoToStep).toHaveBeenCalledWith(3);
  });

  it("does not call goToStep function when the current step is equal to the index (negative case)", () => {
    const { getAllByTestId } = render(
      <Circles currentStep={1} goToStep={mockGoToStep} numberOfPages={3} />
    );

    fireEvent.click(getAllByTestId("circle-navigation-indicator")[0]);

    expect(mockGoToStep).not.toHaveBeenCalled();
  });
});
