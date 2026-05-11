/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import { CardCoupon } from ".";

export default {
  title: "Components/CardCoupon",
  component: CardCoupon,
} as ComponentMeta<typeof CardCoupon>;

const Template: ComponentStory<typeof CardCoupon> = (args) => (
  <CardCoupon {...args} />
);

export const DiscountCoupon = Template.bind({});
DiscountCoupon.args = {
  isItOffer: false,
  code: "CUPONERIA15",
  couponDescription: "Cupom de desconto",
  badges: ["15% OFF", "2% de cashback"],
  rulesText: "regras aqui!",
  storeLogo:
    "https://www.vitoriaparkshopping.com/wp-content/uploads/2016/12/logo_site-13.png",
  storeName: "marisa",
};

export const OfferCard = Template.bind({});
OfferCard.args = {
  isItOffer: true,
  code: "CUPONERIA15",
  couponDescription: "Cupom de desconto",
  badges: ["15% OFF", "2% de cashback"],
  rulesText: "regras aqui!",
  storeLogo:
    "https://www.vitoriaparkshopping.com/wp-content/uploads/2016/12/logo_site-13.png",
  storeName: "marisa",
};

export const YesterdayVerificationDate = Template.bind({});
YesterdayVerificationDate.args = {
  isItOffer: true,
  code: "CUPONERIA15",
  couponDescription: "Cupom de desconto",
  badges: ["15% OFF", "2% de cashback"],
  rulesText: "regras aqui!",
  storeLogo:
    "https://www.vitoriaparkshopping.com/wp-content/uploads/2016/12/logo_site-13.png",
  storeName: "marisa",
};

export const TodayVerificationDate = Template.bind({});
TodayVerificationDate.args = {
  isItOffer: true,
  code: "CUPONERIA15",
  couponDescription: "Cupom de desconto",
  badges: ["15% OFF", "2% de cashback"],
  rulesText: "regras aqui!",
  storeLogo:
    "https://www.vitoriaparkshopping.com/wp-content/uploads/2016/12/logo_site-13.png",
  storeName: "marisa",
};

export const TodayVerificationDateWithoutLogo = Template.bind({});
TodayVerificationDateWithoutLogo.args = {
  isItOffer: true,
  code: "CUPONERIA15",
  couponDescription: "Cupom de desconto",
  badges: ["15% OFF", "2% de cashback"],
  rulesText: "regras aqui!",
};

export const TenDaysVerificationDate = Template.bind({});
TenDaysVerificationDate.args = {
  isItOffer: true,
  code: "CUPONERIA15",
  couponDescription: "Cupom de desconto",
  badges: ["15% OFF", "2% de cashback"],
  rulesText: "regras aqui!",
};
