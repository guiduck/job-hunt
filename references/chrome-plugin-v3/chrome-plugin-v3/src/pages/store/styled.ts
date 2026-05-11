import styled from "styled-components";

export const Wrapper = styled.div`
  background: #fafafa;
  display: flex;
  height: 100vh;
  max-height: calc(100vh - 130px);
  flex-direction: column;
  overflow: auto;
`;

export const CouponListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 15px;
  gap: 15px;
`;

export const SevenDaysWrapper = styled.div`
  background: #efefef;
  margin: -15px;
  margin-top: 15px;
  padding: 15px;
  gap: 15px;
  display: flex;
  flex-direction: column;
`;

export const SevenDaysTitle = styled.div`
  font-size: 14px;
  font-weight: bold;
  line-height: 16px;
  text-align: center;
  padding: 5px;
`;

export const NoOffersAvailableWrapper = styled.div`
  width: calc(100% - 52px);
  display: flex;
  flex-direction: column;
  margin: 26px;
  text-align: center;
`;

export const NoOffersAvailableTitle = styled.div`
  font-size: 14px;
  line-height: 18px;
  font-weight: bold;
  color: #707070;
  white-space: nowrap;
`;
