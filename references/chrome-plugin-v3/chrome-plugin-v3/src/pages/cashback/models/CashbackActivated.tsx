import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DefaultProps } from "../../..";
import { Button } from "../../../components/Button";
import { PigHappyWithSafe } from "../../../components/Images";
import * as S from "./styled";

const CashbackActivated: React.FC<DefaultProps> = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const slug = searchParams.get("slug");
  const cashbackRate = searchParams.get("cashbackRate");
  const cashbackValueTypeRate = searchParams.get("cashbackValueTypeRate") as
    | "P"
    | "F";

  let cashback = `${cashbackRate}%`;

  /* istanbul ignore next */
  if (cashbackValueTypeRate === "F") {
    cashback = `R$ ${cashbackRate}`;
  }

  /* istanbul ignore next */
  const onContinue = () => {
    navigate(`/store/${slug}`);
  };

  return (
    <S.Wrapper>
      <S.PigImageWrapper data-testid="pigImage">
        <PigHappyWithSafe height="200px" width="200px" />
      </S.PigImageWrapper>
      <S.Title>{cashback} de cashback ativado!</S.Title>
      <S.SubTitle>
        <b>Prepare seu carrinho novamente e finalize sua compra nesta aba! </b>
        😉
      </S.SubTitle>
      <Button label="continuar" width="281px" onClick={onContinue} />
    </S.Wrapper>
  );
};

export default CashbackActivated;
