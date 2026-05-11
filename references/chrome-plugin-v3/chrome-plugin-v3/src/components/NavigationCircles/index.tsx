import React from "react";
import * as S from "./styled";

export interface NavigationCirclesProps {
  isItClicked: boolean;
  currentStep: number;
  id: number;
  onClick?: () => void;
}

export const NavigationCircles: React.FC<NavigationCirclesProps> = ({
  isItClicked,
  currentStep,
  id,
  onClick,
}: NavigationCirclesProps) => {
  return (
    <S.Circle
      isItClicked={isItClicked}
      className={`${id}-cls-`}
      currentStep={currentStep}
      onClick={onClick}
      data-testid="circle-navigation-indicator"
    />
  );
};
