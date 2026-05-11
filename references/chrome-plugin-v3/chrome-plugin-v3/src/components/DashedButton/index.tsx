import React from "react";
import * as S from "./styled";

export interface DashedButtonProps {
  isItOffer?: boolean;
  label?: string;
  active?: boolean;
  icon?: JSX.Element;
}

export const DashedButton: React.FC<DashedButtonProps> = ({
  isItOffer,
  label,
  active,
  icon,
}: DashedButtonProps) => {
  return (
    <S.Wrapper
      active={active}
      isItOffer={isItOffer}
      data-testid="card-coupon-button"
    >
      <S.Label isItOffer={isItOffer}>{label}</S.Label>
      {icon && <S.Icon data-testid="card-coupon-svg">{icon}</S.Icon>}
    </S.Wrapper>
  );
};
