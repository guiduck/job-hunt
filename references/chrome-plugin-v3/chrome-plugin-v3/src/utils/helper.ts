export const getEllapsedDays = (date: string) => {
  const lastDateVerified = new Date(Date.parse(date));
  const currentDate = new Date();

  const lastVerification = Date.UTC(
    lastDateVerified.getFullYear(),
    lastDateVerified.getMonth(),
    lastDateVerified.getDate()
  );

  const current = Date.UTC(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate()
  );

  const day = 1000 * 60 * 60 * 24;

  return Math.abs((lastVerification - current) / day);
};

/**
 * Convert number to currency
 *
 * @param value Number to be converted
 * @param mode Type of conversion
 * @returns string
 */
/* istanbul ignore next */
export const convertNumberToCurrency = (
  value: number,
  mode: "WITHOUT_SIGN" | "WITH_SIGN"
) => {
  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  if (mode === "WITHOUT_SIGN") {
    const { maximumFractionDigits } = currencyFormatter.resolvedOptions();

    return value.toLocaleString("pt-BR", {
      maximumFractionDigits,
      minimumFractionDigits: maximumFractionDigits,
    });
  }

  return currencyFormatter.format(value);
};

export default {};
