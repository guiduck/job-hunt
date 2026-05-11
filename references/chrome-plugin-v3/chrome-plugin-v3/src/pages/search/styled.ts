import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 360px;
  // gap: 1.25rem;

  background: #fafafa;
  height: 100vh;
  max-height: calc(100vh - 130px);
  overflow: auto;
`;

export const SearchInput = styled.input`
  background-color: #efefef;
  width: 100%;
`;

export const SearchWrapper = styled.div`
  width: clamp(15rem, 100%, 20.5rem);
  height: 2.8rem;
  display: flex;
  margin: 0;
  position: sticky;
  top: 0;
  background: #fafafa;
  z-index: 100;
  padding: 20px 10px;
`;

export const SectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: start;
  width: 100%;
`;

export const BrandCardsWrapper = styled.div`
  display: flex;
  padding: 1px 15px 2px 15px;
  width: calc(100% - 30px);

  overflow-y: scroll;
  scroll-snap-type: x mandatory;
`;

export const BrandCardsContainer = styled.div`
  display: flex;
  gap: 13px;
`;

export const SuggestCardsWrapper = styled.div`
  display: flex;
  width: -webkit-fill-available;
  flex-direction: column;
  padding: 0 15px 15px 15px;
  gap: 15px;
`;

export const SectionTitle = styled.p`
  font-family: Roboto;
  font-size: 18px;
  font-weight: bold;
  text-align: left;
  width: calc(100% - 30px);
  line-height: 20px;
  padding: 0 15px;
`;

export const LoaderWrapper = styled.p`
  width: 100%;
  display: flex;
  align-content: center;
  justify-content: center;
`;
