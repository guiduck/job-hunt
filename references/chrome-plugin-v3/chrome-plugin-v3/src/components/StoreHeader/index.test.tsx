/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/testing-react";
import "@testing-library/jest-dom";

// import Button stories file as a module
import * as stories from "./index.stories";

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level!
const { StoreDefaultProps, Store, StoreCashbackActive, StoreDiscountTrue } =
  composeStories(stories);

describe("Test Store Header Component", () => {
  it("Must have an image with title and alt attribute with value 'Título', has the texts 'Título' and 'regras do parceiro' and don't find the icon", () => {
    render(<StoreDefaultProps />);
    expect(screen.getByTestId("image")).toHaveAttribute("title", "Título");
    expect(screen.getByTestId("image")).toHaveAttribute("alt", "Título");
    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("regras do parceiro")).toBeInTheDocument();
    expect(screen.queryByTestId("icon")).toBeFalsy();
  });

  it("Simlate click button", () => {
    render(<StoreDefaultProps />);
    expect(screen.getByTestId("buttonRule")).not.toHaveTextContent(
      "Não existem regras definidas neste cashback."
    );
    expect(screen.getByText("regras do parceiro")).toBeInTheDocument();

    const button = screen.getByTestId("buttonRule");

    fireEvent.click(button);
    expect(
      screen.getByText("Não existem regras definidas neste cashback.")
    ).toBeInTheDocument();
  });

  it("Must have an image with title and alt attribute with value 'Submarino' and has the texts '5% de cashback', 'Submarino', 'ativar cashback' and 'regras do parceiro'", () => {
    render(<Store />);
    expect(screen.getByTestId("image")).toHaveAttribute("title", "Submarino");
    expect(screen.getByTestId("image")).toHaveAttribute("alt", "Submarino");
    expect(screen.getByText("5% de cashback")).toBeInTheDocument();
    expect(screen.getByText("Submarino")).toBeInTheDocument();
    expect(screen.getByText("ativar cashback")).toBeInTheDocument();
    expect(screen.getByText("regras do parceiro")).toBeInTheDocument();
  });

  it("Has the texts '10% de cashback ativado', 'Agora...' and 'regras do parceiro'", () => {
    render(<StoreCashbackActive />);
    expect(screen.getByText("10% de cashback ativado")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Agora é só concluir sua compra e aguardar a liberação no seu extrato da Cuponeria"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("regras do parceiro")).toBeInTheDocument();
  });

  it("Has the texts 'R$10 de desconto', 'Título' and not has text 'regras do parceiro' and icon", () => {
    render(<StoreDiscountTrue />);
    expect(screen.getByText("R$10 de desconto")).toBeInTheDocument();
    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.queryByText("regras do parceiro")).not.toBeInTheDocument();
    expect(screen.queryByTestId("icon")).toBeFalsy();
  });
});
