import styled from "styled-components";
import { CardProps } from ".";

export interface ContentProps {
  width: string;
  height: string;
}

export interface FontProps {
  color?: string;
  font: string;
}

export const Wrapper = styled.div<CardProps>`
  max-width: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  scroll-snap-align: center;
`;

export const Content = styled.div<ContentProps>`
  background: #fff;
  box-shadow: 0px 2px 3px #0000001f;
  width: ${(props) => props.width};
  height: ${(props) => props.height};
  border-radius: 8px;
  padding: 2px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0;
  cursor: pointer;
`;

export const Image = styled.img<CardProps>`
  border-radius: 50%;
  margin: 0;
  box-shadow: 0px 1px 2px #00000029;
  border: 0.5px solid #e3e3e3;
  width: ${(props) => props.width};
  height: ${(props) => props.height};
`;

export const Title = styled.h2<CardProps>`
  color: ${(props) => props.color};
  font: normal normal bold 18px/15px Roboto;
  margin: 15px 0 0 0;
  text-align: center;
`;

export const TextCashback = styled.h3<FontProps>`
  color: ${({ theme: { cardBrand } }) => cardBrand?.textCashback || "#4CAF50"};
  font: ${(props) => props.font};
  text-align: center;
  margin: 15px 0 0 0;

  > span {
    font: normal normal bold 12px/12px Roboto;
  }
`;

export const TextCoupon = styled.p<FontProps>`
  color: ${(props) => props.color};
  font: ${(props) => props.font};
  margin: 0 0 0 0;
`;
