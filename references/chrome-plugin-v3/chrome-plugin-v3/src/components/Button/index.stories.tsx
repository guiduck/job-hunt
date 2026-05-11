/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import { Button } from ".";
import { CashbackIcon } from "../Icons";

export default {
  title: "Components/Button",
  component: Button,
} as ComponentMeta<typeof Button>;

const Template: ComponentStory<typeof Button> = (args) => <Button {...args} />;

export const LabelOnly = Template.bind({});
LabelOnly.args = {
  label: "começar",
  background: "linear-gradient(90deg, #24C92B 0%, #099F0F 100%)",
};

export const IconAndLabel = Template.bind({});
IconAndLabel.args = {
  label: "ativar 8% de cashback",
  background: "linear-gradient(90deg, #24C92B 0%, #099F0F 100%)",
  icon: <CashbackIcon color="#ffffff" />,
};
