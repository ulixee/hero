export default interface ISessionPage {
  url: string;
  waitForElementSelector?: string; // if user should wait for something to appear
  clickElementSelector?: string;
  clickDestinationUrl?: string; // if click loads a url, this is what it will be
  isRedirect?: boolean;
}
