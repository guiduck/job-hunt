import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { DefaultProps } from "../..";

import * as S from "./styled";
import { ThemeContext } from "../../context/ThemeContext";
import getSlugFromParams from "../../utils/getSlugFromParams";
import StartStep from "../../components/TutorialSteps/Start";
import ActivateCashbackStep from "../../components/TutorialSteps/ActivateCashback";
import UsingCouponStep from "../../components/TutorialSteps/UsingCoupon";
import ConclusionStep from "../../components/TutorialSteps/Conclusion/conclusionStep";

export interface TutorialProps {
  firstTimeOpeningExtension?: boolean;
}

const Tutorial: React.FC<TutorialProps & DefaultProps> = ({
  firstTimeOpeningExtension = false,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigateTo = useNavigate();

  const slug = getSlugFromParams();
  const afterTutorial = slug ? `/?slug=${slug}` : "/";

  const { theme } = useContext(ThemeContext);

  const goToStep = (page: number) => {
    setCurrentStep(page);
  };

  const tutorialSteps: JSX.Element[] = [
    <StartStep
      onClick={() => navigateTo(afterTutorial)}
      goToStep={() => goToStep(1)}
      firstTime={firstTimeOpeningExtension}
    />,
    <ActivateCashbackStep
      navigateTo={() => navigateTo(afterTutorial)}
      goToStep={(step) => goToStep(step)}
      theme={theme}
    />,
    <UsingCouponStep
      navigateTo={() => navigateTo(afterTutorial)}
      goToStep={(step) => goToStep(step)}
      theme={theme}
    />,
    <ConclusionStep
      navigateTo={() => navigateTo(afterTutorial)}
      goToStep={(step) => goToStep(step)}
    />,
  ];

  return (
    <S.Container firstTimeOpeningExtension={firstTimeOpeningExtension}>
      <ThemeProvider
        theme={{
          currentStep,
          firstTimeOpeningExtension,
          type: currentStep > 0 && currentStep < 3 ? "overlap" : "",
        }}
      >
        <S.DarkWrapper />
        <S.ContentWrapper>{tutorialSteps[currentStep]}</S.ContentWrapper>
      </ThemeProvider>
    </S.Container>
  );
};

export default Tutorial;
