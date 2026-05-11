import React from "react";
import { Icon } from "..";

const MinimizeIcon = ({ color = "#b9b9b9", size = 12, onClick }: Icon) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size / 6}
      onClick={onClick}
      viewBox="0 0 12 2"
    >
      <path
        id="Caminho_32156"
        data-name="Caminho 32156"
        d="M6,19H18v2H6Z"
        transform="translate(-6 -19)"
        fill={color}
      />
    </svg>
  );
};

export default MinimizeIcon;
