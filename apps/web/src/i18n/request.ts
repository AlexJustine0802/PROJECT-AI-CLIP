import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'id', 'ja', 'zh'] as const;
export const defaultLocale = 'en';
export type Locale = (typeof locales)[number];

/** next-intl request config — loads the active locale's message catalog. */
export default getRequestConfig(async ({ locale }) => {
  const active = (locales as readonly string[]).includes(locale ?? '') ? locale! : defaultLocale;
  return {
    locale: active,
    messages: (await import(`./messages/${active}.json`)).default,
  };
});
