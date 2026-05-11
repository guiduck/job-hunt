/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import Tutorial from ".";

export default {
  title: "Pages/Tutorial",
  component: Tutorial,
} as ComponentMeta<typeof Tutorial>;

export const Default = (
  (() => (
    <MemoryRouter initialEntries={["/tutorial"]}>
      <Routes>
        <Route path="/tutorial" element={<Tutorial />} />
      </Routes>
    </MemoryRouter>
  )) as ComponentStory<typeof Tutorial>
).bind({});
