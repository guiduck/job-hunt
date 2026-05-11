import React from "react";
import { DefaultProps } from "../../..";
import { Button } from "../../../components/Button";
import { PigHappyWithSafe } from "../../../components/Images";
import * as S from "./styled";

const CashbackProcessing: React.FC<DefaultProps> = () => {
  return (
    <S.Wrapper>
      <S.PigImageWrapper data-testid="pigImage">
        <PigHappyWithSafe height="200px" width="200px" />
      </S.PigImageWrapper>
      <S.Title>Estamos analisando seu cashback!</S.Title>
      <S.SubTitle>
        Em breve, você receberá um email e o valor estará no seu extrato.
      </S.SubTitle>
      <Button label="continuar comprando" width="281px" />
    </S.Wrapper>
  );
};

export default CashbackProcessing;
