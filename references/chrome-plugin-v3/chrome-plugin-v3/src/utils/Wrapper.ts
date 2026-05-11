/* istanbul ignore file */

import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { RouteConfig } from "../pages";

const Wrapper: React.FC<RouteConfig> = (props) => {
  const location = useLocation();
  useEffect(() => {
    props.setRouteState?.(props);
  }, [location]);

  return props.element;
};

export default Wrapper;
