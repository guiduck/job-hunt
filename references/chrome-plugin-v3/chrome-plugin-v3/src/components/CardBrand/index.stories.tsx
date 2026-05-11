/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import { CardBrand } from ".";

export default {
  title: "Components/CardBrand",
  component: CardBrand,
} as ComponentMeta<typeof CardBrand>;

const Template: ComponentStory<typeof CardBrand> = (args) => (
  <CardBrand {...args} />
);

export const Card = Template.bind({});
Card.args = {
  title: "Americanas",
  titleColor: "#4c4c4c",
  cashbackValue: "5",
  cashbackValueTypeRate: "P",
  cashbackColor: "#4CAF50",
  qtdCoupon: 20,
  qtdCouponColor: "#4c4c4c",
};

export const CardDefaultProps = Template.bind({});

export const CardWithoutCashbackAndCoupon = Template.bind({});
CardWithoutCashbackAndCoupon.args = {
  title: "Americanas",
  titleColor: "#4c4c4c",
  cashbackValue: "",
  cashbackColor: "#4CAF50",
  qtdCoupon: 0,
  qtdCouponColor: "#4c4c4c",
};

export const CardMiniature = Template.bind({});
CardMiniature.args = {
  title: "Americanas",
  titleColor: "#4c4c4c",
  cashbackValue: "5",
  cashbackValueTypeRate: "P",
  cashbackColor: "#4CAF50",
  qtdCoupon: 20,
  qtdCouponColor: "#4c4c4c",
  isMiniature: true,
};

export const CardMiniatureWithoutCashbackAndCoupon = Template.bind({});
CardMiniatureWithoutCashbackAndCoupon.args = {
  title: "Americanas",
  titleColor: "#4c4c4c",
  cashbackValue: "",
  cashbackColor: "#4CAF50",
  qtdCoupon: 0,
  qtdCouponColor: "#4c4c4c",
  isMiniature: true,
};

export const FixedCashbackCard = Template.bind({});
FixedCashbackCard.args = {
  title: "Americanas",
  titleColor: "#4c4c4c",
  cashbackValue: "5,00",
  cashbackValueTypeRate: "F",
  cashbackColor: "#4CAF50",
  qtdCoupon: 20,
  qtdCouponColor: "#4c4c4c",
};
