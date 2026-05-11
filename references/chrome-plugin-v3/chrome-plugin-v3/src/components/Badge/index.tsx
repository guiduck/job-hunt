import React from "react";
import * as S from "./styled";

export interface BadgeProps {
  label?: string;
  hover?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ label, hover }: BadgeProps) => {
  return (
    <S.Wrapper hover={hover} data-testid="badge">
      {label}
    </S.Wrapper>
  );
};
