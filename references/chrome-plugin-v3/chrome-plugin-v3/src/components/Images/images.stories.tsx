/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { storiesOf } from "@storybook/react";

import {
  PigAlertWithMagnify,
  PigHappyWithSafe,
  ActiveCashbackGif,
  CouponGif,
  Logo,
} from ".";
import LogoToGoogle from "./svg/LogoToGoogle";

const stories = storiesOf("Components/Images", module);

stories.add("PigAlertWithMagnify", () => <PigAlertWithMagnify />);
stories.add("PigHappyWithSafe", () => <PigHappyWithSafe />);
stories.add("ActiveCashbackGif", () => <ActiveCashbackGif />);
stories.add("CouponGif", () => <CouponGif />);
stories.add("Logo", () => <Logo color="#FF0000" />);
stories.add("LogoToGoogle", () => <LogoToGoogle />);
