import React from "react";
import { Icon } from "..";

const ArrowButtonIcon = ({
  color = "rgba(0,0,0,0.5)",
  size = 29,
  onClick,
}: Icon) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      onClick={onClick}
      width={size}
      height={size}
      viewBox="0 0 29 28.998"
    >
      <defs>
        <filter
          id="Subtração_3"
          x="0"
          y="0"
          width={size}
          height={size}
          filterUnits="userSpaceOnUse"
        >
          <feOffset
            dy="2"
            // input="SourceAlpha"
          />
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feFlood floodOpacity="0.122" />
          <feComposite operator="in" in2="blur" />
          <feComposite in="SourceGraphic" />
        </filter>
      </defs>
      <g id="botao-circulo-seta" transform="translate(4.5 2.5)">
        <g
          transform="matrix(1, 0, 0, 1, -4.5, -2.5)"
          filter="url(#Subtração_3)"
        >
          <path
            id="Subtração_3-2"
            data-name="Subtração 3"
            d="M10,20A10,10,0,0,1,6.107.786a10,10,0,0,1,7.785,18.426A9.939,9.939,0,0,1,10,20ZM8.519,5.95l-.951.95L10.659,10,7.568,13.1l.951.951L12.569,10Z"
            transform="translate(4.5 2.5)"
            fill={color}
          />
        </g>
      </g>
    </svg>
  );
};

export default ArrowButtonIcon;
