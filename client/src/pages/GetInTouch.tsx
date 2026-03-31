import ApolloSite from "./ApolloSite";

/**
 * Dedicated /get-in-touch landing page.
 * Renders the full ApolloSite shell with the contact section pre-selected.
 * Using a dedicated URL makes this page trackable for Google/Meta ad campaigns.
 */
export default function GetInTouch() {
  return <ApolloSite initialPage="contact" />;
}
