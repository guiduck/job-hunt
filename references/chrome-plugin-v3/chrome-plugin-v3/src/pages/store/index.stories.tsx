/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import Store from ".";

export default {
  title: "Pages/Store",
  component: Store,
} as ComponentMeta<typeof Store>;

export const Default = (
  (() => (
    <MemoryRouter initialEntries={["/store/netshoes"]}>
      <Routes>
        <Route path="/store/:id" element={<Store />} />
      </Routes>
    </MemoryRouter>
  )) as ComponentStory<typeof Store>
).bind({});
