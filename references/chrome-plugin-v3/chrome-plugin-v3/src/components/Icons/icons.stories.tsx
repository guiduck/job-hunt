/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { storiesOf } from "@storybook/react";

import CashbackIcon from "./svg/CashbackIcon";
import SettingsIcon from "./svg/SettingsIcon";
import CloseIcon from "./svg/CloseIcon";
import ArrowButtonIcon from "./svg/ArrowButtonIcon";
import MinimizeIcon from "./svg/MinimizeIcon";
import HomeIcon from "./svg/HomeIcon";
import QuestionIcon from "./svg/QuestionIcon";
import SearchIcon from "./svg/SearchIcon";
import StoreIcon from "./svg/StoreIcon";

const stories = storiesOf("Components/Icons", module);

stories.add("settings", () => <SettingsIcon color="#b9b9b9" />);
stories.add("close", () => <CloseIcon color="#b9b9b9" />);
stories.add("arrowButton", () => <ArrowButtonIcon color="rgba(0,0,0,0.5)" />);
stories.add("minimize", () => <MinimizeIcon color="#b9b9b9" />);
stories.add("cashback", () => <CashbackIcon />);
stories.add("home", () => <HomeIcon />);
stories.add("question", () => <QuestionIcon />);
stories.add("search", () => <SearchIcon />);
stories.add("store", () => <StoreIcon />);
