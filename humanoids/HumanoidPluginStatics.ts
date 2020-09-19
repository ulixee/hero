import { HumanoidPlugin } from "./index";

export interface IHumanoidPluginStatics {
  id: string;
  new (): HumanoidPlugin;
}

// decorator for humanoid plugins. hacky way to check the class implements statics we need
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function HumanoidPluginStatics(constructor: IHumanoidPluginStatics) {}
