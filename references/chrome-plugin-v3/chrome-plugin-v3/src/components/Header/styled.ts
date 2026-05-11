import styled, { css } from "styled-components";

export const Container = styled.div<{
  content: boolean | string;
  alignItems?: string;
}>`
  background: ${({ theme: { header } }) => header?.background || "white"};
  display: flex;
  justify-content: ${(props) =>
    props.content === "true" ? "space-evenly" : "center"};
  width: 360px;
  min-height: 3.1rem;
  border-radius: 10px 10px 0 0;
  box-shadow: 0px 2px 3px #0000001f;
  gap: calc(1.5rem - 7.5px);
  font: normal normal bold 18px/15px Roboto;
  &:nth-child(1) {
    padding-left: ${(props) =>
      props.content ? "1rem" : /* istanbul ignore next */ ""};
  }
  align-items: ${({ alignItems }) =>
    alignItems || /* istanbul ignore next */ "center"};
`;

export const Content = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: clamp(2rem, 100%, 22rem);
  svg {
    cursor: pointer;
  }
`;

export const WideContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: clamp(2rem, 100%, 22rem);
  svg {
    cursor: pointer;
  }

  flex-direction: column-reverse;
  align-items: flex-end;
  margin: 4px 1rem 8px;
  ${({ theme: { theme } }) =>
    theme === "elo"
      ? css`
          flex-direction: row;
          justify-content: center;
          align-items: center;
        `
      : undefined}
`;

export const Logo = styled.div<{
  content: boolean | string;
  paddingBottom?: string;
}>`
  position: ${(props) => (props.content === "true" ? "" : "absolute")};
  padding-bottom: ${({ paddingBottom }) =>
    paddingBottom || /* istanbul ignore next */ "0"};

  ${({ theme: { theme } }) =>
    theme === "elo"
      ? css`
          margin-bottom: -5px;
          padding-top: 5px;
        `
      : undefined}
`;

export const Wallet = styled.div`
  display: flex;
  justify-content: space-around;
  background-color: ${({ theme: { header } }) =>
    header?.wallet?.background || "#efefef"};
  width: 6.9rem;
  height: 2.2rem;
  color: ${({ theme: { header } }) => header?.wallet?.text || "#00000080"};
  border-radius: 5px;
  align-items: center;
  svg {
    align-self: center;
    margin-bottom: -0.25rem;
  }
  cursor: pointer;
`;

export const WalletTitle = styled.div`
  font-size: 10px;
  line-height: 13px;
`;

export const WalletContent = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 16px;
  font-weight: bold;
`;

export const Buttons = styled.div`
  display: flex;
  width: 4.4rem;
  height: 1.25rem;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  :nth-child(n + 1) {
    cursor: pointer;
  }
`;

export const DownSizedButtons = styled.div`
  display: flex;
  width: 4.4rem;
  height: 1rem;
  gap: 1rem;
  justify-content: end;
  align-items: center;
  margin-bottom: 5px;

  > * {
    cursor: pointer;
    display: flex;
    justify-content: end;
    height: 100%;
  }
`;

export const MinimizeIconWrapper = styled.div`
  ${({ theme: { theme } }) =>
    theme === "elo"
      ? css`
          display: contents;
        `
      : undefined};
`;
