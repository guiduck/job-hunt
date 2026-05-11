import React, { useEffect, useState } from "react";
import * as S from "../styled";
import { StoreHeader } from "../../StoreHeader";
import { CardCoupon } from "../../CardCoupon";
import mockedOffer from "../../../mocks/offerMock";
import getBadges from "../../../utils/offerHelper";
import Circles from "../Circles";
import { Button } from "../../Button";
import { ActiveCashbackGif } from "../../Images";

interface UsingCouponStepProps {
  goToStep: (page: number) => void;
  theme: "elo" | "cuponeria" | undefined;
  navigateTo: () => void;
}

export const UsingCouponStep = ({
  goToStep,
  theme,
  navigateTo,
}: UsingCouponStepProps) => {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    setHeight(window.innerHeight);
  }, []);

  return (
    <S.Wrapper>
      <S.UpperSection>
        {height > 620 ? (
          <StoreHeader
            image={theme !== "elo" ? "/logo.png" : "logo-alt.png"}
            title={theme !== "elo" ? "Cuponeria" : "Elo"}
            isDiscount={false}
            cashbackIsActive={false}
            cashbackValue="8%"
            oldCashbackValue="2%"
            disabled
          />
        ) : (
          <ActiveCashbackGif />
        )}
      </S.UpperSection>
      <S.CouponsWrapper>
        <S.CouponContainer maxHeight="195px" zIndex={1}>
          <CardCoupon
            // eslint-disable-next-line react/no-array-index-key
            key="card-cupon-tutorial"
            isItOffer={
              mockedOffer.renderType.toLocaleUpperCase() === "OFFER_ONLINE"
            }
            code={mockedOffer.code}
            couponDescription={mockedOffer.title}
            badges={getBadges(mockedOffer)}
            rulesText={mockedOffer.rules}
            disabled
          />
        </S.CouponContainer>
        <S.Ballon>
          <S.BallonTitle>Cupons de desconto</S.BallonTitle>
          <S.BallonDescription>
            Veja todos os cupons disponíveis da loja. É só copiar o código e
            inserir antes de finalizar a compra.
          </S.BallonDescription>
        </S.Ballon>
      </S.CouponsWrapper>
      <S.CouponContainer maxHeight="60px" zIndex={0}>
        <CardCoupon
          // eslint-disable-next-line react/no-array-index-key
          key="card-cupon-tutorial"
          isItOffer={
            mockedOffer.renderType.toLocaleUpperCase() === "OFFER_ONLINE"
          }
          code={mockedOffer.code}
          couponDescription={mockedOffer.title}
          badges={getBadges(mockedOffer)}
          rulesText={mockedOffer.rules}
          disabled
        />
      </S.CouponContainer>
      <Circles
        currentStep={2}
        numberOfPages={3}
        goToStep={(step: number) => goToStep(step)}
      />
      <S.ButtonWrapper>
        <Button
          label="próximo"
          background={theme === "elo" ? "#00A4E0" : "#fff"}
          color={theme === "elo" ? "#fff" : "#000"}
          padding="10px 16px"
          onClick={() => goToStep(3)}
        />
      </S.ButtonWrapper>
      <S.AncorButton onClick={navigateTo}>pular tour</S.AncorButton>
    </S.Wrapper>
  );
};

export default UsingCouponStep;
