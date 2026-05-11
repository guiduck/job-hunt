/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-empty-function */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import { UsingCouponStep } from ".";

export default {
  title: "Components/UsingCouponStep",
  component: UsingCouponStep,
} as ComponentMeta<typeof UsingCouponStep>;

const Template: ComponentStory<typeof UsingCouponStep> = (args) => (
  <UsingCouponStep {...args} />
);

export const Default = Template.bind({});
Default.args = {
  navigateTo: () => {},
  goToStep: (step) => {},
  theme: "cuponeria",
};
