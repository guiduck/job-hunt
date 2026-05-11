import styled from "styled-components";

export const Wrapper = styled.div`
  background: #ffffff;
  display: flex;
  height: 100vh;
  max-height: calc(100vh - 130px);
  flex-direction: column;
  background: #fafafa;
  overflow: auto;
  position: relative;
`;

export const Input = styled.div`
  position: -webkit-sticky; /* Safari */
  position: sticky;
  top: 0;
  background: #fafafa;
  padding: 20px 2px;
  div:first-child {
    margin: 0 auto;
  }
`;

export const ListWrapper = styled.div`
  display: grid;
  grid-template-columns: 49% 49%;
  width: 100%;
  gap: 9px 0px;
  justify-content: center;
`;

export const NoOffersAvailableWrapper = styled.div`
  width: calc(100% - 52px);
  display: flex;
  flex-direction: column;
  margin: 26px;
  text-align: center;
`;

export const NoOffersAvailableTitle = styled.div`
  font-size: 16px;
  line-height: 18px;
  font-weight: bold;
`;

export const NoOffersAvailableSubTitle = styled.div`
  font-size: 16px;
  line-height: 18px;
`;
