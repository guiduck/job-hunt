import styled from "styled-components";
import { AutoCompleteProps } from ".";

export const Wrapper = styled.div<AutoCompleteProps>`
  padding: ${({ padding }) => `${padding}`};
  width: ${({ width }) => width};
  max-width: 360px;
`;

export const Content = styled.div<AutoCompleteProps>`
  background: ${({ background }) => background};
  width: 100%;
  border-radius: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

export const LabelInputSearch = styled.label`
  width: 100%;
  height: 45px;

  ::before {
    content: "";
    position: absolute;
    width: 17px;
    height: 17px;
    color: #666666;
    background: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHg9IjBweCIgeT0iMHB4Igp3aWR0aD0iNTAiIGhlaWdodD0iNTAiCnZpZXdCb3g9IjAgMCA1MCA1MCIKc3R5bGU9IiBmaWxsOiMwMDAwMDA7Ij48cGF0aCBkPSJNIDIxIDMgQyAxMS42MjI5OTggMyA0IDEwLjYyMzAwNSA0IDIwIEMgNCAyOS4zNzY5OTUgMTEuNjIyOTk4IDM3IDIxIDM3IEMgMjQuNzEyMzgzIDM3IDI4LjEzOTE1MSAzNS43OTEwNzkgMzAuOTM3NSAzMy43NjU2MjUgTCA0NC4wODU5MzggNDYuOTE0MDYyIEwgNDYuOTE0MDYyIDQ0LjA4NTkzOCBMIDMzLjg4NjcxOSAzMS4wNTg1OTQgQyAzNi40NDM1MzYgMjguMDgzIDM4IDI0LjIyMzYzMSAzOCAyMCBDIDM4IDEwLjYyMzAwNSAzMC4zNzcwMDIgMyAyMSAzIHogTSAyMSA1IEMgMjkuMjk2MTIyIDUgMzYgMTEuNzAzODgzIDM2IDIwIEMgMzYgMjguMjk2MTE3IDI5LjI5NjEyMiAzNSAyMSAzNSBDIDEyLjcwMzg3OCAzNSA2IDI4LjI5NjExNyA2IDIwIEMgNiAxMS43MDM4ODMgMTIuNzAzODc4IDUgMjEgNSB6Ij48L3BhdGg+PC9zdmc+")
      center / contain no-repeat;
    margin-top: 15px;
    margin-left: 10px;
  }
`;

export const InputSearch = styled.input`
  width: 100%;
  height: 45px;
  background: #efefef 0% 0% no-repeat padding-box;
  border-radius: 4px;
  border: none;
  padding: 5px 5px 5px 35px;
  box-sizing: border-box;
  display: flex;
  font: normal normal normal 18px/24px Roboto;
  letter-spacing: 0px;
  color: #666666;

  :focus {
    outline: none;
  }
`;

export const NoSuggestions = styled.div`
  color: #999;
  padding: 5px;
`;

export const Suggestions = styled.div`
  border: 1px solid #e5e5e5;
  border-top-width: 0;
  list-style: none;
  margin-top: 0;
  max-height: 143px;
  overflow-y: auto;
  padding-left: 0;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
`;

export const SuggestionsItens = styled.div`
  padding: 0.5rem;
  color: #000000b3;
  font: 16px / 24px Roboto;
`;
