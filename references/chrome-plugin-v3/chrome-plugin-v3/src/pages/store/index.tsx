import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DefaultProps } from "../..";
import { CardCoupon } from "../../components/CardCoupon";
import { StoreHeader } from "../../components/StoreHeader";
import { getStoreFromBackgroundBySlug } from "../../services/storeService";
import { redirectToCoupon, redirectToStore } from "../../services/userService";
import * as S from "./styled";
import { sendMessageFromPageToBackground } from "../../chrome/messaging";
import { getCashbackStateBySlug } from "../../services/cashbackService";
import getSlugFromParams from "../../utils/getSlugFromParams";
import storeDataMock from "../../mocks/storeData";
import { OfferModel, StoreData } from "../search/models";

const Store: React.FC<DefaultProps> = () => {
  const navigate = useNavigate();
  const [storeData, setStoreData] = useState<StoreData | undefined>(undefined);
  const [isCashbackActive, setIsCashbackActive] = useState<boolean>(false);

  const slug = getSlugFromParams();

  const renderStoreHeader = () => {
    if (!storeData) return undefined;

    let cashbackValue = "";

    /* istanbul ignore next */
    if (storeData.cashback?.rate?.current) {
      cashbackValue = `${storeData.cashback?.rate?.current}%`;

      if (storeData.cashback?.type === "CURRENCY") {
        cashbackValue = `R$${storeData.cashback?.rate?.current}`;
      }
    }

    return (
      <StoreHeader
        image={storeData.logo}
        title={storeData.name}
        isDiscount={cashbackValue === ""}
        cashbackIsActive={isCashbackActive}
        cashbackValue={cashbackValue}
        partnerRules={storeData.description}
        onClickButton={
          /* istanbul ignore next */
          () => {
            redirectToStore(storeData.slug, true);
          }
        }
      />
    );
  };

  const renderNoCouponTitle = () => {
    if (storeData?.offers && storeData?.offers?.length > 0) return undefined;

    return (
      <S.NoOffersAvailableWrapper>
        <S.NoOffersAvailableTitle>
          Essa loja não tem cupom de desconto disponível.
        </S.NoOffersAvailableTitle>
      </S.NoOffersAvailableWrapper>
    );
  };

  const getBadges = (offer: OfferModel) => {
    const badges = [];
    const cashbackRate = storeData?.cashback?.rate?.current;

    if (cashbackRate && cashbackRate > 0) {
      const value = cashbackRate?.toString().replace(".", ",");

      if (offer.cashback?.type === "PERCENTAGE") {
        badges.push(`${value}% de cashback`);
      } else {
        badges.push(`R$${value} de cashback`);
      }
    }

    if (offer.badge) {
      badges.push(`${offer.badge} OFF`);
    }

    return badges;
  };

  const renderStoreCoupons = () => {
    if (storeData?.offers?.length === 0) return undefined;
    /* istanbul ignore next */
    return storeData?.offers?.map((offer) => {
      const rate = Number(storeData?.cashback?.rate?.current);
      const mustSwitchTabs = rate >= 0.01;

      const {
        hideCodeOnLoad,
        rules,
        code,
        id,
        title,
        renderType,
        slug: offerSlug,
      } = offer;

      return (
        <CardCoupon
          // eslint-disable-next-line react/no-array-index-key
          key={id}
          isItOffer={renderType.toLocaleUpperCase() === "OFFER_ONLINE"}
          code={code}
          couponDescription={title}
          badges={getBadges(offer)}
          rulesText={rules}
          storeLogo={storeData.logo}
          storeName={storeData.name}
          hideCodeOnLoad={hideCodeOnLoad}
          onClick={
            /* istanbul ignore next */
            () => {
              redirectToCoupon(
                offerSlug,
                storeData.slug,
                mustSwitchTabs,
                hideCodeOnLoad
              );
            }
          }
        />
      );
    });
  };

  const renderCouponListing = () => {
    if (!storeData) return undefined;
    return <S.CouponListWrapper>{renderStoreCoupons()}</S.CouponListWrapper>;
  };

  /* istanbul ignore next */
  const setPopupSize = (width: string, height: string, clipPath: string) => {
    sendMessageFromPageToBackground<{
      width: string;
      height: string;
      clipPath: string;
    }>({
      type: "resize",
      data: {
        width,
        height,
        clipPath,
      },
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  useEffect(() => {}, [storeData]);

  useEffect(
    /* istanbul ignore next */
    () => {
      if (process.env.NODE_ENV === "test" || process.env.STORYBOOK_MODE) {
        setStoreData(storeDataMock);
        return;
      }

      if (!slug || slug === "noStore") {
        navigate("/stores?noStoreFound=true");
        return;
      }

      getStoreFromBackgroundBySlug(slug || "").then((store) => {
        setStoreData(store as StoreData);
        const { slug: storeSlug } = store as StoreData;
        sessionStorage.slug = storeSlug;
      });

      getCashbackStateBySlug(slug || "").then((active) => {
        setIsCashbackActive(active);
      });

      setPopupSize("380px", "100vh", "none");
    },
    []
  );

  return (
    <S.Wrapper>
      {renderStoreHeader()}
      {renderNoCouponTitle()}
      {renderCouponListing()}
    </S.Wrapper>
  );
};

export default Store;
