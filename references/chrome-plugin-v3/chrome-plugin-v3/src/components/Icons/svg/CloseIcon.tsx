import React from "react";
import { Icon } from "..";

const CloseIcon = ({ color = "#b9b9b9", size = 10, onClick }: Icon) => {
  return (
    <svg
      id="close"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      onClick={onClick}
      viewBox="0 0 10 10"
    >
      <path
        id="Shape"
        d="M10,1,9,0,5,4,1,0,0,1,4,5,0,9l1,1L5,6l4,4,1-1L6,5Z"
        fill={color}
      />
    </svg>
  );
};

export default CloseIcon;
