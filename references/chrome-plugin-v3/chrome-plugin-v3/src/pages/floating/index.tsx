import React, { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getCurrentChannelFromBackground,
  redirectToStore,
} from "../../services/userService";
import { DefaultProps } from "../..";
import { sendMessageFromPageToBackground } from "../../chrome/messaging";
import ActivateCashbackPopup from "../../components/ActivateCashbackPopup";
import * as S from "./styled";
import { isFirstTimeOpeningFromBackground } from "../../services/navigationService";
import { ThemeContext } from "../../context/ThemeContext";
import setPopupSize from "../../utils/setPopupSize";

const Floating: React.FC<DefaultProps> = () => {
  const navigate = useNavigate();
  const [query] = useSearchParams();
  const [hasHovered, setHasHovered] = useState(false);
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const hasCashback =
    query.get("cashbackRate") !== "undefined" &&
    query.get("cashbackRate") !== "0";
  const isCashbackActivated = query.get("isCashbackActivated") === "true";
  const [isAlternativeLogo, setIsAlternativeLogo] = useState(false);

  const { setTheme } = useContext(ThemeContext);

  /* istanbul ignore next */
  const onClose = () => {
    sendMessageFromPageToBackground<string>({
      type: "closeWindow",
      data: "",
    });
  };

  /* istanbul ignore next */
  const onClick = () => {
    setPopupSize("380px", "100vh", "inset(0px 0px 30px)");
    isFirstTimeOpeningFromBackground().then((isFirstTime) => {
      const slug = query.get("slug") as string;

      sessionStorage.slug = slug;

      if (isFirstTime) {
        navigate(`/first-tutorial?slug=${slug}`);
        return;
      }

      if (hasCashback && !isCashbackActivated) {
        redirectToStore(slug, true);
        return;
      }

      navigate(`/store/${slug}`);
    });
  };

  const renderPopup = useCallback(() => {
    if (!hasHovered || !hasCashback || isCashbackActivated) return undefined;

    const slug = query.get("slug") as string;
    const cashbackRate = query.get("cashbackRate") as string;
    const storeName = query.get("storeName") as string;
    const oldCashbackRate = query.get("oldCashbackRate") as string;
    const cashbackValueTypeRate = query.get("cashbackValueTypeRate") as
      | "P"
      | "F";

    setPopupSize("380px", "100vh", "inset(50px 0px 30px)");

    return (
      <S.PopupWrapper
        onMouseLeave={
          /* istanbul ignore next */ () => {
            setPopupSize("90px", "120px", "inset(50px 0px 0px)");
            setHasHovered(false);
          }
        }
      >
        <ActivateCashbackPopup
          isAlternativeLogo={isAlternativeLogo}
          storeName={storeName}
          cashbackRate={cashbackRate}
          oldCashbackRate={oldCashbackRate}
          cashbackValueTypeRate={cashbackValueTypeRate}
          onClick={
            /* istanbul ignore next */
            () => {
              redirectToStore(slug, true);
            }
          }
        />
      </S.PopupWrapper>
    );
  }, [hasHovered, isAlternativeLogo]);

  useEffect(() => {
    setPopupSize("90px", "120px", "inset(50px 0px 0px)");
  }, []);

  useEffect(() => {
    getCurrentChannelFromBackground().then((_channel) => {
      /* istanbul ignore else */
      if (_channel !== "cuponeria-ext") {
        setLogoUrl("logo-alt.png");
        setIsAlternativeLogo(true);
        if (_channel === "cuponeria-elo-ext") {
          setTheme("elo");
        }
      }
    });
  }, []);

  return (
    <S.Wrapper>
      <S.Content onMouseEnter={() => setHasHovered(true)}>
        <S.Logo src={logoUrl} onClick={onClick} data-testid="logo" />
        <S.Counter>{query.get("offerCount")}</S.Counter>
        <S.Close onClick={onClose}>X</S.Close>
      </S.Content>
      {renderPopup()}
    </S.Wrapper>
  );
};

export default Floating;
