export default interface IWindowOptions {
  renderingOptions?: IRenderingOption[];
}

export enum RenderingOption {
  AwaitedDOM = 'AwaitedDOM',
  JsRuntime = 'JsRuntime',
  LoadJsResources = 'LoadJsResources',
  LoadCssResources = 'LoadCssResources',
  LoadImages = 'LoadImages',
  LoadResources = 'LoadResources',
  All = 'All',
  None = 'None',
}

export type IRenderingOption = keyof typeof RenderingOption;
