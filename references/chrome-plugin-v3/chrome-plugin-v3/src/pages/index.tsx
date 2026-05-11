/* istanbul ignore file */

import React, { useContext, useEffect, useState } from "react";
import { Routes, Route, HashRouter } from "react-router-dom";
import { DefaultProps } from "..";
import { Header } from "../components/Header";
import Wrapper from "../utils/Wrapper";
import Status from "./cashback/status";
import Floating from "./floating";
import Search from "./search";
import Store from "./store";
import Footer from "../components/Footer";
import Tutorial from "./tutorial";

import * as Styled from "./styled";
import {
  HomeIcon,
  QuestionIcon,
  SearchIcon,
  StoreIcon,
} from "../components/Icons";
import { Logo } from "../components/Images";
import Stores from "./stores";
import { sendMessageFromPageToBackground } from "../chrome/messaging";
import FirstScreenAfterInstall from "./firstScreenAfterInstall";
import {
  getCurrentChannel,
  getCurrentChannelFromBackground,
  redirectToLogin,
} from "../services/userService";
import { ThemeContext } from "../context/ThemeContext";
import LogoElo from "../components/Images/svg/LogoElo";
import AnalyticsService from "../services/analyticsService";
import { isUserLogged } from "../services/authenticationService";

export interface RouteConfig {
  path: string;
  element: JSX.Element;
  hasHeader: boolean;
  hasFooter: boolean;
  setRouteState?: (props: RouteConfig) => void;
  navigateTo?: (path: string) => void;
}

/**
 * Set all application routes
 *
 * @param props Default props object
 */
const getRoutesConfig = (props: DefaultProps): RouteConfig[] => {
  return [
    {
      path: "/",
      element: <Store {...props} />,
      hasHeader: true,
      hasFooter: true,
    },
    {
      path: "/cashback/status/:id",
      element: <Status {...props} />,
      hasHeader: true,
      hasFooter: false,
    },
    {
      path: "/search",
      element: <Search {...props} />,
      hasHeader: true,
      hasFooter: true,
    },
    {
      path: "/search/:term",
      element: <Search {...props} />,
      hasHeader: true,
      hasFooter: true,
    },
    {
      path: "/floating",
      element: <Floating {...props} />,
      hasHeader: false,
      hasFooter: false,
    },
    {
      path: "/store/:slug",
      element: <Store {...props} />,
      hasHeader: true,
      hasFooter: true,
    },
    {
      path: "/stores",
      element: <Stores {...props} />,
      hasHeader: true,
      hasFooter: true,
    },
    {
      path: "/tutorial",
      element: <Tutorial {...props} />,
      hasHeader: true,
      hasFooter: true,
    },
    {
      path: "/first-tutorial",
      element: <FirstScreenAfterInstall {...props} />,
      hasHeader: true,
      hasFooter: true,
    },
  ];
};

const onClose = () => {
  sendMessageFromPageToBackground({
    type: "closeWindow",
  });
};

const onMinimize = () => {
  sendMessageFromPageToBackground({
    type: "minimizeWindow",
  });
};

const onWalletClick = () => {
  Promise.all([isUserLogged(), getCurrentChannel()]).then(
    ([userLogged, channel]) => {
      const path = `/conta/extrato?channel=${channel}`;

      if (!userLogged) {
        redirectToLogin();
      } else {
        sendMessageFromPageToBackground({
          type: "redirectToSiteFromBackground",
          data: { path, mustSwitchTabs: true },
        });
      }
    }
  );
};

interface ToggleableHeaderProps {
  userBalance: string;
  isAlternativeLogo: boolean;
  routeState: RouteConfig;
}

const ToggleableHeader = ({
  userBalance,
  isAlternativeLogo,
  routeState,
}: ToggleableHeaderProps) => {
  if (!routeState?.hasHeader) {
    return null;
  }

  return (
    <Styled.WrapBar height="50px">
      <Header
        isWideLogo={isAlternativeLogo}
        hasWallet
        hasButtons
        logo={isAlternativeLogo ? LogoElo : Logo}
        logoColor="#ff0000"
        walletCredit={userBalance}
        onClose={onClose}
        onMinimize={onMinimize}
        onWalletClick={onWalletClick}
      />
    </Styled.WrapBar>
  );
};

const ToggleableFooter = ({ routeState }: { routeState: RouteConfig }) => {
  if (!routeState?.hasFooter) return null;
  const icons = [
    {
      label: "início",
      icon: HomeIcon,
      path: "/",
    },
    {
      label: "buscar",
      icon: SearchIcon,
      path: "/search",
    },
    {
      label: "lojas",
      icon: StoreIcon,
      path: "/stores",
    },
    {
      label: "como funciona?",
      icon: QuestionIcon,
      path: "/tutorial",
    },
  ];

  return (
    <Styled.WrapBar>
      <Footer icons={icons} />
    </Styled.WrapBar>
  );
};

const app: React.FC<DefaultProps> = (props) => {
  const [routeState, setRouteState] = useState<RouteConfig>({
    path: "",
    element: <div />,
    hasHeader: true,
    hasFooter: true,
  });

  const [userBalance, setUserBalance] = useState("0,00");
  const [isAlternativeLogo, setIsAlternativeLogo] = useState(false);

  const { setTheme } = useContext(ThemeContext);

  useEffect(() => {
    AnalyticsService.sendEvent(
      "onload",
      { page_path: window.location.href },
      false
    );

    getCurrentChannelFromBackground().then((channel) => {
      setIsAlternativeLogo(channel !== "cuponeria-ext");
      if (channel === "cuponeria-elo-ext") {
        setTheme("elo");
      }
    });

    sendMessageFromPageToBackground({
      type: "getUserBalance",
    }).then((balance) => {
      setUserBalance(balance as string);
    });
  }, []);

  return (
    <Styled.Wrapper>
      <HashRouter>
        <ToggleableHeader
          routeState={routeState}
          userBalance={userBalance}
          isAlternativeLogo={isAlternativeLogo}
        />
        <Routes>
          {getRoutesConfig(props).map((route) => (
            <Route
              key={`key-${route.path}`}
              path={route.path}
              element={<Wrapper {...route} setRouteState={setRouteState} />}
            />
          ))}
        </Routes>
        <ToggleableFooter routeState={routeState} />
      </HashRouter>
    </Styled.Wrapper>
  );
};

export default app;
