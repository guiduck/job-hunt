import React, { useEffect, useState } from "react";
import * as S from "./styled";

export interface InputProps {
  padding?: string;
  width?: string;
  background?: string;
  placeholder?: string;
  hasIcon?: boolean;
  inputDelayMs?: number;
  defaultValue?: string;
  onUserTyped?: (value: string) => void;
  onUserTyping?: (value: string) => void;
}

export const Input: React.FC<InputProps> = ({
  padding = "10px",
  width = "100%",
  background = "#fff",
  placeholder = "buscar ofertas",
  hasIcon = true,
  inputDelayMs = 2000,
  defaultValue = "",
  onUserTyping,
  onUserTyped,
}) => {
  const [valueInput, setValueInput] = useState(defaultValue);
  const [timer, setTimer] = useState<NodeJS.Timeout | undefined>(undefined);

  const onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const userInput = e.currentTarget.value;

    setValueInput(userInput);
    onUserTyping?.(userInput);

    if (timer) {
      clearTimeout(timer);
      setTimer(undefined);
    }

    if (userInput.length >= 3) {
      const timerSet = setTimeout(() => {
        onUserTyped?.(userInput);
      }, inputDelayMs);

      setTimer(timerSet);
    }
  };

  /* istanbul ignore next */
  const onKeyPressInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (valueInput) onUserTyped?.(valueInput);

      if (timer) {
        clearTimeout(timer);
        setTimer(undefined);
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  useEffect(() => {}, [timer, valueInput]);

  return (
    <S.Wrapper padding={padding} width={width}>
      <S.Content background={background}>
        <S.LabelInputSearch hasIcon={hasIcon}>
          <S.InputSearch
            type="text"
            onChange={onChangeInput}
            value={valueInput}
            placeholder={placeholder}
            onKeyPress={onKeyPressInput}
            data-testid="input"
            hasIcon={hasIcon}
            spellCheck={false}
          />
        </S.LabelInputSearch>
      </S.Content>
    </S.Wrapper>
  );
};
