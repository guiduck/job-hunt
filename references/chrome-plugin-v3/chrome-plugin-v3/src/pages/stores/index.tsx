import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DefaultProps } from "../..";
import { CardBrand } from "../../components/CardBrand";
import { Input } from "../../components/Input";
import DomainStoreList from "../../mocks/DomainStoreList";
import {
  Domain,
  getStoreListFromBackground,
} from "../../services/storeService";
import { redirectToStore } from "../../services/userService";
import * as S from "./styled";

const Stores: React.FC<DefaultProps> = () => {
  const [searchParams] = useSearchParams();
  const [storeListData, setStoreListData] = useState<Domain[] | []>([]);
  const [typedFilter, setTypedFilter] = useState<string>("");

  const renderInput = () => {
    if (searchParams.get("noStoreFound")) return undefined;

    return (
      <S.Input>
        <Input
          padding="0"
          width="calc(100% - 20px)"
          placeholder="buscar lojas"
          onUserTyping={
            /* istanbul ignore next */ (value) => {
              setTypedFilter(value);
            }
          }
        />
      </S.Input>
    );
  };

  const renderNoStoreTitle = () => {
    if (!searchParams.get("noStoreFound")) return undefined;

    return (
      <S.NoOffersAvailableWrapper>
        <S.NoOffersAvailableTitle>
          Essa loja não tem cupons e cashback
        </S.NoOffersAvailableTitle>
        <S.NoOffersAvailableSubTitle>
          Ganhe benefícios em lojas semelhantes:
        </S.NoOffersAvailableSubTitle>
      </S.NoOffersAvailableWrapper>
    );
  };

  const renderStore = (store: Domain, index: number) => {
    return (
      <CardBrand
        key={`card-brand-${index}`}
        image={store.storeLogo}
        title={store.storeName}
        cashbackValue={store.cashbackRate}
        cashbackValueTypeRate={store.cashbackValueTypeRate}
        qtdCoupon={store.offerCount}
        onClick={
          /* istanbul ignore next */ () => {
            redirectToStore(store.slug, false);
          }
        }
      />
    );
  };

  const renderStoreList = () => {
    const filteredStores = storeListData.filter(
      (x) => !typedFilter || x.storeName?.toLowerCase().includes(typedFilter)
    );
    return <S.ListWrapper>{filteredStores.map(renderStore)}</S.ListWrapper>;
  };

  /* istanbul ignore next */
  const getStoreList = () => {
    if (process.env.NODE_ENV === "test" || process.env.STORYBOOK_MODE) {
      setStoreListData(DomainStoreList);
      return;
    }

    getStoreListFromBackground().then((storeList) => {
      setStoreListData(storeList as Domain[]);
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  useEffect(() => {}, [storeListData, typedFilter]);

  useEffect(() => getStoreList(), []);

  return (
    <S.Wrapper>
      {renderInput()}
      {renderNoStoreTitle()}
      {renderStoreList()}
    </S.Wrapper>
  );
};

export default Stores;
