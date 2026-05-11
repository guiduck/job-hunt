/* istanbul ignore file */

import styled, { css, keyframes } from "styled-components";
import { Wrapper as StoreHeaderWrapper } from "../StoreHeader/styled";
import { StoreIconContainer } from "../CardCoupon/styled";

export const Container = styled.div<{ firstTimeOpeningExtension: boolean }>`
  position: relative;
  height: fit-content;
  background-color: #fafafa;
  height: 100vh;
  max-height: calc(100vh - 130px);
  ${({ firstTimeOpeningExtension }) =>
    firstTimeOpeningExtension &&
    `
    border-radius: 0px 0px 10px 10px;
  `}
`;

export const Wrapper = styled.div`
  > * {
    z-index: 10;
  }

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  ${({ theme: { type } }) =>
    type !== "overlap" &&
    `
      width: 300px;
      margin: 0 auto;
    `}

  background: ${({ theme }) => theme?.color?.first || "#EFEFEF"};
`;

export const WrapperCircles = styled.div`
  width: 160px;
  margin: 16px auto 8px;

  justify-content: space-evenly;
  display: flex;
  flex-direction: row;
  align-items: center;

  position: absolute;
  bottom: 50px;
`;

export const PiggyGif = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  @media (max-height: 630px) {
    height: 220px;
  }
`;

export const PigHolder = styled.img`
  height: ${({ theme: { currentStep } }) =>
    currentStep === 1 ? "130px" : "200px"};
`;

export const Title = styled.h1`
  text-align: center;
  font: normal normal bold 30px/28px Roboto;
  letter-spacing: 0px;
  color: #000000b3;
  margin-top: 0;
`;

export const Description = styled.p`
  text-align: center;
  font: normal normal normal 22px/24px Roboto;
  letter-spacing: 0px;
  color: #000000b3;
`;

export const EndTutorialDescription = styled.p`
  text-align: center;
  font: normal normal normal 20px/24px Roboto;
  letter-spacing: 0px;
  color: #000000b3;

  margin-top: 4px;
`;

export const ButtonWrapper = styled.div`
  ${({ theme: { currentStep } }) =>
    (currentStep === 0 || currentStep === 3) &&
    `
      margin: 0 0 34px 0;
    `}
  padding-top: 0;
  display: flex;

  position: absolute;
  bottom: 0;

  > div > div {
    cursor: pointer;
  }
  > div {
    min-width: 300px;
    text-align: center;
  }
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

export const UpperSection = styled.div`
  z-index: ${({ theme: { currentStep } }) => (currentStep === 1 ? 1 : 0)};
  ${({ theme: { currentStep } }) =>
    currentStep === 1
      ? ""
      : css`
          @media (max-height: 630px) {
            svg {
              height: 120px;
            }
          }
        `}

  background-color: #fafafa;
  padding: 0;

  display: block;
  justify-content: center;
  width: 100%;

  position: relative;
  ${StoreHeaderWrapper} {
    padding-bottom: 24px;
  }
`;

export const CouponsWrapper = styled.div`
  z-index: ${({ theme: { currentStep } }) => (currentStep === 2 ? 1 : 0)};

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-self: center;
  width: fit-content;

  position: relative;

  > svg {
    border-radius: 15px;
    width: fit-content;
  }
`;

export const CouponContainer = styled.div<{
  zIndex: number;
  maxHeight?: string;
}>`
  overflow: hidden;
  padding-inline: 16px;
  max-height: ${({ maxHeight }) => maxHeight || "260px"};
  margin-bottom: 20px;
  z-index: ${({ zIndex }) => zIndex};

  ${StoreIconContainer} {
    margin-bottom: 0;
  }
`;

export const AncorButton = styled.p`
  /* width: 300px; */
  text-align: center;
  text-decoration: underline;
  font: normal normal bold 12px/36px Roboto;
  letter-spacing: 0px;
  text-transform: lowercase;
  cursor: pointer;
  position: absolute;
  bottom: -50px;

  ${({ theme: { firstTimeOpeningExtension } }) =>
    firstTimeOpeningExtension ? "display: none;" : ""}

  color: #fff;
`;

export const Ballon = styled.div`
  position: absolute;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 240px;
  min-height: 100px;
  padding: 8px;
  background-color: #efefef;

  @media (max-height: 620px) {
    max-height: 90px;
    min-height: 60px;
  }
  ${({ theme: { currentStep } }) => {
    if (currentStep === 1)
      return css`
        bottom: -63%;
        right: 16px;
        @media (max-height: 620px) {
          bottom: -51%;
        }
      `;
    return css`
      right: 16px;
      top: -58%;
    `;
  }}

  :after {
    content: "";
    position: absolute;
    left: 50%;
    width: 0;
    height: 0;

    ${({ theme: { currentStep } }) => {
      if (currentStep === 1)
        return css`
          bottom: 100%;
          border-left: 15px solid transparent;
          border-right: 15px solid transparent;
          border-bottom: 15px solid #efefef;
        `;
      return css`
        top: 100%;
        border-left: 15px solid transparent;
        border-right: 15px solid transparent;
        border-top: 15px solid #efefef;
      `;
    }}
  }
`;

export const BallonTitle = styled.h1`
  margin: 0;
  text-align: center;
  font: normal normal bold 18px/36px Roboto;
  letter-spacing: 0px;
  color: #000000b3;
`;

export const BallonDescription = styled.p`
  margin: 0;
  text-align: center;
  font: normal normal normal 14px/16px Roboto;
  letter-spacing: 0px;
  color: #000000b3;
`;

export const AnimationContainer = styled.div`
  width: 100%;
  max-height: 223px;
  height: 223px;
  overflow: hidden;
`;

export const LoadingStep = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
`;

const SliderAnimation = keyframes`
  0% {width: 0}
  100% {width: 100%}
`;

export const SliderContainer = styled.div`
  width: calc(100% - 120px);
  height: 12px;
  margin-inline: 60px;
  background-color: rgb(215 215 215);
  border-radius: 6px;
`;

export const Slider = styled.div`
  width: 100%;
  height: 100%;
  display: block;
  animation-name: ${SliderAnimation};
  animation-duration: 2s;
  animation-iteration-count: infinite;
  background: #f91e96;
  border-radius: 6px;
  left: 0;
  align-self: flex-start;
  margin-bottom: 30px;
`;

export const LoadingStepText = styled.p`
  width: 100%;
  display: block;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
`;
