import React from "react";
import { Icon } from "..";

const ContentCopyIcon = ({ color = "#4c4c4c", size = 16 }: Icon) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      id="content_copy_black_24dp"
      width={size}
      height={size}
      viewBox="0 0 17 17"
    >
      <path
        id="Caminho_32172"
        data-name="Caminho 32172"
        d="M0,0H17V17H0Z"
        fill="none"
      />
      <path
        id="Caminho_32173"
        data-name="Caminho 32173"
        d="M10.842,1H3.263A1.32,1.32,0,0,0,2,2.364v9.545H3.263V2.364h7.579Zm1.895,2.727H5.789A1.32,1.32,0,0,0,4.526,5.091v9.545A1.32,1.32,0,0,0,5.789,16h6.947A1.32,1.32,0,0,0,14,14.636V5.091A1.32,1.32,0,0,0,12.737,3.727Zm0,10.909H5.789V5.091h6.947Z"
        fill={color}
      />
    </svg>
  );
};

export default ContentCopyIcon;
