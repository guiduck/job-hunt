import styled, { css } from "styled-components";
import { Logo } from "../Header/styled";

export const Wrapper = styled.div`
  width: 360px;
`;

export const Content = styled.div`
  background: white;
  border-radius: 11px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  flex-direction: column;
  padding: 0 17px 36px 17px;
  width: 342px;
  box-shadow: 0px 6px 12px #00000029;
  ${({ theme: { theme } }) =>
    theme === "elo"
      ? css`
          ${Logo} {
            left: 10px;
          }
        `
      : undefined}
`;

export const Image = styled.div`
  margin: 10px auto 30px auto;
`;

export const TextWrapper = styled.div`
  font-size: 20px;
  line-height: 24px;
  color: #000000b3;
  text-align: center;
  margin-bottom: 7px;
`;

export const CashbackText = styled.span`
  font-weight: bold;
  font-size: 20px;
  line-height: 24px;
  color: ${({ theme: { cardBrand } }) => cardBrand?.textCashback || "#4CAF50"};
`;

export const CashbackTextStrike = styled.span`
  text-decoration: line-through;
`;
