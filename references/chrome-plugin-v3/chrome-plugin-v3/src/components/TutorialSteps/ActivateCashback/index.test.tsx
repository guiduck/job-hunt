import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { mockedOffer } from "../../../mocks/offerMock";
import ActivateCashbackStep from ".";
import "@testing-library/jest-dom";

describe("ActivateCashbackStep component", () => {
  it("renders without crashing", () => {
    render(
      <ActivateCashbackStep
        goToStep={jest.fn()}
        theme="elo"
        navigateTo={jest.fn()}
      />
    );
  });

  it("displays the correct store logo based on the theme", () => {
    const { getByAltText } = render(
      <ActivateCashbackStep
        goToStep={jest.fn()}
        theme="cuponeria"
        navigateTo={jest.fn()}
      />
    );

    const storeLogo = getByAltText("Cuponeria");
    expect(storeLogo).toBeInTheDocument();
  });

  it("calls the goToStep function when the next button is clicked", () => {
    const goToStep = jest.fn();

    const { getByText } = render(
      <ActivateCashbackStep
        goToStep={goToStep}
        theme="elo"
        navigateTo={jest.fn()}
      />
    );

    const nextButton = getByText("próximo");

    fireEvent.click(nextButton);

    expect(goToStep).toHaveBeenCalledTimes(1);
    expect(goToStep).toHaveBeenCalledWith(2);
  });

  it("calls the navigateTo function when the skip tour button is clicked", () => {
    const navigateTo = jest.fn();

    const { getByText } = render(
      <ActivateCashbackStep
        goToStep={navigateTo}
        theme="elo"
        navigateTo={navigateTo}
      />
    );

    const skipTourButton = getByText("pular tour");

    fireEvent.click(skipTourButton);

    expect(navigateTo).toHaveBeenCalledTimes(1);
  });

  it("displays the correct coupon information", () => {
    const { getAllByText } = render(
      <ActivateCashbackStep
        goToStep={jest.fn()}
        theme="elo"
        navigateTo={jest.fn()}
      />
    );

    const couponDescription = getAllByText(mockedOffer.title as string);

    expect(couponDescription[0]).toBeInTheDocument();
  });

  it("displays the correct badges", () => {
    const { getByText } = render(
      <ActivateCashbackStep
        goToStep={jest.fn()}
        theme="elo"
        navigateTo={jest.fn()}
      />
    );

    const cashbackBadge = getByText("8% de cashback");

    expect(cashbackBadge).toBeInTheDocument();
  });
});
