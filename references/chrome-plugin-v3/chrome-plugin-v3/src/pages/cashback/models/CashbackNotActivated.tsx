import React, { useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { DefaultProps } from "../../..";
import { sendMessageFromPageToBackground } from "../../../chrome/messaging";
import { Button } from "../../../components/Button";
import { EloAlert, PigAlertWithMagnify } from "../../../components/Images";
import * as S from "./styled";
import { ThemeContext } from "../../../context/ThemeContext";

const CashbackNotActivated: React.FC<DefaultProps> = () => {
  const [searchParams] = useSearchParams();
  const activatedTab = searchParams.get("activatedTab") || "0";

  const { theme } = useContext(ThemeContext);

  return (
    <S.Wrapper>
      <S.PigImageWrapper data-testid="pigImage">
        {theme !== "elo" ? <PigAlertWithMagnify /> : <EloAlert />}
      </S.PigImageWrapper>
      <S.Title>Não finalize sua compra nesta aba</S.Title>
      <S.SubTitle>
        Para ganhar cashback, finalize a compra na <b>aba que abrimos</b>, assim
        podemos rastreá-la.
      </S.SubTitle>
      <Button
        label="ir para aba com cashback"
        width="281px"
        onClick={
          /* istanbul ignore next */
          () => {
            sendMessageFromPageToBackground({
              type: "switchToTab",
              data: { tabId: parseInt(activatedTab, 10) },
            });

            sendMessageFromPageToBackground({
              type: "closeWindow",
            });
          }
        }
      />
    </S.Wrapper>
  );
};

export default CashbackNotActivated;
