import React, { useContext, useState } from "react";
import * as S from "./styled";
import { Button } from "../Button";
import CashbackIcon from "../Icons/svg/CashbackIcon";
import CheckCircleIcon from "../Icons/svg/CheckCircleIcon";
import ArrowUpIcon from "../Icons/svg/ArrowUpIcon";
import ArrowDownIcon from "../Icons/svg/ArrowDownIcon";
import { ThemeContext } from "../../context/ThemeContext";

export interface StoreHeaderProps {
  image?: string;
  title?: string;
  cashbackIsActive?: boolean;
  cashbackValue?: string;
  cashbackColor?: string;
  oldCashbackValue?: string;
  cashbackDescriptionColor?: string;
  isDiscount?: boolean;
  partnerRules?: string;
  disabled?: boolean;
  onClickButton?: () => void;
}

export const StoreHeader: React.FC<StoreHeaderProps> = ({
  image = "https://media.cuponeria.com.br/store/americanas-com/logo/89b2f817-americanas-com-72x72.jpeg",
  title = "Título",
  cashbackIsActive = false,
  cashbackValue = undefined,
  cashbackColor = "#4CAF50",
  oldCashbackValue = undefined,
  cashbackDescriptionColor = "#000000B3",
  isDiscount = false,
  partnerRules = "Não existem regras definidas neste cashback.",
  disabled,
  onClickButton = undefined,
}: StoreHeaderProps) => {
  const [toDisplayPartnerRule, setToDisplayPartnerRule] = useState(false);
  const { getThemeObject } = useContext(ThemeContext);

  let storeHeaderProperties = {
    backgroundContentTextCashback: "transparent",
    paddingContentTextCashback: "0",
    boxShadowContentTextCashback: "0",
  };

  if (cashbackIsActive) {
    storeHeaderProperties = {
      backgroundContentTextCashback:
        getThemeObject?.()?.storeHeader?.cashbackActiveBackground || "",
      paddingContentTextCashback: "15px",
      boxShadowContentTextCashback: "0px 2px 3px #0000001F",
    };
  }

  const renderButton = () => {
    if (isDiscount) return undefined;

    let buttonProperties = {
      icon: <CashbackIcon color="#ffffff" />,
      label: "ativar cashback",
      padding: "10px 10px 0 10px",
    };

    if (cashbackIsActive) {
      buttonProperties = {
        icon: <CheckCircleIcon color="#ffffff" />,
        label: `${cashbackValue
          ?.toString()
          .replace(".", ",")} de cashback ativado`,
        padding: "0",
      };
    }
    return (
      <Button
        icon={buttonProperties.icon}
        label={buttonProperties.label}
        padding={buttonProperties.padding}
        onClick={onClickButton}
      />
    );
  };

  const renderOldTextCashback = () => {
    let oldTextCashback = "";
    if (oldCashbackValue) {
      oldTextCashback = ` (era ${oldCashbackValue
        ?.toString()
        .replace(".", ",")})`;
    }
    return oldTextCashback;
  };

  const renderTextCashbackAndCashbackOrAmount = () => {
    let textCashbackOrAmount = " de cashback ";
    if (isDiscount) {
      textCashbackOrAmount = " de desconto ";
    }
    return `${cashbackValue
      ?.toString()
      .replace(".", ",")} ${textCashbackOrAmount}`;
  };

  const renderTextNotCashback = () => {
    return (
      <S.DescriptionTextCashback color={cashbackDescriptionColor}>
        {title}
      </S.DescriptionTextCashback>
    );
  };

  const renderTextCashbackIsActive = () => {
    return (
      <S.ContentTextCashback
        background={storeHeaderProperties.backgroundContentTextCashback}
        padding={storeHeaderProperties.paddingContentTextCashback}
        boxShadow={storeHeaderProperties.boxShadowContentTextCashback}
      >
        {renderButton()}
        <S.DescriptionTextCashbackActive>
          Agora é só concluir sua compra e aguardar a liberação no seu extrato
          da Cuponeria
        </S.DescriptionTextCashbackActive>
      </S.ContentTextCashback>
    );
  };

  const renderTextCashback = () => {
    if (!cashbackValue || cashbackValue === "") {
      return renderTextNotCashback();
    }

    if (cashbackIsActive) {
      return renderTextCashbackIsActive();
    }

    return (
      <>
        <S.ContentTextCashback
          background={storeHeaderProperties.backgroundContentTextCashback}
          padding={storeHeaderProperties.paddingContentTextCashback}
          boxShadow={storeHeaderProperties.boxShadowContentTextCashback}
        >
          <S.TextCashback data-testid="textCashback">
            {renderTextCashbackAndCashbackOrAmount()}
            <S.DescriptionTextCashback color={cashbackDescriptionColor}>
              em
            </S.DescriptionTextCashback>
          </S.TextCashback>
          <S.DescriptionTextCashback color={cashbackDescriptionColor}>
            {`${title} `}
            <s>{renderOldTextCashback()}</s>
          </S.DescriptionTextCashback>
        </S.ContentTextCashback>
        {renderButton()}
      </>
    );
  };

  const renderPartnerRule = () => {
    if (isDiscount || !partnerRules || disabled) return undefined;

    let rulesProperties = {
      icon: <ArrowUpIcon color="#00000080" />,
      rules: partnerRules,
    };
    if (!toDisplayPartnerRule) {
      rulesProperties = {
        icon: <ArrowDownIcon color="#00000080" />,
        rules: "",
      };
    }

    return (
      <>
        <S.PartnerRulesTitle
          onClick={() => setToDisplayPartnerRule(!toDisplayPartnerRule)}
          data-testid="buttonRule"
        >
          regras do parceiro
          <S.ContentIcon>{rulesProperties.icon}</S.ContentIcon>
        </S.PartnerRulesTitle>
        <S.PartnerRulesContent>{rulesProperties.rules}</S.PartnerRulesContent>
      </>
    );
  };

  return (
    <S.Wrapper>
      <S.Content>
        <S.Image src={image} title={title} alt={title} data-testid="image" />
        {renderTextCashback()}
        {renderPartnerRule()}
      </S.Content>
    </S.Wrapper>
  );
};
