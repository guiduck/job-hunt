import React from "react";
import * as S from "./styled";

export interface ButtonProps {
  icon?: JSX.Element;
  label?: string;
  color?: string;
  padding?: string;
  width?: string;
  background?: string;
  onClick?: () => void;
}

/**
 * Render an icon and its parent, if needed.
 *
 * @param color The color string.
 * @param icon A JSX.Element object containing the icon.
 */
const renderIcon = (
  color: string,
  icon: JSX.Element | undefined
): JSX.Element | undefined => {
  if (!icon) return undefined;

  return (
    <S.Icon color={color} data-testid="icon">
      {icon}
    </S.Icon>
  );
};

export const Button: React.FC<ButtonProps> = ({
  icon = undefined,
  label = "Botão",
  color = "#ffffff",
  padding = "10px",
  width = "100%",
  background,
  onClick = undefined,
}: ButtonProps) => {
  return (
    <S.Wrapper padding={padding} width={width}>
      <S.Content background={background} onClick={onClick}>
        {renderIcon(color, icon)}
        <S.Label color={color}>{label}</S.Label>
      </S.Content>
    </S.Wrapper>
  );
};
