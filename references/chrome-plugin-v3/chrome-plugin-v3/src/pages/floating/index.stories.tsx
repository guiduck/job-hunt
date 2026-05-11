/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import Floating from ".";

export default {
  title: "Pages/Floating",
  component: Floating,
} as ComponentMeta<typeof Floating>;

const query =
  "?slug=americanas-com&offerCount=10&storeName=Netshoes&cashbackRate=10&cashbackValueTypeRate=P&cashbackPreviousRate=5";

export const Default = (
  (() => (
    <MemoryRouter initialEntries={[`/floating${query}`]}>
      <Routes>
        <Route path="/floating/" element={<Floating />} />
      </Routes>
    </MemoryRouter>
  )) as ComponentStory<typeof Floating>
).bind({});
