import styled from "styled-components";
import { DashedButtonProps } from ".";

export const Wrapper = styled.div<DashedButtonProps>`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  position: relative;

  width: 100%;
  box-sizing: border-box;
  padding: 3px 0px;

  background-color: #fff;

  box-shadow: 0px 3px 6px #00000029;

  border: ${({ theme, active }) =>
    !active
      ? "2px dashed #4c4c4c"
      : `2px dashed ${theme.dashedButton?.border || "#4caf50"}`};

  ${(props) =>
    props.isItOffer &&
    `
    border: 1px solid #4C4C4C;
  `}

  border-radius: 18px;
`;

export const Label = styled.span<DashedButtonProps>`
  text-align: center;

  font: normal normal bold 14px/26px Roboto;
  color: #000000b3;

  letter-spacing: 0px;
  text-transform: ${(props) => (props.isItOffer ? "lowercase" : "uppercase")};
`;

export const Icon = styled.div`
  display: flex;
  align-items: center;

  position: absolute;
  right: 10px;
`;
