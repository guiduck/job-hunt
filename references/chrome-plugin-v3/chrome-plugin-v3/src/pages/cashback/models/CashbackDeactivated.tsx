import React from "react";
import { useSearchParams } from "react-router-dom";
import { DefaultProps } from "../../..";
import { Button } from "../../../components/Button";
import { CashbackIcon } from "../../../components/Icons";
import { PigAlertWithMagnify } from "../../../components/Images";
import { redirectToStore } from "../../../services/userService";
import * as S from "./styled";

const CashbackDeactivated: React.FC<DefaultProps> = () => {
  const [searchParams] = useSearchParams();
  const cashbackRate = searchParams.get("cashbackRate");
  const slug = searchParams.get("slug");

  return (
    <S.Wrapper>
      <S.PigImageWrapper data-testid="pigImage">
        <PigAlertWithMagnify />
      </S.PigImageWrapper>
      <S.Title>Seu cashback foi desativado</S.Title>
      <S.SubTitle>Reative para garantir seu benefício</S.SubTitle>
      <Button
        icon={<CashbackIcon color="#ffffff" />}
        label={`ativar ${cashbackRate} de cashback`}
        width="281px"
        onClick={
          /* istanbul ignore next */
          () => {
            if (slug) {
              redirectToStore(slug, true);
            }
          }
        }
      />
    </S.Wrapper>
  );
};

export default CashbackDeactivated;
