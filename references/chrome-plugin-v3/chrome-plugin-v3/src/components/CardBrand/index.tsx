import React from "react";
import * as S from "./styled";

export interface CardProps {
  image?: string;
  title?: string;
  titleColor?: string;
  cashbackValue?: string | number;
  cashbackValueTypeRate?: "P" | "F";
  cashbackColor?: string;
  qtdCoupon?: number;
  qtdCouponColor?: string;
  isMiniature?: boolean;
  onClick?: () => void;
}

export const CardBrand: React.FC<CardProps> = ({
  image = "https://media.cuponeria.com.br/store/americanas-com/logo/89b2f817-americanas-com-72x72.jpeg",
  title = "Título",
  titleColor = "#000000B3",
  cashbackValue = undefined,
  cashbackValueTypeRate = "P",
  cashbackColor = "#4CAF50",
  qtdCoupon = 1,
  qtdCouponColor = "#000000B3",
  isMiniature = false,
  onClick = undefined,
}: CardProps) => {
  let cardProperties = {
    contentWidth: "160px",
    contentHeight: "200px",
    imageWidthAndHeight: "80px",
    fontTextCashback: "normal normal bold 18px/15px Roboto",
    fontTextCouponQtd: "normal normal normal 16px/24px Roboto",
  };

  if (isMiniature) {
    cardProperties = {
      contentWidth: "98px",
      contentHeight: "113px",
      imageWidthAndHeight: "50px",
      fontTextCashback: "normal normal bold 18px/12px Roboto",
      fontTextCouponQtd: "normal normal normal 12px/18px Roboto",
    };
  }

  const renderTitle = () => {
    if (isMiniature) {
      return "";
    }
    return <S.Title color={titleColor}>{title}</S.Title>;
  };

  const renderTextCashback = () => {
    if (parseFloat((cashbackValue as string) || "0") <= 0) {
      return undefined;
    }

    let subText: JSX.Element | string = " de cashback";

    if (isMiniature) {
      subText = (
        <span>
          <br /> de cashback
        </span>
      );
    }

    // faster done with a template
    const cashback = `${cashbackValue}`.replace(".", ",");
    let value = `${cashback}%`;

    if (cashbackValueTypeRate === "F") {
      value = `R$ ${cashback}`;
    }

    return (
      <S.TextCashback
        data-testid="textCashback"
        font={cardProperties.fontTextCashback}
      >
        {value}
        {subText}
      </S.TextCashback>
    );
  };

  const renderCouponQtd = () => {
    let textCouponQtd = `+ ${qtdCoupon} cupons`;
    if (qtdCoupon === 1) {
      textCouponQtd = `+ ${qtdCoupon} cupom`;
    }
    if (qtdCoupon === 0) {
      textCouponQtd = "";
    }
    return (
      <S.TextCoupon
        color={qtdCouponColor}
        font={cardProperties.fontTextCouponQtd}
        data-testid="textCoupon"
      >
        {textCouponQtd}
      </S.TextCoupon>
    );
  };

  return (
    <S.Wrapper>
      <S.Content
        width={cardProperties.contentWidth}
        height={cardProperties.contentHeight}
        onClick={onClick}
      >
        <S.Image
          isMiniature={isMiniature}
          width={cardProperties.imageWidthAndHeight}
          height={cardProperties.imageWidthAndHeight}
          src={image}
          title={title}
          alt={title}
          data-testid="image"
        />
        {renderTitle()}
        {renderTextCashback()}
        {renderCouponQtd()}
      </S.Content>
    </S.Wrapper>
  );
};
