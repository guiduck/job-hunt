import React, { useState } from "react";
import * as S from "./styled";

export interface AutoCompleteProps {
  padding?: string;
  width?: string;
  background?: string;
  inputDelayMs?: number;
  pressedEnterCallback?: (_: unknown) => void;
  onUserTyping?: (value: string) => void;
  onUserTyped?: (value: string) => void;
  onLoadSuggestions?: (term: string) => Promise<string[]>;
}

export const AutoComplete: React.FC<AutoCompleteProps> = ({
  padding = "10px",
  width = "100%",
  background = "#fff",
  inputDelayMs = 1000,
  pressedEnterCallback,
  onUserTyping,
  onUserTyped,
  onLoadSuggestions,
}: AutoCompleteProps) => {
  const [timer, setTimer] = useState<NodeJS.Timeout | undefined>(undefined);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [valueInput, setValueInput] = useState("");

  /* istanbul ignore next */
  const onClickSuggestion = (value: string) => {
    setFilteredSuggestions([]);
    setShowSuggestions(false);
    setValueInput(value);
    onUserTyping?.(value);
  };

  /* istanbul ignore next */
  const renderNoSuggestion = () => {
    return (
      <S.Suggestions>
        <S.NoSuggestions>
          <p>Nenhum resultado encontrado.</p>
        </S.NoSuggestions>
      </S.Suggestions>
    );
  };

  /* istanbul ignore next */
  const renderSuggestionsListComponent = () => {
    if (!showSuggestions) return undefined;

    /* istanbul ignore next */
    if (!filteredSuggestions || filteredSuggestions?.length === 0) {
      return renderNoSuggestion();
    }

    return (
      <S.Suggestions>
        {filteredSuggestions.map((term, index) => {
          return (
            <S.SuggestionsItens
              key={Math.random()}
              onClick={
                /* istanbul ignore next */ () => {
                  onClickSuggestion(term.toLowerCase());
                }
              }
              data-testid={`suggestionRule${index + 1}`}
            >
              {term}
            </S.SuggestionsItens>
          );
        })}
      </S.Suggestions>
    );
  };

  const onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowSuggestions(false);
    const userInput = e.currentTarget.value;

    setValueInput(userInput);
    onUserTyping?.(userInput);

    if (timer) {
      clearTimeout(timer);
      setTimer(undefined);
    }

    if (userInput.length >= 3) {
      const timerSet = setTimeout(
        /* istanbul ignore next */
        () => {
          onUserTyped?.(userInput);
          setShowSuggestions(true);
          onLoadSuggestions?.(userInput).then(setFilteredSuggestions);
        },
        inputDelayMs
      );

      setTimer(timerSet);
    }

    setValueInput(e.currentTarget.value);
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

      pressedEnterCallback?.(pressedEnterCallback);
    }
  };

  return (
    <S.Wrapper padding={padding} width={width}>
      <S.Content background={background}>
        <S.LabelInputSearch>
          <S.InputSearch
            type="text"
            onChange={onChangeInput}
            onChangeCapture={onChangeInput}
            onRateChange={onChangeInput}
            value={valueInput.toLowerCase()}
            placeholder="buscar marcas"
            onKeyPress={onKeyPressInput}
            data-testid="autocompleteRule"
          />
        </S.LabelInputSearch>

        {renderSuggestionsListComponent()}
      </S.Content>
    </S.Wrapper>
  );
};
