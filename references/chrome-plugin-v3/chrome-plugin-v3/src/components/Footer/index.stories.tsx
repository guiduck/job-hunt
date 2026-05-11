/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import { MemoryRouter, Route, Routes } from "react-router-dom";
import Footer from ".";

import iconsMock from "./mockData";

export default {
  title: "Components/Footer",
  component: Footer,
} as ComponentMeta<typeof Footer>;

export const Default = (
  ((args) => (
    <MemoryRouter initialEntries={[`/`]}>
      <Routes>
        {iconsMock.map((element) => (
          <Route
            path={element.path}
            element={<Footer {...args} />}
            key={element.path}
          />
        ))}
      </Routes>
    </MemoryRouter>
  )) as ComponentStory<typeof Footer>
).bind({});

Default.args = {
  icons: iconsMock,
};
