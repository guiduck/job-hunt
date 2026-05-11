/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import { NavigationCircles } from ".";

export default {
  title: "Components/NavigationCircles",
  component: NavigationCircles,
} as ComponentMeta<typeof NavigationCircles>;

const Template: ComponentStory<typeof NavigationCircles> = (args) => (
  <NavigationCircles {...args} />
);

export const FirstPageWithClickedActive = Template.bind({});
FirstPageWithClickedActive.args = {
  isItClicked: true,
  currentStep: 1,
};

export const ThirdPageWithClickedActive = Template.bind({});
ThirdPageWithClickedActive.args = {
  isItClicked: true,
  currentStep: 3,
};

export const ThirdPageWithClickedNotActive = Template.bind({});
ThirdPageWithClickedNotActive.args = {
  isItClicked: false,
  currentStep: 3,
};
