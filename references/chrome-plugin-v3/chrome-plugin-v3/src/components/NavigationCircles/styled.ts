/* eslint-disable import/prefer-default-export */
import styled from "styled-components";

interface NavigationCirclesPropsStyle {
  isItClicked?: boolean;
  currentStep?: number;
}

export const Circle = styled.div<NavigationCirclesPropsStyle>`
  width: 11px;
  height: 11px;
  border-radius: 50%;

  cursor: pointer;
  background-color: ${(props) => (props.isItClicked ? "#fdb924" : "#ffffff")};

  ${(props) =>
    props.currentStep === 3 &&
    `
    background-color: ${props.isItClicked ? "#fdb924" : "#B9B9B9"};
  `}
`;
