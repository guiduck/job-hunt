/* istanbul ignore file */
import { Domain } from "../services/storeService";
import { Message } from "./messaging";

/**
 * Removes the current injected iframe.
 */
const close = () => {
  const iframe = document.getElementById("cuponeria-pop");

  if (iframe) document.getElementsByTagName("body")[0].removeChild(iframe);
};

/**
 * Periodically checks if the extension is still available.
 *
 * If it's not avaliable anymore, removes the current popup.
 */
const checkForUninstall = () => {
  setInterval(() => {
    try {
      chrome.runtime.getURL("/");
    } catch {
      close();
      window?.location.reload();
    }
  }, 1000);
};

/**
 * Inject an iframe inside current website.
 *
 * @param path Application path to be called.
 */
const navigateTo = (path = "") => {
  if (document.getElementById("cuponeria-pop")) return;

  const extensionUrl = `${chrome.runtime.getURL("/index.html")}#${path}`;
  const style = (padding = "0") =>
    `display: block !important;
    width: 380px;
    height: 100vh;
    position: fixed;
    top: ${padding};
    right: ${padding};
    bottom: 0;
    z-index: 2147483647;
    color-scheme: auto;
    clip-path: inset(0px 0px 0px);
    `;

  // create a generic holder
  const holder = document.createElement("iframe");
  holder.id = "cuponeria-pop";
  holder.setAttribute("style", style("15px"));
  holder.setAttribute("frameborder", "0");
  holder.setAttribute("allow", "clipboard-write");
  document.getElementsByTagName("body")[0].appendChild(holder);

  // create a iframe to hold the content
  const iframe = document.createElement("iframe");
  iframe.id = "cuponeria-pop";
  iframe.src = extensionUrl;
  iframe.setAttribute("style", style());
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute("allow", "clipboard-write");

  // appends the main iframe inside the holder
  const holderContent = holder?.contentWindow?.document;
  holderContent?.getElementsByTagName("body")[0].appendChild(iframe);

  checkForUninstall();
};

/**
 * Resizes the current injected iframe.
 */
const resize = ({ width = "380px", height = "100vh", clipPath = "none" }) => {
  const holder = document.getElementById("cuponeria-pop") as HTMLIFrameElement;
  const content =
    holder?.contentWindow?.document.getElementById("cuponeria-pop");

  if (!holder || !content) {
    return;
  }

  holder.style.width = width;
  holder.style.height = height;
  holder.style.clipPath = clipPath;
};

