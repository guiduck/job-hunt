/* istanbul ignore file */

import styled from "styled-components";

export const Wrapper = styled.div`
  width: 360px; // default width
  max-height: 620px; // default height
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

export const WrapBar = styled.div<{ height?: string }>`
  width: 100%;
  height: ${({ height }) => height};
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
`;

export const Content = styled.div`
  flex: auto;
  overflow-y: auto;
`;

export const Footer = styled.div`
  width: 100%;
  height: 55px;
  color: white;
  background: blue;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
`;
