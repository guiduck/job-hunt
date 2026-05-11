import React from "react";
import { NavigationCircles } from "../../NavigationCircles";
import * as S from "../styled";

interface CirclesProps {
  currentStep: number;
  goToStep: (page: number) => void;
  numberOfPages: number;
}

export const Circles = ({
  currentStep,
  goToStep,
  numberOfPages,
}: CirclesProps) => {
  const arrayList: JSX.Element[] = [];
  /* istanbul ignore next */
  const pagesNumberList = [...Array(numberOfPages).map((i) => i)];
  let counterKey = 0;

  pagesNumberList.forEach((element, index) => {
    counterKey = index;

    arrayList.push(
      <NavigationCircles
        key={counterKey}
        id={index}
        currentStep={currentStep}
        isItClicked={currentStep - 1 === index}
        onClick={() => {
          if (index !== currentStep - 1) goToStep(index + 1);
        }}
      />
    );
  });

  return <S.WrapperCircles>{arrayList}</S.WrapperCircles>;
};

export default Circles;
