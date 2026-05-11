import React from "react";
import * as S from "../styled";
import { Button } from "../../Button";

interface StartStepProps {
  onClick: () => void;
  firstTime: boolean;
  goToStep: () => void;
}

export const StartStep = ({ onClick, firstTime, goToStep }: StartStepProps) => {
  return (
    <S.Wrapper>
      <S.PiggyGif>
        <S.PigHolder
          alt="piggy-gif"
          src="https://media.cuponeria.com.br/cuponeria4/imagens/ilustracoes/extensao/porquinho-detetive-extensao.gif"
        />
      </S.PiggyGif>
      <S.Title>Como funciona?</S.Title>
      <S.Description>Faça uma tour guiada pela extensão :)</S.Description>
      <S.ButtonWrapper>
        <Button label="começar" onClick={goToStep} />
      </S.ButtonWrapper>
      {!firstTime && (
        <S.AncorButton onClick={onClick}>pular tour</S.AncorButton>
      )}
    </S.Wrapper>
  );
};

export default StartStep;
