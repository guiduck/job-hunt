import React, { useContext, useState } from "react";
import * as S from "./styled";

import { Badge } from "../Badge";
import { DashedButton } from "../DashedButton";

import ContentCopyIcon from "../Icons/svg/ContentCopyIcon";
import CheckCircleIcon from "../Icons/svg/CheckCircleIcon";
import DropdownIcon from "../Icons/svg/DropdownIcon";
import { ThemeContext } from "../../context/ThemeContext";

export interface CardCouponProps {
  isItOffer: boolean;
  code?: string;
  couponDescription: string;
  badges: Array<string>;
  rulesText: string;
  hideCodeOnLoad?: boolean;
  storeLogo?: string;
  storeName?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export const CardCoupon: React.FC<CardCouponProps> = ({
  isItOffer,
  code,
  couponDescription,
  hideCodeOnLoad,
  badges,
  rulesText,
  storeLogo,
  disabled,
  storeName,
  onClick,
}) => {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const [clickedDropdownIcon, setClickedDropdownIcon] = useState(false);

  const { getThemeObject } = useContext(ThemeContext);

  /* istanbul ignore next */
  const handleHover = (value: boolean) => {
    setHover(value);
  };

  /* istanbul ignore next */
  const copyTextToClipboard = (text: string) => {
    return navigator.clipboard.writeText(text);
  };

  /* istanbul ignore next */
  const handleCopyClick = () => {
    if (isItOffer) {
      onClick?.();
      return;
    }

    if (code && !hideCodeOnLoad) {
      copyTextToClipboard(code);
      setActive(true);
    }

    setTimeout(() => {
      setActive(false);
      onClick?.();
    }, 1500);
  };

  /* istanbul ignore next */
  const handleClickDropdown = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;
    e.stopPropagation();
    setClickedDropdownIcon(!clickedDropdownIcon);
  };

  const renderDashedButton = (isOffer: boolean): JSX.Element => {
    if (!isOffer && !hideCodeOnLoad) {
      return (
        <DashedButton
          isItOffer={isItOffer}
          label={code}
          active={active}
          icon={
            !active ? (
              <ContentCopyIcon />
            ) : (
              /* istanbul ignore next */ <CheckCircleIcon
                color={getThemeObject()?.dashedButton?.icon || ""}
                size={22}
              />
            )
          }
        />
      );
    }

    if (hideCodeOnLoad) {
      return <DashedButton isItOffer label="gerar código" />;
    }

    return <DashedButton isItOffer={isOffer} label="aproveitar oferta" />;
  };

  const renderStoreIcon = (): JSX.Element | undefined => (
    <S.StoreIconContainer>
      {storeLogo && <S.LogoImage storeLogo={storeLogo} />}
      <S.StoreName>{storeName}</S.StoreName>
    </S.StoreIconContainer>
  );

  return (
    <S.Wrapper
      onMouseEnter={/* istanbul ignore next */ () => handleHover(true)}
      onMouseLeave={/* istanbul ignore next */ () => handleHover(false)}
      hover={hover}
      onClick={handleCopyClick}
    >
      <S.CardContent>
        {renderStoreIcon()}

        <S.Badges>
          {badges.map((element) => (
            <Badge key={element} label={element} hover={hover} />
          ))}
        </S.Badges>

        <S.CouponDescription>{couponDescription}</S.CouponDescription>

        <S.ButtonWrapper>{renderDashedButton(isItOffer)}</S.ButtonWrapper>
      </S.CardContent>

      <S.CardFooter data-testid="card-coupon-footer">
        <S.CardFooterItem
          onClick={handleClickDropdown}
          clickedDropdownIcon={clickedDropdownIcon}
        >
          ver regra <DropdownIcon />
        </S.CardFooterItem>
      </S.CardFooter>

      <S.RulesContent clickedDropdownIcon={clickedDropdownIcon}>
        {rulesText}
      </S.RulesContent>
    </S.Wrapper>
  );
};
