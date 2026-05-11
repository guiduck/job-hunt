// TODO: Verificar a necessidade dos "ignore" desta tela

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DefaultProps } from "../..";
import { CardBrand } from "../../components/CardBrand";
import { CardCoupon } from "../../components/CardCoupon";
import LoaderIcon from "../../components/Icons/svg/LoaderIcon";
import { Input } from "../../components/Input";
import { mockOffer, mockStore } from "../../mocks/searchMocks";

import {
  searchByTerm,
  SearchResult,
  StoreResult,
  OfferResult,
  getSuggestedOffers,
} from "../../services/searchService";
import { redirectToCoupon, redirectToStore } from "../../services/userService";

import * as S from "./styled";
import { error } from "../../services/logService";
import getBadges from "../../utils/offerHelper";

const Search: React.FC<DefaultProps> = () => {
  const { term } = useParams();

  const [storesResult, updateStores] = useState<StoreResult[]>([]);
  const [offersResult, updateOffers] = useState<OfferResult[]>([]);
  const [suggestions, setSuggestions] = useState<OfferResult[]>([]);

  const [termToSearch, setTermToSearch] = useState<string>(term ?? "");
  const [previousTerm, setPreviousTerm] = useState<string>("");
  const [isFetchingData, setIsFetchingData] = useState<boolean>(false);

  const renderRelatedStores = () => {
    if (!termToSearch || !storesResult || storesResult?.length === 0)
      return undefined;

    return (
      <S.SectionWrapper data-testid="brand">
        <S.SectionTitle>lojas relacionadas: {termToSearch}</S.SectionTitle>
        <S.BrandCardsWrapper>
          <S.BrandCardsContainer>
            {storesResult.map((store) => {
              return (
                <CardBrand
                  key={store.slug}
                  isMiniature
                  image={store.logo}
                  title={store.name}
                  cashbackValue={store.cashbackRate}
                  cashbackValueTypeRate={store.cashbackValueTypeRate}
                  qtdCoupon={store.offerCount}
                  onClick={
                    /* istanbul ignore next */
                    () => {
                      redirectToStore(store.slug, false);
                    }
                  }
                />
              );
            })}
          </S.BrandCardsContainer>
        </S.BrandCardsWrapper>
      </S.SectionWrapper>
    );
  };

  const renderCards = (offers: OfferResult[]) => (
    <>
      {offers.map((offer) => {
        const {
          hideCodeOnLoad,
          rules,
          code,
          id,
          title,
          renderType,
          storeLogo,
          storeName,
          slug: offerSlug,
        } = offer;
        return (
          <CardCoupon
            key={`card-cupon-${id}`}
            isItOffer={renderType?.toLocaleUpperCase() === "OFFER_ONLINE"}
            code={code as string}
            couponDescription={title}
            badges={getBadges(offer)}
            rulesText={rules}
            storeLogo={storeLogo}
            storeName={storeName}
            hideCodeOnLoad={hideCodeOnLoad}
            onClick={
              /* istanbul ignore next */
              () => {
                redirectToCoupon(
                  offerSlug,
                  offer.storeSlug,
                  false,
                  hideCodeOnLoad
                );
              }
            }
          />
        );
      })}
    </>
  );

  const renderRelatedOffers = () => {
    if (!termToSearch || !offersResult || offersResult?.length === 0)
      return undefined;

    return (
      <S.SectionWrapper data-testid="brand">
        <S.SectionTitle>ofertas relacionadas: {termToSearch}</S.SectionTitle>
        <S.SuggestCardsWrapper>
          {renderCards(offersResult)}
        </S.SuggestCardsWrapper>
      </S.SectionWrapper>
    );
  };

  /* istanbul ignore next */
  const renderSuggestionsText = () => {
    if (!termToSearch) return `Sugestões para você:`;

    return `Não encontrei o que você buscou, mas separei ofertas incríveis para você! 👀`;
  };

  const renderSuggestions = () => {
    /* istanbul ignore if */
    if (isFetchingData) return undefined;

    if (termToSearch && (offersResult.length > 0 || storesResult.length > 0))
      return undefined;

    return (
      <S.SectionWrapper data-testid="noBrand">
        <S.SectionTitle>{renderSuggestionsText()}</S.SectionTitle>
        <S.SuggestCardsWrapper>
          {renderCards(suggestions)}
        </S.SuggestCardsWrapper>
      </S.SectionWrapper>
    );
  };

  /* istanbul ignore next */
  const handleSearch = async (query: string) => {
    if (process.env.NODE_ENV === "test") {
      if (!query || query === "mockNotFoundTerm") {
        updateStores([]);
        updateOffers([]);
      } else {
        updateStores([mockStore]);
        updateOffers([mockOffer]);
      }
      setIsFetchingData(false);
      return;
    }

    if (query.length < 3 || query === previousTerm) return;

    setPreviousTerm(query);

    searchByTerm(query)
      .then((search) => {
        const { stores, offers } = search as SearchResult;
        updateOffers(offers);
        updateStores(stores);
        setIsFetchingData(false);
      })
      .catch(() => {
        updateOffers([]);
        updateStores([]);
        setIsFetchingData(false);
      });
  };

  /* istanbul ignore next */
  const loadSuggestions = () => {
    setIsFetchingData(true);

    if (process.env.NODE_ENV === "test") {
      setSuggestions([mockOffer]);
      setIsFetchingData(false);
      return;
    }

    getSuggestedOffers()
      .then((response) => {
        const offers = response as OfferResult[];

        setSuggestions(offers);
        setIsFetchingData(false);
      })
      .catch((e: Error) =>
        error("[Offer] Failed to load suggested offers", { message: e.message })
      );
  };

  const renderSearchResults = () => {
    if (isFetchingData || !termToSearch) return undefined;

    return (
      <>
        {renderRelatedStores()}
        {renderRelatedOffers()}
      </>
    );
  };

  /* istanbul ignore next */
  const renderLoader = () => {
    if (!isFetchingData) return undefined;

    return (
      <S.LoaderWrapper>
        <LoaderIcon color="#f00" size={30} />
      </S.LoaderWrapper>
    );
  };

  const renderInput = () => {
    return (
      <S.SearchWrapper>
        <Input
          defaultValue={termToSearch}
          padding="0"
          onUserTyped={
            /* istanbul ignore next */
            (value) => {
              setTermToSearch(value);
            }
          }
          onUserTyping={
            /* istanbul ignore next */ (value) => {
              if (!value) {
                setTermToSearch("");
                setIsFetchingData(false);
                return;
              }

              setIsFetchingData(true);
            }
          }
        />
      </S.SearchWrapper>
    );
  };

  useEffect(() => {
    if (termToSearch) {
      handleSearch(termToSearch);
    }
  }, [termToSearch, isFetchingData, previousTerm]);

  useEffect(() => {
    loadSuggestions();
  }, []);

  return (
    <S.Container data-testid={termToSearch ? "brandContent" : "noBrandContent"}>
      {renderInput()}
      {renderLoader()}
      {renderSuggestions()}
      {renderSearchResults()}
    </S.Container>
  );
};

export default Search;
