/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-empty-function */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import { ActivateCashbackStep } from ".";

export default {
  title: "Components/ActivateCashbackStep",
  component: ActivateCashbackStep,
} as ComponentMeta<typeof ActivateCashbackStep>;

const Template: ComponentStory<typeof ActivateCashbackStep> = (args) => (
  <ActivateCashbackStep {...args} />
);

export const Default = Template.bind({});
Default.args = {
  navigateTo: () => {},
  goToStep: (step) => {},
  theme: "cuponeria",
};
