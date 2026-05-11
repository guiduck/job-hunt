import styled from "styled-components";

interface CardCouponStyleProps {
  hover?: boolean;
  clickedDropdownIcon?: boolean;
  storeLogo?: string;
}

export const Wrapper = styled.div<CardCouponStyleProps>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding: 16px;
  background-color: #fff;
  transition: all 0.3s;
  border-radius: 8px;
  user-select: none;

  box-shadow: ${(props) =>
    props.hover
      ? /* istanbul ignore next */ "0px 3px 5px #0000001f"
      : "0px 2px 3px #0000001f"};

  cursor: ${(props) =>
    props.hover ? /* istanbul ignore next */ "pointer" : "auto"};
`;

export const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

export const StoreIconContainer = styled.div`
  display: flex;
  flex-direction: row;
  margin-bottom: 16px;
  width: 100%;
`;

export const LogoImage = styled.img<CardCouponStyleProps>`
  display: flex;
  align-self: flex-start;
  width: 22px;
  height: 22px;
  background: transparent url(${(props) => props.storeLogo}) 0% 0% no-repeat
    padding-box;
  background-position: center;
  background-size: cover;
  box-shadow: 0px 1px 2px #00000029;
  border: 0.5px solid #e3e3e3;
  border-radius: 50%;
`;

export const StoreName = styled.span`
  color: #ff0000;
  margin-left: 8px;
  font: normal normal bold 16px/24px Roboto;
  letter-spacing: 0px;
  text-transform: lowercase;
`;

export const Badges = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: left;
  align-items: center;
  width: 100%;
  gap: 6px;
`;

export const CouponDescription = styled.p`
  font: normal normal normal 16px/18px Roboto;
  font-size: 16px;
  line-height: 18px;
  color: #000000;
  text-align: left;
  letter-spacing: 0px;
  margin: 8px 0;
  width: 100%;
`;

export const CardFooter = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
`;

export const CardFooterItem = styled.small<CardCouponStyleProps>`
  z-index: 10;

  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 2px;

  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0px;
  color: #00000080;
  text-transform: lowercase;

  svg {
    margin-top: 2.4px;

    transition: all 3ms;
    transform: ${(props) =>
      props.clickedDropdownIcon === true
        ? /* istanbul ignore next */ "rotate(180deg)"
        : "rotate(0deg)"};
  }
`;

export const RulesContent = styled.p<CardCouponStyleProps>`
  display: flex;
  transition: all 6ms;

  width: 100%;
  display: ${(props) =>
    props.clickedDropdownIcon ? /* istanbul ignore next */ "block" : "none"};

  p {
    display: ${(props) =>
      props.clickedDropdownIcon ? /* istanbul ignore next */ "block" : "none"};
    transition: all 6ms;
    margin: 8px 0 0 0;

    font-size: 12px;
    line-height: 14px;

    color: #000000b3;

    letter-spacing: 0px;
  }
`;

export const ButtonWrapper = styled.div`
  width: 100%;
  margin: 12px 0 20px 0;
`;
