import styled from "styled-components";
import { ButtonProps } from ".";

export const Wrapper = styled.div<ButtonProps>`
  padding: ${({ padding }) => `${padding}`};
  width: ${({ width }) => width};
  max-width: 360px;
`;

export const Content = styled.div<ButtonProps>`
  background: ${({ theme: { button }, background }) =>
    background || button?.background};
  border-radius: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  max-height: 40px;
`;

export const Icon = styled.div<ButtonProps>`
  color: ${({ color }) => color};
  margin: 0 5px;
  display: flex;
  justify-content: center;
`;

export const Label = styled.div<ButtonProps>`
  color: ${({ color }) => color};
  font-weight: bold;
  font-size: 16px;
  line-height: 40px;
  user-select: none;
`;
