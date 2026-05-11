/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import { StoreHeader } from ".";

export default {
  title: "Components/StoreHeader",
  component: StoreHeader,
} as ComponentMeta<typeof StoreHeader>;

const Template: ComponentStory<typeof StoreHeader> = (args) => (
  <StoreHeader {...args} />
);

export const StoreDefaultProps = Template.bind({});

export const Store = Template.bind({});
Store.args = {
  title: "Submarino",
  cashbackValue: "5%",
  oldCashbackValue: "2%",
};

export const StoreCashbackActive = Template.bind({});
StoreCashbackActive.args = {
  cashbackIsActive: true,
  cashbackValue: "10%",
  oldCashbackValue: "5%",
};

export const StoreDiscountTrue = Template.bind({});
StoreDiscountTrue.args = {
  isDiscount: true,
  cashbackValue: "R$10",
};

export const StoreDiscountAndOldDiscountTrue = Template.bind({});
StoreDiscountAndOldDiscountTrue.args = {
  isDiscount: true,
  cashbackValue: "R$10",
  oldCashbackValue: "R$ 7",
};
