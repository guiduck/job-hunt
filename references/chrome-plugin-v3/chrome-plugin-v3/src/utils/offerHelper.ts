import { OfferResult } from "../services/searchService";

export const getBadges = (
  offer: OfferResult | { [key: string]: string | number }
) => {
  const badges = [];

  if (offer.cashbackRate !== "0") {
    const value = offer.cashbackRate?.toString().replace(".", ",");

    if (offer.cashbackValueTypeRate === "P") {
      badges.push(`${value?.toString().replace(".", ",")}% de cashback`);
    } else {
      badges.push(`R$${value?.toString().replace(".", ",")} de cashback`);
    }
  }

  if (offer.badgeLabel) {
    badges.push(`${String(offer.badgeLabel).split("OFF")[0]} OFF`);
  }

  return badges;
};

export default getBadges;
