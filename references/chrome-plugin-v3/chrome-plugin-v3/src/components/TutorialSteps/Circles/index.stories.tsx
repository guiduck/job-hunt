/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-empty-function */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import { Circles } from ".";

export default {
  title: "Components/Circles",
  component: Circles,
} as ComponentMeta<typeof Circles>;

const Template: ComponentStory<typeof Circles> = (args) => (
  <Circles {...args} />
);

export const Default = Template.bind({});
Default.args = {
  goToStep: (step) => {},
  numberOfPages: 3,
  currentStep: 0,
};
