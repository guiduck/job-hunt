const getEndpoint = (): string => {
  /* istanbul ignore next */
  switch (process.env.REACT_APP_ENV_TYPE) {
    case "development":
    case "homolog":
      return "kuponeria.com.br";

    case "production":
    default:
      return "cuponeria.com.br";
  }
};

export default getEndpoint;
