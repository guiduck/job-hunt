import React from "react";
import { useParams } from "react-router-dom";
import { DefaultProps } from "../../..";
import CashbackActivated from "../models/CashbackActivated";
import CashbackDeactivated from "../models/CashbackDeactivated";
import CashbackNotActivated from "../models/CashbackNotActivated";
import CashbackProcessing from "../models/CashbackProcessing";

const Status: React.FC<DefaultProps> = () => {
  const { id } = useParams();

  switch (id) {
    case "activated":
      return <CashbackActivated />;

    case "deactivated":
      return <CashbackDeactivated />;

    case "notActivated":
      return <CashbackNotActivated />;

    case "processing":
      return <CashbackProcessing />;

    /* istanbul ignore next */
    default:
      return <div />;
  }
};

export default Status;
