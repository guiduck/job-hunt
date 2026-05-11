import React, { useEffect, useState } from "react";
import * as S from "../styled";
import { StoreHeader } from "../../StoreHeader";
import { CardCoupon } from "../../CardCoupon";
import mockedOffer from "../../../mocks/offerMock";
import getBadges from "../../../utils/offerHelper";
import Circles from "../Circles";
import { Button } from "../../Button";

interface ActivateCashbackStepProps {
  goToStep: (page: number) => void;
  theme: "elo" | "cuponeria" | undefined;
  navigateTo: () => void;
}

export const ActivateCashbackStep = ({
  goToStep,
  theme,
  navigateTo,
}: ActivateCashbackStepProps) => {
  const [animationStep, setAnimationStep] = useState(0);

  const stepsToAnimate: JSX.Element[] = [
    <StoreHeader
      key={1}
      image={theme !== "elo" ? "/logo.png" : "logo-alt.png"}
      title={theme !== "elo" ? "Cuponeria" : "Elo"}
      isDiscount={false}
      cashbackIsActive={false}
      cashbackValue="8%"
      oldCashbackValue="2%"
      disabled
    />,
    <S.LoadingStep key={2}>
      <S.PiggyGif>
        <S.PigHolder src="https://media.cuponeria.com.br/cuponeria4/imagens/ilustracoes/extensao/porquinho-cofre-extensao.gif" />
      </S.PiggyGif>
      <S.SliderContainer>
        <S.Slider />
      </S.SliderContainer>
      <S.LoadingStepText>ativando cashback, aguarde! 😊</S.LoadingStepText>
    </S.LoadingStep>,
    <StoreHeader
      key={3}
      image={theme !== "elo" ? "/logo.png" : "logo-alt.png"}
      title={theme !== "elo" ? "Cuponeria" : "Elo"}
      isDiscount={false}
      cashbackIsActive
      cashbackValue="8%"
      oldCashbackValue="2%"
      disabled
    />,
  ];

  const play = () => {
    setTimeout(() => {
      if (animationStep < stepsToAnimate.length - 1) {
        setAnimationStep(animationStep + 1);
      } else {
        setAnimationStep(0);
      }
    }, 2000);
  };

  useEffect(() => {
    play();
  }, [animationStep]);

  return (
    <S.Wrapper>
      <S.UpperSection>
        <S.AnimationContainer data-testId="animation-container">
          {stepsToAnimate[animationStep]}
        </S.AnimationContainer>
        <S.Ballon>
          <S.BallonTitle>Ativando seu cashback</S.BallonTitle>
          <S.BallonDescription>
            Clique no botão, <b>faça login na sua conta Cuponeria</b> e seu
            cashback será ativado automaticamente antes de todas as compras.
          </S.BallonDescription>
        </S.Ballon>
      </S.UpperSection>
      <S.CouponsWrapper>
        <S.CouponContainer maxHeight="195px" zIndex={0}>
          <CardCoupon
            // eslint-disable-next-line react/no-array-index-key
            key="card-cupon-tutorial"
            isItOffer={mockedOffer.display_type === "offer_online"}
            code={mockedOffer.coupon_code}
            couponDescription={mockedOffer.title}
            badges={getBadges(mockedOffer)}
            rulesText={mockedOffer.obs}
          />
        </S.CouponContainer>
        <S.CouponContainer maxHeight="60px" zIndex={0}>
          <CardCoupon
            // eslint-disable-next-line react/no-array-index-key
            key="card-cupon-tutorial"
            isItOffer={mockedOffer.display_type === "offer_online"}
            code={mockedOffer.coupon_code}
            couponDescription={mockedOffer.title}
            badges={getBadges(mockedOffer)}
            rulesText={mockedOffer.obs}
          />
        </S.CouponContainer>
      </S.CouponsWrapper>
      <Circles
        currentStep={1}
        numberOfPages={3}
        goToStep={(step: number) => goToStep(step)}
      />
      <S.ButtonWrapper>
        <Button
          label="próximo"
          background={theme === "elo" ? "#00A4E0" : "#fff"}
          color={theme === "elo" ? "#fff" : "#000"}
          padding="10px 16px"
          onClick={() => goToStep(2)}
        />
      </S.ButtonWrapper>
      <S.AncorButton onClick={navigateTo}>pular tour</S.AncorButton>
    </S.Wrapper>
  );
};

export default ActivateCashbackStep;
