/* istanbul ignore file */

import styled from "styled-components";

export const Container = styled.div<{ firstTimeOpeningExtension: boolean }>`
  position: relative;
  height: fit-content;
  background-color: #fafafa;
  height: 100vh;
  max-height: calc(100vh - 130px);
  ${({ firstTimeOpeningExtension }) =>
    firstTimeOpeningExtension &&
    `
    border-radius: 0;
  `}
`;

export const DarkWrapper = styled.div`
  z-index: 1;
  position: absolute;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 10px;
  inset: -50.5px 0px -50.5px 0px;

  ${({ theme: { currentStep } }) =>
    (currentStep < 1 || currentStep > 2) &&
    `
    display: none;
  `}
`;

export const ContentWrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow-y: hidden;
`;
