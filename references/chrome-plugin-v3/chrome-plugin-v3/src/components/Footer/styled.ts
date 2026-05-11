import styled from "styled-components";

interface FooterPropsStyle {
  path: string;
  currentPath: string;
}

export const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;

  background: white;
  width: 358px;

  border: 1px solid #e5e5e5;
  border-radius: 0 0 10px 10px;
`;

export const Icons = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-around;

  width: 100%;
`;

export const IconContainer = styled.div<FooterPropsStyle>`
  cursor: pointer;
  padding: 4px;

  div svg g {
    ${(props) =>
      props.currentPath === props.path ? "fill: #ff0000" : "fill: #b9b9b9"};
  }

  div span {
    ${(props) =>
      props.currentPath === props.path ? "color: #ff0000" : "color: #b9b9b9"};
  }
`;

export const IconLabel = styled.span`
  font-size: 10px;
  color: #b9b9b9;

  transition: all 0.5s;
`;

export const Svg = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  svg {
    margin: 6px 0 2px 0;
  }

  g {
    transition: all 0.5s;
  }

  :hover {
    svg g {
      fill: #ff0000;
    }

    span {
      color: #ff0000;
    }
  }
`;
