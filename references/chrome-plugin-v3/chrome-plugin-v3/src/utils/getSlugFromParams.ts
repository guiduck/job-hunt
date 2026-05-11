import { useParams, useSearchParams } from "react-router-dom";

export const getSlugFromParams = () => {
  const { slug: paramSlug = sessionStorage.slug } = useParams();
  const [query] = useSearchParams();
  const querySlug = query.get("slug") as string;
  if (!paramSlug && querySlug) {
    sessionStorage.slug = querySlug;
  }
  const slug = paramSlug || querySlug;
  return slug;
};

export default getSlugFromParams;
