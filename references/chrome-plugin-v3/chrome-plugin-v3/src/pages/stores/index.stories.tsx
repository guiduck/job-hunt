/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import Stores from ".";

export default {
  title: "Pages/Stores",
  component: Stores,
} as ComponentMeta<typeof Stores>;

export const Default = (
  (() => (
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<Stores />} />
      </Routes>
    </MemoryRouter>
  )) as ComponentStory<typeof Stores>
).bind({});

export const NoStoreFound = (
  (() => (
    <MemoryRouter initialEntries={["/?noStoreFound=true"]}>
      <Routes>
        <Route path="/" element={<Stores />} />
      </Routes>
    </MemoryRouter>
  )) as ComponentStory<typeof Stores>
).bind({});
