/* istanbul ignore file */

/**
 * Levenshtein algorithm implementation.
 *
 * Source: https://gist.github.com/andrei-m/982927?permalink_comment_id=2059365#gistcomment-2059365
 * and https://gist.github.com/andrei-m/982927?permalink_comment_id=4072568#gistcomment-4072568
 *
 * @param a String to be used in the comparision
 * @param backgroundService String to be used in the comparision
 */

/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
export default (a: string, b: string): number => {
  let tmp;
  if (a.length === 0) {
    return b.length;
  }
  if (b.length === 0) {
    return a.length;
  }
  if (a.length > b.length) {
    tmp = a;
    a = b;
    b = tmp;
  }

  let i;
  let j;
  let res;
  const alen = a.length;
  const blen = b.length;
  const row = Array(alen);
  for (i = 0; i <= alen; i++) {
    row[i] = i;
  }

  for (i = 1; i <= blen; i++) {
    res = i;
    for (j = 1; j <= alen; j++) {
      tmp = row[j - 1];
      row[j - 1] = res;
      res = Math.min(tmp + (b[i - 1] !== a[j - 1]), res + 1, row[j] + 1);
    }
    row[j - 1] = res; // This was the missing line
  }
  return res !== undefined ? res : Number.MAX_VALUE;
};
