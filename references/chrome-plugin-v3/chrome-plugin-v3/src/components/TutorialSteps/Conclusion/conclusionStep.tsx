import React from "react";
import * as S from "../styled";
import Circles from "../Circles";
import { Button } from "../../Button";

interface ConclusionStepProps {
  goToStep: (page: number) => void;
  navigateTo: () => void;
}

export const ConclusionStep = ({
  goToStep,
  navigateTo,
}: ConclusionStepProps) => {
  return (
    <S.Wrapper>
      <S.PiggyGif>
        <S.PigHolder
          alt="piggy-gif"
          src="https://media.cuponeria.com.br/cuponeria4/imagens/ilustracoes/extensao/porquinho-cofre-extensao.gif"
        />
      </S.PiggyGif>
      <S.EndTutorialDescription>
        Após a conclusão da sua compra, seu cashback entrará na sua carteira
        Cuponeria em até 7 dias
      </S.EndTutorialDescription>
      <Circles
        currentStep={3}
        numberOfPages={3}
        goToStep={(step: number) => goToStep(step)}
      />
      <S.ButtonWrapper>
        <Button label="começar" onClick={navigateTo} />
      </S.ButtonWrapper>
    </S.Wrapper>
  );
};

export default ConclusionStep;
