import React, { useContext } from "react";
import * as S from "./styled";

import { ArrowButtonIcon, CloseIcon, MinimizeIcon } from "../Icons";
import DispenseExtension from "../DispenseExtension";
import { sendMessageFromPageToBackground } from "../../chrome/messaging";
import { ThemeContext } from "../../context/ThemeContext";

type IconType = {
  color: string;
  size?: number;
  onClick?: () => void;
};

export interface HeaderProps {
  isWideLogo?: boolean;
  logo?: (Icon: IconType) => JSX.Element;
  logoColor?: string;
  hasWallet?: boolean;
  walletCredit?: number | string;
  walletText?: string;
  hasButtons?: boolean;
  hasSettings?: boolean;
  onClick?: () => void;
  onClose?: () => void;
  onMinimize?: () => void;
  onWalletClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  logo,
  isWideLogo = false,
  logoColor = "white",
  hasWallet = false,
  walletCredit = "0,00",
  hasButtons = false,
  hasSettings = false,
  walletText = "seus créditos",
  onClick,
  onMinimize,
  onClose,
  onWalletClick,
}) => {
  const { getThemeObject } = useContext(ThemeContext);

  const renderLogo = () => {
    if (!logo) return null;
    return React.createElement(logo, {
      size: 24,
      color: logoColor,
      onClick,
    });
  };

  const renderWallet = () => {
    if (!hasWallet) return null;
    return (
      <S.Wallet
        data-testid="wallet"
        onClick={/* istanbul ignore next */ () => onWalletClick?.()}
      >
        <S.WalletContent>
          <S.WalletTitle>{walletText}</S.WalletTitle>
          {`R$${walletCredit}`}
        </S.WalletContent>
        <ArrowButtonIcon
          color={getThemeObject?.()?.header?.wallet?.icon || "rgba(0,0,0,0.5)"}
        />
      </S.Wallet>
    );
  };

  const renderButtons = () => {
    if (!hasButtons) return null;
    return (
      <S.Buttons data-testid="buttons">
        <S.MinimizeIconWrapper onClick={onMinimize}>
          <MinimizeIcon color="#b9b9b9" />
        </S.MinimizeIconWrapper>
        <CloseIcon color="#b9b9b9" onClick={onClose} />
      </S.Buttons>
    );
  };

  const renderEngine = () => {
    if (!hasSettings) return null;
    return (
      <DispenseExtension
        onOptionClick={
          /* istanbul ignore next */
          (time, slug) => {
            sendMessageFromPageToBackground<{ slug?: string; time?: string }>({
              type: `dispenseExtension`,
              data: {
                slug,
                time,
              },
            });
          }
        }
      />
    );
  };

  const renderRegularHeader = () => {
    /* istanbul ignore if */
    if (isWideLogo) {
      return undefined;
    }

    return (
      <S.Content data-testid="content">
        {renderWallet()}
        {renderButtons()}
        {renderEngine()}
      </S.Content>
    );
  };

  /* istanbul ignore next */
  const renderWideLogoHeader = () => {
    if (!isWideLogo) {
      return undefined;
    }

    return (
      <S.WideContent data-testid="content">
        {renderWallet()}
        <S.DownSizedButtons>{renderButtons()}</S.DownSizedButtons>
      </S.WideContent>
    );
  };

  return (
    <S.Container
      content={hasWallet.toString()}
      alignItems={isWideLogo ? /* istanbul ignore next */ "flex-end" : "center"}
    >
      <S.Logo
        data-testid={hasWallet ? "logoWithWallet" : "logo"}
        content={hasWallet.toString()}
        paddingBottom={isWideLogo ? /* istanbul ignore next */ "8px" : "0"}
      >
        {renderLogo()}
      </S.Logo>
      {renderRegularHeader()}
      {renderWideLogoHeader()}
    </S.Container>
  );
};
