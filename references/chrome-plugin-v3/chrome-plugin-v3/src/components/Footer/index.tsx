import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import * as S from "./styled";

export interface IconsProps {
  label: string;
  icon: React.ElementType;
  path: string;
}
interface FooterProps {
  icons: IconsProps[];
}

const renderIcons = (
  icons: IconsProps[],
  navigateTo: (path: string) => void
): JSX.Element[] => {
  const arrayList: JSX.Element[] = [];
  const location = useLocation();

  icons.forEach((element) => {
    arrayList.push(
      <S.IconContainer
        key={element.label}
        data-testid="footer-icon"
        onClick={/* istanbul ignore next */ () => navigateTo(element.path)}
        path={element.path === "/" ? "/store" : element.path}
        currentPath={
          location.pathname === "/"
            ? "/store"
            : /* istanbul ignore next */ location.pathname
        }
      >
        <S.Svg>
          {React.createElement(element.icon)}
          <S.IconLabel>{element.label}</S.IconLabel>
        </S.Svg>
      </S.IconContainer>
    );
  });

  return arrayList;
};

const Footer: React.FC<FooterProps> = ({ icons }) => {
  const nav = useNavigate();

  return (
    <S.Container data-testid="footer">
      <S.Icons>{renderIcons(icons, nav)}</S.Icons>
    </S.Container>
  );
};

export default Footer;
