/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { render, screen } from "@testing-library/react";
import { composeStories } from "@storybook/testing-react";
import { userEvent } from "@storybook/testing-library";
import "@testing-library/jest-dom";

// import Button stories file as a module
import * as stories from "./index.stories";

const { Default, WithoutIcon } = composeStories(stories);

describe("The input should be rendered ", () => {
  test("And automatic events fired", (done) => {
    const onTyping = jest.fn();
    const onTyped = jest.fn();

    render(
      <Default
        inputDelayMs={10}
        onUserTyped={onTyped}
        onUserTyping={onTyping}
      />
    );

    userEvent.type(screen.getByTestId("input"), "teste");

    new Promise((r) => {
      setTimeout(r, 100);
    }).then(() => {
      expect(onTyping).toBeCalledTimes(5);
      expect(onTyped).toBeCalled();
      done();
    });
  });

  test("And user events fired", () => {
    const onTyping = jest.fn();
    const onTyped = jest.fn();

    render(<Default onUserTyped={onTyped} onUserTyping={onTyping} />);

    userEvent.type(screen.getByTestId("input"), "teste");
    userEvent.type(screen.getByTestId("input"), "{enter}");

    expect(onTyping).toBeCalledTimes(5);
    expect(onTyped).toBeCalled();
  });

  test("And don't have the icon", () => {
    render(<Default />);

    expect(screen.getByTestId("input")).toHaveStyle(
      "padding: 5px 5px 5px 35px"
    );
  });

  test("And have the icon", () => {
    render(<WithoutIcon />);

    expect(screen.getByTestId("input")).toHaveStyle(
      "padding: 5px 5px 5px 15px"
    );
  });
});
