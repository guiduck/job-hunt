import styled from "styled-components";

export interface ColorTextProps {
  color?: string;
}

export interface ContentTextCashbackProps {
  background: string;
  padding: string;
  boxShadow: string;
}

export const Wrapper = styled.div`
  padding: 10px;
  // width: 360px;
`;

export const Content = styled.div`
  height: auto;
  border-radius: 8px;
  padding: 2px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0;
`;

export const Image = styled.img`
  border-radius: 50%;
  margin: 0;
  box-shadow: 0px 1px 2px #00000029;
  border: 0.5px solid #e3e3e3;
  width: 70px;
  height: 70px;
`;

export const ContentTextCashback = styled.div<ContentTextCashbackProps>`
  background: ${(props) => props.background};
  padding: ${(props) => props.padding};
  width: calc(100% - 30px);
  margin: 15px 0 0 0;
  text-align: center;
  box-shadow: ${(props) => props.boxShadow};
  border-radius: 10px;
`;

export const TextCashback = styled.h3<ColorTextProps>`
  color: ${({ theme: { storeHeader } }) => storeHeader?.highlightText};
  font: normal normal bold 20px/24px Roboto;
  margin: 0;
`;

export const DescriptionTextCashback = styled.span<ColorTextProps>`
  color: ${(props) => props.color};
  font: normal normal normal 20px/24px Roboto;
  letter-spacing: 0px;
  padding: 3px 0 0 0;
`;

export const DescriptionTextCashbackActive = styled.div`
  text-align: center;
  font: normal normal bold 14px/16px Roboto;
  letter-spacing: 0px;
  color: ${({ theme: { storeHeader } }) =>
    storeHeader?.cashbackActiveText || "#000000b3"};
  margin-top: 10px;
`;

export const PartnerRulesTitle = styled.div`
  font: normal normal normal 12px/18px Roboto;
  letter-spacing: 0px;
  color: #00000080;
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-top: 5px;
`;

export const ContentIcon = styled.div`
  margin: 0 5px;
  display: flex;
  justify-content: center;
`;

export const PartnerRulesContent = styled.div`
  font: normal normal normal 11px/14px Roboto;
  letter-spacing: 0px;
  color: #00000080;
  display: flex;
  align-items: center;
  padding-top: 5px;
`;
