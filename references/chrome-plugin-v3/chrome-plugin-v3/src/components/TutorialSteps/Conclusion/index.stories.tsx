/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-empty-function */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import ConclusionStep from "./conclusionStep";

export default {
  title: "Components/ConclusionStep",
  component: ConclusionStep,
} as ComponentMeta<typeof ConclusionStep>;

const Template: ComponentStory<typeof ConclusionStep> = (args) => (
  <ConclusionStep {...args} />
);

export const Default = Template.bind({});
Default.args = {
  navigateTo: () => {},
  goToStep: (step) => {},
};
