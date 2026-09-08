import Script from "next/script";
import type { Locale } from "@/i18n/config";

/**
 * The live chat launcher.
 *
 * Crisp, on the free tier, and it was picked against four hard constraints rather than on
 * features. Paul answers from a chat application on his laptop, so a vendor whose only
 * inbox is a browser tab does not qualify: that ruled out Chatwoot cloud, HubSpot and
 * Intercom, none of which ships a current macOS client, and it ruled out routing into a
 * LINE Official Account, whose inbox app is iOS and iPadOS only. LINE also publishes no
 * embeddable website chat widget at all -- its social plugins are a Share button, an Add
 * friend button and a Like button -- so the option that looks obvious in Thailand does not
 * exist. A LINE deep-link button beside the WhatsApp one is the right shape for LINE reach,
 * and costs nothing.
 *
 * Two things about this file are load-bearing.
 *
 * **Total Privacy Mode is set in the Crisp dashboard, not here, and the site's legal
 * position depends on it.** With it off, Crisp writes a `crisp-client/*` cookie with a
 * six-month expiry on every page view, for every visitor who never touches the chat, and
 * this site needs a cookie banner it has deliberately never needed. With it on, no session
 * exists until the visitor opens the chatbox themselves, which puts it in the same place as
 * the payment provider's cookies: set because the visitor asked for something, not because
 * they arrived. The privacy policy says exactly that, and says it only when the widget is
 * configured.
 *
 * **`lazyOnload`, not `afterInteractive`.** Next's own documentation names chat plugins as
 * the canonical case for it: the script loads during browser idle after every page resource
 * has been fetched, so roughly 155KB and 300ms of third-party work stays off the critical
 * path and out of the shared bundle. `beforeInteractive` is reserved for bot detectors and
 * consent managers and would put the widget ahead of the site.
 *
 * Unset `NEXT_PUBLIC_CRISP_WEBSITE_ID` renders nothing at all, which is the state the site
 * ships in until the account exists.
 */

/** Crisp's own locale codes, which are not the site's. */
const CRISP_LOCALE: Record<Locale, string> = {
  en: "en",
  th: "th",
  zh: "zh-cn",
};

export function CrispChat({
  locale,
  websiteId,
}: {
  locale: Locale;
  websiteId: string;
}) {
  if (!websiteId) return null;

  return (
    <Script id="crisp-chat" strategy="lazyOnload">
      {`window.$crisp=[];
window.CRISP_WEBSITE_ID=${JSON.stringify(websiteId)};
window.CRISP_RUNTIME_CONFIG={locale:${JSON.stringify(CRISP_LOCALE[locale])}};
(function(){var d=document,s=d.createElement("script");
s.src="https://client.crisp.chat/l.js";s.async=1;
d.getElementsByTagName("head")[0].appendChild(s);})();`}
    </Script>
  );
}
