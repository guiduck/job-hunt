/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import { AutoComplete } from ".";

export default {
  title: "AutoComplete",
  component: AutoComplete,
} as ComponentMeta<typeof AutoComplete>;

const Template: ComponentStory<typeof AutoComplete> = (args) => (
  <AutoComplete {...args} />
);

export const AutoCompleteDefaultProps = Template.bind({});
AutoCompleteDefaultProps.args = {
  onLoadSuggestions: () =>
    new Promise((resolve) => {
      resolve(["americanas", "casas bahia"]);
    }),
};
