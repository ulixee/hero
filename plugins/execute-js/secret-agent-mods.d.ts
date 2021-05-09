// This import statement is important for all this to work, otherwise we don't extend but replace the puppeteer module definition.
// https://github.com/microsoft/TypeScript/issues/10859
import {} from '@secret-agent/client'

type RecaptchaPluginAdditions = {
  executeJs(fn: (...args: any[]) => any)
}

declare module '@secret-agent/client' {
  interface Agent extends RecaptchaPluginAdditions {}
  interface Tab extends RecaptchaPluginAdditions {}
}
