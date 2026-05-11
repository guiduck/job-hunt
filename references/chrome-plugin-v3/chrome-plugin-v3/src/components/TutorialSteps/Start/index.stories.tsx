/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-empty-function */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import { StartStep } from ".";

export default {
  title: "Components/StartStep",
  component: StartStep,
} as ComponentMeta<typeof StartStep>;

const Template: ComponentStory<typeof StartStep> = (args) => (
  <StartStep {...args} />
);

export const Default = Template.bind({});
Default.args = {
  onClick: () => {},
  goToStep: () => {},
  firstTime: true,
};
