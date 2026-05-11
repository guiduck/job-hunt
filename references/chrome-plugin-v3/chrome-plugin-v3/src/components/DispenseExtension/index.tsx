import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import * as S from "./styled";
import { SettingsIcon } from "../Icons";

interface Props {
  onOptionClick?: (time: string, slug?: string) => void;
}

const DispenseExtension: React.FC<Props> = ({ onOptionClick }) => {
  const [query] = useSearchParams();
  const [toDisplaySubmenu, setToDisplaySubmenu] = useState(false);

  const renderSubmenu = () => {
    if (!toDisplaySubmenu) return "";
    return (
      <S.SubMenu>
        <S.SubMenuItem
          onClick={() => {
            onOptionClick?.("24hs", query.get("slug") || undefined);
          }}
        >
          Dispensar por 24h
        </S.SubMenuItem>
        <S.SubMenuItem
          onClick={() => {
            onOptionClick?.("Forever", query.get("slug") || undefined);
          }}
        >
          Dispensar neste site
        </S.SubMenuItem>
      </S.SubMenu>
    );
  };

  return (
    <S.Wrapper
      data-testid="wrapper"
      onClick={() => {
        setToDisplaySubmenu(!toDisplaySubmenu);
      }}
    >
      <SettingsIcon color="#b9b9b9" size={24} data-testid="icon" />
      {renderSubmenu()}
    </S.Wrapper>
  );
};

export default DispenseExtension;