const injectGoogleSnippets = (stores: Domain[]) => {
  const results = document.querySelectorAll(".g a");
  const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="Camada_1" width=24 height=24 x="0px" y="0px" viewBox="0 0 163.9 160" > <g> <circle fill="#FF0000" cx="82" cy="80" r="72.3" /> <g> <g> <g> <g> <path fill="#FAD424" d="M19.9,117.3c3.6-2.2,7.1-4.2,10.6-6.4c2.6,4.2,5.5,8,9,11.5s7.3,6.4,11.5,9c-2.2,3.6-4.2,7.1-6.4,10.6 C34.4,135.7,26.3,127.6,19.9,117.3z" /> <path fill="#FAD424" d="M44.6,17.9c2.2,3.6,4.2,7.1,6.4,10.6C42.6,33.7,35.8,40.4,30.5,49c-3.5-2.2-7.1-4.2-10.7-6.4 C26.2,32.4,34.4,24.3,44.6,17.9z" /> <path fill="#FAD424" d="M112.9,28.6c2.2-3.6,4.2-7.1,6.4-10.6c10.3,6.2,18.4,14.4,24.7,24.7c-3.6,2.2-7.1,4.2-10.6,6.4 C128.1,40.7,121.3,33.8,112.9,28.6z" /> <path fill="#FAD424" d="M112.9,131.3c11.6-8.6,11.6-8.6,20.5-20.5c3.5,2,7,4.2,10.4,6.4c-2.3,6.5-16.2,20.5-24.5,24.7 C117.1,138.4,115.1,135,112.9,131.3z" /> </g> <g> <path fill="#FAD424" d="M64.5,150.2c1-4.1,2-8,3-12c4.8,1.2,9.6,1.7,14.5,1.7c4.8,0,9.6-0.6,14.5-1.7c1,4.1,2,8,3,12 C87.7,153.1,76.2,153,64.5,150.2z" /> <path fill="#FAD424" d="M152.2,97.4c-4.1-1-8-2-12-3c1.2-4.8,1.7-9.6,1.7-14.5c0-4.8-0.6-9.6-1.7-14.5c4.1-1,8-2,12-3 C155.1,74.2,155.1,85.8,152.2,97.4z" /> <path fill="#FAD424" d="M67.5,21.8c-1-4.1-2-8-3-12c11.6-2.8,23.2-2.8,35,0c-1,4.1-2,8-3,12c-4.8-1.2-9.6-1.7-14.5-1.7 C77.2,20.1,72.4,20.5,67.5,21.8z" /> <path fill="#FAD424" d="M11.6,62.6c4.1,1,8,2,12,3c-2.3,9.7-2.3,19.3,0,28.9c-4.1,1-8,2-12,3C8.9,85.8,8.9,74.2,11.6,62.6z" /> </g> </g> <g> <path fill="#FFFFFF" d="M49.7,60.2c0-4.2,1.5-7.8,4.2-10.7s6.2-4.4,10.3-4.4s7.4,1.5,10.3,4.5c2.9,2.9,4.2,6.5,4.2,10.7 s-1.5,7.8-4.2,10.7c-2.9,2.9-6.2,4.4-10.3,4.4s-7.5-1.5-10.3-4.4C51.1,68.1,49.7,64.5,49.7,60.2z M59.4,60.2 c0,1.5,0.4,2.8,1.5,3.8c1,1,2,1.6,3.3,1.6s2.5-0.6,3.5-1.6c1-1,1.5-2.3,1.5-3.8s-0.4-2.8-1.5-3.8s-2-1.6-3.5-1.6 s-2.5,0.6-3.5,1.6C59.8,57.5,59.4,58.7,59.4,60.2z M71.4,110c-1,1.7-2.2,3.2-3.2,3.9c-1,0.9-2.2,1.3-3.5,1.3 c-1.5,0-2.8-0.4-3.8-1.6c-1-1-1.5-2.3-1.5-3.8c0-0.9,0.1-1.6,0.4-2.5c0.3-0.7,0.6-1.6,1-2.3l31.3-55.3c1.2-1.9,2.2-3.2,3.2-4.1 c1-0.7,2.2-1.2,3.5-1.2c1.6,0,2.9,0.4,3.9,1.5c1,1,1.6,2.2,1.6,3.6c0,0.7-0.1,1.5-0.4,2.2c-0.3,0.9-0.7,1.7-1.2,2.6L71.4,110z M85.2,99.4c0-4.2,1.5-7.8,4.2-10.7s6.2-4.4,10.3-4.4s7.4,1.5,10.3,4.4s4.2,6.5,4.2,10.7s-1.5,7.7-4.2,10.7 c-2.9,2.9-6.2,4.4-10.3,4.4s-7.5-1.5-10.3-4.4C86.5,107.3,85.2,103.6,85.2,99.4z M94.9,99.4c0,1.5,0.4,2.8,1.5,3.8 c1,1,2.2,1.6,3.5,1.6s2.5-0.6,3.5-1.6s1.5-2.3,1.5-3.8c0-1.6-0.4-2.8-1.5-3.9c-1-1-2-1.6-3.5-1.6c-1.3,0-2.5,0.6-3.5,1.6 S94.9,97.8,94.9,99.4z" /> </g> </g> </g> </g> </svg>`;

  let textColor = "";
  const citeElement = results[0].closest("cite");

  if (citeElement) {
    textColor = window.getComputedStyle(citeElement).color;
  }

  const cashbackTag = (cashback: string, coupons: number, slug: string) => `
    <cite>
      <a href="https://www.cuponeria.com.br/cupom-desconto/${slug}?utm_source=ext-google-search-snippet" target="_blank" style="color: ${textColor}">
        <div class="cuponeria-searchgoogle" style="display: flex; align-items: center; gap: 6px">
        ${logoSvg}
        <h3 style="padding-top: 3px; box-sizing: border-box;">
        <strong> ${cashback} de cashback</strong> e 
        <strong>${coupons} cupons</strong> na Cuponeria</h3></div>
      </a>
    </cite>
  `;

  const couponTag = (coupons: number, slug: string) => `
    <cite>
      <a href="https://www.cuponeria.com.br/cupom-desconto/${slug}?utm_source=ext-google-search-snippet" target="_blank" style="color: ${textColor}">
        <div class="cuponeria-searchgoogle" style="display: flex; align-items: center; gap: 6px">
        ${logoSvg}
        <h3 style="padding-top: 3px; box-sizing: border-box;">
        <strong>${coupons} cupons</strong> na Cuponeria</h3></div>
      </a>
    </cite>
  `;

  results.forEach((aTag) => {
    const href = aTag.getAttribute("href");

    if (!href?.includes("http")) {
      return;
    }

    const host = new URL(href || "")?.host;
    const store = stores.find((x) => x.storeUrl.includes(host));

    if (host && store) {
      const div = document.createElement("div");

      if (store.cashbackRate > 0) {
        let cashback = `${store.cashbackRate}%`.replace(".", ",");

        if (store.cashbackValueTypeRate === "F") {
          cashback = store.cashbackRate.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });
        }

        div.innerHTML = cashbackTag(cashback, store.offerCount, store.slug);
      } else {
        div.innerHTML = couponTag(store.offerCount, store.slug);
      }

      if (
        aTag.closest(".g")?.querySelectorAll(".cuponeria-searchgoogle")
          .length === 0
      ) {
        aTag.closest(".g")?.prepend(div);
      }
    }
  });
};

/**
 * Command listener for background instructions.
 *
 * @param data data payload.
 */
const onBackgroundScriptMessageListener = (
  data: Message<string | { [key: string]: number } | Domain[]>
) => {
  switch (data.type) {
    case "navigateTo":
      navigateTo(data.data as string);
      break;

    case "close":
      close();
      break;

    case "resize":
      resize(data.data as { [key: string]: number });
      break;

    case "injectGoogleSnippets":
      injectGoogleSnippets(
        (data.data as unknown as { stores: Domain[] }).stores
      );
      break;

    default:
      break;
  }
};

/**
 * Sets up a command listener.
 */
const setupContentScript = () => {
  chrome.runtime.onMessage.addListener(onBackgroundScriptMessageListener);
};

setupContentScript();

export {};
