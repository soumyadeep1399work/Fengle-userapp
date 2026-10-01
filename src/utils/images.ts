// Wikimedia (where the seeded catalog photos are hosted) returns 403 to the
// generic "okhttp" user agent that Android's image loader sends, and serves
// multi-megabyte originals unless a thumbnail width is requested. Sending a
// descriptive user agent and a width fixes both.
//
// This is a stopgap: production photos should live on Fengle's own storage
// (e.g. S3) rather than being hotlinked from Wikimedia.
const APP_USER_AGENT = 'FengleCustomerApp/1.0 (Android; Expo)';

export function imageSource(url: string, width = 800) {
  const isWikimedia = url.includes('commons.wikimedia.org/wiki/Special:FilePath/');
  const uri = isWikimedia ? `${url}${url.includes('?') ? '&' : '?'}width=${width}` : url;
  return { uri, headers: { 'User-Agent': APP_USER_AGENT } };
}
