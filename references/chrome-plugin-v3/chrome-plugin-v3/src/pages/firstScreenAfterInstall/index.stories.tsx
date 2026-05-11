/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import FirstScreenAfterInstall from ".";

export default {
  title: "Pages/FirstScreenAfterInstall",
  component: FirstScreenAfterInstall,
} as ComponentMeta<typeof FirstScreenAfterInstall>;

export const Default = (
  (() => (
    <MemoryRouter initialEntries={["/first-tutorial"]}>
      <Routes>
        <Route path="/first-tutorial" element={<FirstScreenAfterInstall />} />
      </Routes>
    </MemoryRouter>
  )) as ComponentStory<typeof FirstScreenAfterInstall>
).bind({});
