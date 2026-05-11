import React from "react";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ConclusionStep from "./conclusionStep";

describe("ConclusionStep component", () => {
  it("renders without crashing", () => {
    render(<ConclusionStep goToStep={jest.fn()} navigateTo={jest.fn()} />);
  });

  it("displays the piggy gif", () => {
    const { getByAltText } = render(
      <ConclusionStep goToStep={jest.fn()} navigateTo={jest.fn()} />
    );
    const piggyGif: HTMLElement & { src?: string } = getByAltText("piggy-gif");
    expect(piggyGif).toBeInTheDocument();
    expect(piggyGif.src).toBe(
      "https://media.cuponeria.com.br/cuponeria4/imagens/ilustracoes/extensao/porquinho-cofre-extensao.gif"
    );
  });

  it("displays the end tutorial description", () => {
    const { getByText } = render(
      <ConclusionStep goToStep={jest.fn()} navigateTo={jest.fn()} />
    );
    const endTutorialDescription = getByText(
      "Após a conclusão da sua compra, seu cashback entrará na sua carteira Cuponeria em até 7 dias"
    );
    expect(endTutorialDescription).toBeInTheDocument();
  });

  it("calls navigateTo function when the button is clicked", () => {
    const navigateTo = jest.fn();
    const { getByText } = render(
      <ConclusionStep goToStep={jest.fn()} navigateTo={navigateTo} />
    );
    const button = getByText("começar");
    fireEvent.click(button);
    expect(navigateTo).toHaveBeenCalled();
  });

  it("does not display the piggy gif if the src is not provided", () => {
    const { queryByAltText } = render(
      <ConclusionStep goToStep={jest.fn()} navigateTo={jest.fn()} />
    );
    const piggyGif = queryByAltText("piggy gif");
    expect(piggyGif).not.toBeInTheDocument();
  });

  it("calls goToStep function with the correct step when a step is clicked in the Circles component", () => {
    const goToStep = jest.fn();
    const { getAllByTestId } = render(
      <ConclusionStep goToStep={goToStep} navigateTo={jest.fn()} />
    );
    const steps = getAllByTestId("circle-navigation-indicator")[1];
    fireEvent.click(steps);
    expect(goToStep).toHaveBeenCalledWith(2);
  });

  it("call navigateTo function when começar is clicked", () => {
    const navigateTo = jest.fn();
    const { getByText } = render(
      <ConclusionStep goToStep={jest.fn()} navigateTo={navigateTo} />
    );
    const button = getByText("começar");
    fireEvent.click(button);
    expect(navigateTo).toHaveBeenCalled();
  });

  it("does not call goToStep function when a step is clicked in the Circles component if the step is disabled", () => {
    const goToStep = jest.fn();
    const { getAllByTestId } = render(
      <ConclusionStep goToStep={goToStep} navigateTo={jest.fn()} />
    );
    const steps = getAllByTestId("circle-navigation-indicator")[2];
    fireEvent.click(steps);
    expect(goToStep).not.toHaveBeenCalled();
  });
});
