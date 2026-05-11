import styled from "styled-components";

export const Wrapper = styled.div`
  top: 140px;
  right: 40px;
  display: flex;
  flex-direction: column;
  align-items: end;
  margin-top: 50px;
`;

export const Content = styled.div`
  display: flex;
  position: absolute;
  cursor: pointer;

  :hover {
    > div {
      opacity: 1;
    }
  }
`;

export const Logo = styled.img`
  width: 60px;
  height: 60px;
  box-shadow: 0px 6px 12px #00000029;
  border-radius: 50%;
`;

export const Close = styled.div`
  font-size: 12px;
  color: #ff0000;
  background: white;
  padding: 2px;
  border-radius: 50%;
  box-shadow: 0px 3px 6px #00000029;
  top: 0;
  right: 0;
  position: absolute;
  font-weight: bold;
  width: 15px;
  height: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: 0.3s;
`;

export const Counter = styled.div`
  font-size: 12px;
  color: #ff0000;
  background: white;
  padding: 2px;
  border-radius: 50%;
  box-shadow: 0px 3px 6px #00000029;
  bottom: 0;
  right: 0;
  position: absolute;
  font-weight: bold;
  width: 15px;
  height: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const PopupWrapper = styled.div`
  padding-top: 70px;
`;
