import ApolloSite from "./ApolloSite";

/**
 * Dedicated /find-your-home landing page.
 * Renders the full ApolloSite shell with the homes inventory section pre-selected.
 * Using a dedicated URL makes this page trackable for Google/Meta ad campaigns.
 */
export default function FindYourHome() {
  return <ApolloSite initialPage="homes" />;
}
