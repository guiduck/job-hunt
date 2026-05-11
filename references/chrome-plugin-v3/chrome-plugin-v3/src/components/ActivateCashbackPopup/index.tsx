import React from "react";
import { Button } from "../Button";
import { Header } from "../Header";
import { CashbackIcon } from "../Icons";
import { Logo, PigHappyWithSafe } from "../Images";
import * as S from "./styled";
import LogoElo from "../Images/svg/LogoElo";

interface Props {
  isAlternativeLogo: boolean;
  storeName: string;
  cashbackRate: string;
  oldCashbackRate?: string;
  cashbackValueTypeRate: "F" | "P";
  onClick?: () => void;
}

const renderCashbackRate = (cashbackValue: string, rateType: string) => {
  const cashback = cashbackValue.replace(".", ",");
  const value = rateType === "P" ? `${cashback}%` : `R$ ${cashback}`;

  return <S.CashbackText>{value} de cashback</S.CashbackText>;
};

const renderOldCashback = (cashbackValue: string, rateType: string) => {
  if (!cashbackValue) return undefined;

  const cashback = cashbackValue.replace(".", ",");
  const value = rateType === "P" ? `${cashback}%` : `R$ ${cashback}`;

  return <S.CashbackTextStrike>(era {value})</S.CashbackTextStrike>;
};

export const ActivateCashbackPopup: React.FC<Props> = ({
  isAlternativeLogo = false,
  storeName = "Americanas",
  cashbackRate = "1",
  oldCashbackRate = "",
  cashbackValueTypeRate = "P",
  onClick,
}) => {
  return (
    <S.Wrapper>
      <S.Content>
        <Header
          hasSettings
          logo={isAlternativeLogo ? LogoElo : Logo}
          logoColor="#ff0000"
        />
        <S.Image data-testid="pigImage">
          <PigHappyWithSafe />
        </S.Image>
        <S.TextWrapper>
          {renderCashbackRate(cashbackRate, cashbackValueTypeRate)} em
          <br /> {storeName}{" "}
          {renderOldCashback(oldCashbackRate, cashbackValueTypeRate)}
        </S.TextWrapper>
        <Button
          icon={<CashbackIcon color="#ffffff" />}
          label="ativar cashback"
          padding="10px 10px 0 10px"
          onClick={/* istanbul ignore next */ () => onClick?.()}
        />
      </S.Content>
    </S.Wrapper>
  );
};

export default ActivateCashbackPopup;
