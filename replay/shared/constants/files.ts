export default class InternalServer {
  private static internalUrl = 'http://localhost:3000';

  public static get url() {
    return this.internalUrl;
  }

  public static set url(value: string) {
    if (value?.endsWith('/')) this.internalUrl = value.substr(0, value.length - 1);
    else this.internalUrl = value;
  }
}
