import React from "react";
import styled, { keyframes } from "styled-components";
import { Icon } from "..";

const RotateKeyframes = keyframes`
  100% { transform: rotate(360deg); }
`;

const DashKeyframes = keyframes`
  0% { stroke-dasharray: 1, 50; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 40, 50; stroke-dashoffset: -15px; }
  100% { stroke-dasharray: 40, 50; stroke-dashoffset: -50px; }
`;

const ColorKeyframes = keyframes`
  0% { stroke: #ff0000; }
  33% { stroke: #f91e96; }
  66% { stroke: #fad424; }
  100% { stroke: #ff0000; }
`;

const LoaderSVG = styled.svg`
  width: ${(props) => props.width};
  height: ${(props) => props.height};
  animation: ${RotateKeyframes} 2s linear infinite;
`;

const CircleSVG = styled.circle`
  animation: ${DashKeyframes} 1.5s ease-in-out infinite,
    ${(props) => (props.stroke === "red" ? ColorKeyframes : null)} 4s linear
      infinite;
  stroke-width: 2;
`;

const LoaderIcon = ({ color = "#fff", size = 29, onClick }: Icon) => {
  return (
    <LoaderSVG
      xmlns="https://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      onClick={onClick}
    >
      <path fill="none" d="M0,0 h24v24h-24v-24" />
      <CircleSVG
        cx="12"
        cy="12"
        r="8"
        stroke={color}
        fill="none"
        strokeLinecap="round"
      />
    </LoaderSVG>
  );
};

export default LoaderIcon;
