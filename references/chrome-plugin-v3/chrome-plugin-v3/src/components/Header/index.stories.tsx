/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Logo, LogoPlusElo } from "../Images";

import { Header } from ".";

export default {
  title: "Components/Header",
  component: Header,
} as ComponentMeta<typeof Header>;

const Template: ComponentStory<typeof Header> = ((args) => (
  <MemoryRouter initialEntries={[`/`]}>
    <Routes>
      <Route path="/" element={<Header {...args} />} />
    </Routes>
  </MemoryRouter>
)) as ComponentStory<typeof Header>;

export const HeaderDefaultProps = Template.bind({});

export const HeaderLogo = Template.bind({});
HeaderLogo.args = {
  logoColor: "#FF0000",
  logo: Logo,
};

export const HeaderButtons = Template.bind({});
HeaderButtons.args = {
  logoColor: "#FF0000",
  logo: Logo,
  hasButtons: true,
};

export const HeaderWalletButtons = Template.bind({});
HeaderWalletButtons.args = {
  logoColor: "#FF0000",
  logo: Logo,
  hasWallet: true,
  walletCredit: "0,00",
  walletText: "seus créditos",
  hasButtons: true,
};

export const HeaderEngine = Template.bind({});
HeaderEngine.args = {
  logoColor: "#FF0000",
  logo: Logo,
  hasSettings: true,
};

export const HeaderWideLogo = Template.bind({});
HeaderWideLogo.args = {
  logoColor: "#FF0000",
  logo: LogoPlusElo,
  isWideLogo: true,
  hasWallet: true,
  walletCredit: "0,00",
  walletText: "seus créditos",
  hasButtons: true,
};
