/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ActivateCashbackPopup } from ".";

export default {
  title: "Components/Activate Cashback Popup",
  component: ActivateCashbackPopup,
} as ComponentMeta<typeof ActivateCashbackPopup>;

const Template: ComponentStory<typeof ActivateCashbackPopup> = ((args) => (
  <MemoryRouter initialEntries={[`/`]}>
    <Routes>
      <Route path="/" element={<ActivateCashbackPopup {...args} />} />
    </Routes>
  </MemoryRouter>
)) as ComponentStory<typeof ActivateCashbackPopup>;

export const Default = Template.bind({});

export const PercentageCashback = Template.bind({});
PercentageCashback.args = {
  storeName: "Americanas",
  cashbackRate: "4",
  oldCashbackRate: "2",
  cashbackValueTypeRate: "P",
};

export const FixedCashback = Template.bind({});
FixedCashback.args = {
  storeName: "Americanas",
  cashbackRate: "4,00",
  oldCashbackRate: "2,00",
  cashbackValueTypeRate: "F",
};
