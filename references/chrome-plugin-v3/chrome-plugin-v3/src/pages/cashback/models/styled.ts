import styled from "styled-components";

export const Wrapper = styled.div`
  padding: 25px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const PigImageWrapper = styled.div`
  margin: 28px auto 10px;
`;

export const Title = styled.div`
  width: 100%;
  height: 70px;
  color: ${({ theme: { cashbackBadge } }) => cashbackBadge || "#000000cc"};
  font-size: 22px;
  line-height: 24px;
  max-width: 281px;
  font-weight: bold;
  align-items: center;
  justify-content: center;
  text-align: center;
  display: flex;
`;

export const SubTitle = styled.div`
  width: 100%;
  color: #000000cc;
  text-align: center;
  font-size: 18px;
  line-height: 24px;
  max-width: 281px;
  margin: 12px auto 30px;
`;
