/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/testing-react";
import "@testing-library/jest-dom";

// import Button stories file as a module
import * as stories from "./index.stories";

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level!
const { Activated, Deactivated, NotActivated, Processing } =
  composeStories(stories);

describe("[Page: Cashback Status", () => {
  test("Render activated screen", () => {
    render(<Activated />);

    expect(screen.getByTestId("pigImage").firstChild).toBeTruthy();

    const title = screen.getByText("10% de cashback ativado!");
    const subTitle = screen.getByText(
      "Prepare seu carrinho novamente e finalize sua compra nesta aba!"
    );
    const button = screen.getByText("continuar");

    expect(title).toBeInTheDocument();
    expect(subTitle).toBeInTheDocument();
    expect(button).toBeInTheDocument();
  });

  test("Render deactivated screen", () => {
    render(<Deactivated />);

    expect(screen.getByTestId("pigImage").firstChild).toBeTruthy();

    const title = screen.getByText("Seu cashback foi desativado");
    const subTitle = screen.getByText("Seu cashback foi desativado");
    const button = screen.getByText("ativar 10% de cashback");

    expect(title).toBeInTheDocument();
    expect(subTitle).toBeInTheDocument();
    expect(button).toBeInTheDocument();
  });

  test("Render not activated screen", () => {
    render(<NotActivated />);

    expect(screen.getByTestId("pigImage").firstChild).toBeTruthy();

    const title = screen.getByText("Não finalize sua compra nesta aba");
    const button = screen.getByText("ir para aba com cashback");

    expect(title).toBeInTheDocument();
    expect(button).toBeInTheDocument();

    // since "na aba que abrimos" is inside a tag, RTL can't find the whole phrase.
    // so we use a regex to find the object, then we get the whole text to assert
    const subTitle = screen.getByText(/Para ganhar cashback, (.*) rastreá-la/i);
    expect(subTitle.textContent).toBe(
      "Para ganhar cashback, finalize a compra na aba que abrimos, assim podemos rastreá-la."
    );
  });

  test("Render processing screen", () => {
    render(<Processing />);

    expect(screen.getByTestId("pigImage").firstChild).toBeTruthy();

    const title = screen.getByText("Estamos analisando seu cashback!");
    const subTitle = screen.getByText(
      "Em breve, você receberá um email e o valor estará no seu extrato."
    );
    const button = screen.getByText("continuar comprando");

    expect(title).toBeInTheDocument();
    expect(subTitle).toBeInTheDocument();
    expect(button).toBeInTheDocument();
  });
});
