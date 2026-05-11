import React from "react";
import { render, fireEvent } from "@testing-library/react";
import StartStep from ".";
import "@testing-library/jest-dom";

describe("StartStep component", () => {
  const onClickMock = jest.fn();
  const goToStepMock = jest.fn();

  beforeEach(() => {
    onClickMock.mockClear();
    goToStepMock.mockClear();
  });

  it("should render StartStep component correctly on first time", () => {
    const { getByText, getByAltText, queryByText } = render(
      <StartStep onClick={onClickMock} firstTime goToStep={goToStepMock} />
    );

    expect(getByAltText("piggy-gif")).toBeInTheDocument();
    expect(getByText("Como funciona?")).toBeInTheDocument();
    expect(
      getByText("Faça uma tour guiada pela extensão :)")
    ).toBeInTheDocument();
    expect(getByText("começar")).toBeInTheDocument();
    expect(queryByText("pular tour")).toBeNull(); // Should not show on first time
  });

  it("should render 'pular tour' button when not first time", () => {
    const { getByText, queryByText } = render(
      <StartStep
        onClick={onClickMock}
        firstTime={false}
        goToStep={goToStepMock}
      />
    );

    expect(getByText("começar")).toBeInTheDocument();
    expect(queryByText("pular tour")).toBeInTheDocument(); // Should show when not first time
  });

  it("should call goToStep function when 'começar' button is clicked", () => {
    const { getByText } = render(
      <StartStep onClick={onClickMock} firstTime goToStep={goToStepMock} />
    );

    const startButton = getByText("começar");

    fireEvent.click(startButton);
    expect(goToStepMock).toHaveBeenCalledTimes(1);
  });

  it("should call onClick function when 'pular tour' button is clicked", () => {
    const { getByText } = render(
      <StartStep
        onClick={onClickMock}
        firstTime={false}
        goToStep={goToStepMock}
      />
    );

    const skipButton = getByText("pular tour");

    fireEvent.click(skipButton);
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it("should not render 'pular tour' button if firstTime prop is true", () => {
    const { queryByText } = render(
      <StartStep onClick={onClickMock} firstTime goToStep={goToStepMock} />
    );

    expect(queryByText("pular tour")).toBeNull();
  });

  it("should render the correct image source", () => {
    const { getByAltText } = render(
      <StartStep onClick={onClickMock} firstTime goToStep={goToStepMock} />
    );

    const piggyGif: HTMLElement & { src?: string } = getByAltText("piggy-gif");

    expect(piggyGif.src).toBe(
      "https://media.cuponeria.com.br/cuponeria4/imagens/ilustracoes/extensao/porquinho-detetive-extensao.gif"
    );
  });
});
