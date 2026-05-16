export default interface ISessionPage {
    url: string;
    waitForElementSelector?: string;
    clickElementSelector?: string;
    clickDestinationUrl?: string;
    isRedirect?: boolean;
}
