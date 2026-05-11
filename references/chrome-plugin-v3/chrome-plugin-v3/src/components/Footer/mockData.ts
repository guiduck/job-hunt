import React from "react";

import HomeFooterIcon from "../Icons/svg/HomeIcon";
import SearchFooterIcon from "../Icons/svg/SearchIcon";
import StoreFooterIcon from "../Icons/svg/StoreIcon";
import QuestionFooterIcon from "../Icons/svg/QuestionIcon";
import { IconsProps } from ".";

const iconsFooterDefault: IconsProps[] = [
  {
    label: "início",
    icon: HomeFooterIcon,
    path: "/",
  },
  {
    label: "buscar",
    icon: SearchFooterIcon,
    path: "/search",
  },
  {
    label: "lojas",
    icon: StoreFooterIcon,
    path: "/stores",
  },
  {
    label: "como funciona?",
    icon: QuestionFooterIcon,
    path: "/como-funciona",
  },
];

export default iconsFooterDefault;
