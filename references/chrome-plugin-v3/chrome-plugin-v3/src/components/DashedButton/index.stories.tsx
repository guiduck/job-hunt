/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import ContentCopyIcon from "../Icons/svg/ContentCopyIcon";

import { DashedButton } from ".";
import CheckCircleIcon from "../Icons/svg/CheckCircleIcon";

export default {
  title: "Components/DashedButton",
  component: DashedButton,
} as ComponentMeta<typeof DashedButton>;

const Template: ComponentStory<typeof DashedButton> = (args) => (
  <DashedButton {...args} />
);

export const DiscountCouponButton = Template.bind({});
DiscountCouponButton.args = {
  isItOffer: false,
  label: "CUPONERIA15",
  active: false,
  icon: <ContentCopyIcon />,
};

export const DiscountCouponButtonActive = Template.bind({});
DiscountCouponButtonActive.args = {
  isItOffer: false,
  label: "CUPONERIA15",
  active: true,
  icon: <CheckCircleIcon color="#4caf50" size={16} />,
};

export const OfferButton = Template.bind({});
OfferButton.args = {
  isItOffer: true,
  label: "aproveitar oferta",
  icon: undefined,
};
