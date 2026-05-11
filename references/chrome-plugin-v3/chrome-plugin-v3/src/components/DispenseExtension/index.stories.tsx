/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DispenseExtension from ".";

export default {
  title: "Components/DispenseExtension",
  component: DispenseExtension,
} as ComponentMeta<typeof DispenseExtension>;

const Template: ComponentStory<typeof DispenseExtension> = ((args) => (
  <MemoryRouter initialEntries={[`/`]}>
    <Routes>
      <Route path="/" element={<DispenseExtension {...args} />} />
    </Routes>
  </MemoryRouter>
)) as ComponentStory<typeof DispenseExtension>;

export const DispenseExtensionDefault = Template.bind({});
