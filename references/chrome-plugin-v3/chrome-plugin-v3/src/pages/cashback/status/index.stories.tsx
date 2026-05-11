/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import Status from ".";

export default {
  title: "Pages/Cashback Status",
  component: Status,
} as ComponentMeta<typeof Status>;

export const Activated = (
  (() => (
    <MemoryRouter
      initialEntries={[
        "/status/activated?cashbackRate=10&cashbackValueTypeRate=P",
      ]}
    >
      <Routes>
        <Route path="/status/:id" element={<Status />} />
      </Routes>
    </MemoryRouter>
  )) as ComponentStory<typeof Status>
).bind({});

export const Deactivated = (
  (() => (
    <MemoryRouter initialEntries={["/status/deactivated?cashbackRate=10%"]}>
      <Routes>
        <Route path="/status/:id" element={<Status />} />
      </Routes>
    </MemoryRouter>
  )) as ComponentStory<typeof Status>
).bind({});

export const NotActivated = (
  (() => (
    <MemoryRouter initialEntries={["/status/notActivated"]}>
      <Routes>
        <Route path="/status/:id" element={<Status />} />
      </Routes>
    </MemoryRouter>
  )) as ComponentStory<typeof Status>
).bind({});

export const Processing = (
  (() => (
    <MemoryRouter initialEntries={["/status/processing"]}>
      <Routes>
        <Route path="/status/:id" element={<Status />} />
      </Routes>
    </MemoryRouter>
  )) as ComponentStory<typeof Status>
).bind({});
