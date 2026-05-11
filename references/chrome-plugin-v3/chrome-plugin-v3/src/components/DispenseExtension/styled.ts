import styled from "styled-components";

export const Wrapper = styled.div`
  max-width: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const SubMenu = styled.ul`
  background: #fff;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 200px;
  height: 100px;
  box-shadow: 0px 6px 12px #00000029;
  border-radius: 10px;
  padding: 15px;
  margin-top: 180px;
  right: 30px;
`;

export const SubMenuItem = styled.li`
  font: normal normal normal 16px/18px Roboto;
  width: 100%;
  height: auto;
  padding: 15px 10px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  transition: 2s;
`;
