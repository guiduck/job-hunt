import React from "react";
import { DefaultProps } from "../..";
import Tutorial from "../tutorial";

const FirstScreenAfterInstall: React.FC<DefaultProps> = () => {
  return <Tutorial firstTimeOpeningExtension />;
};

export default FirstScreenAfterInstall;
