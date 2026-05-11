import styled from "styled-components";
import { BadgeProps } from ".";

// eslint-disable-next-line import/prefer-default-export
export const Wrapper = styled.div<BadgeProps>`
  display: flex;
  width: fit-content;
  font: normal normal bold 16px/13px Roboto;
  background-color: ${({ hover, theme }) =>
    hover ? /* istanbul ignore next */ theme.cashbackBadge : "#fff"};
  color: ${({ hover, theme }) =>
    hover ? /* istanbul ignore next */ "#fff" : theme.cashbackBadge};
  cursor: ${({ hover }) =>
    hover ? /* istanbul ignore next */ "pointer" : "auto"};
  padding: 5px 10px;
  letter-spacing: 0px;
  border: 1px solid ${({ theme }) => theme.cashbackBadge};
  border-radius: 4px;
  transition: ease-in 0.3s;
`;
