/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/testing-react";
import { userEvent } from "@storybook/testing-library";
import "@testing-library/jest-dom";

// import Button stories file as a module
import * as stories from "./index.stories";
import { Button } from "../../components/Button";

// Every component that is returned maps 1:1 with the stories, but they already contain all decorators from story level, meta level and global level!
const { Default } = composeStories(stories);

describe("[Page: Tutorial", () => {
  it("should renders tutorial page with conditional rendering using click events", async () => {
    render(<Default />);

    const { getByText } = render(<Button />);

    expect(screen.getByText("Como funciona?")).toBeInTheDocument();
    expect(
      screen.getByText("Faça uma tour guiada pela extensão :)")
    ).toBeInTheDocument();

    expect(getByText(/começar/i)).toBeInTheDocument();
    userEvent.click(getByText(/começar/i));

    expect(screen.getByText("Ativando seu cashback")).toBeInTheDocument();

    expect(getByText(/próximo/i)).toBeInTheDocument();
    userEvent.click(getByText(/próximo/i));

    expect(screen.getByText("Cupons de desconto")).toBeInTheDocument();

    expect(getByText(/próximo/i)).toBeInTheDocument();
    userEvent.click(getByText(/próximo/i));

    expect(
      screen.getByText(/Após a conclusão da sua compra/i)
    ).toBeInTheDocument();
    expect(getByText(/começar/i)).toBeInTheDocument();

    expect(getByText(/começar/i)).toBeInTheDocument();
    userEvent.click(getByText(/começar/i));
  });
});
