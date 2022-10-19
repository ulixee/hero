import Hero from "../lib/Hero";
import IHeroCreateOptions from "./IHeroCreateOptions";

export default interface IHeroReplayCreateOptions extends IHeroCreateOptions {
  previousSessionId: string;
  hero?: Hero;
}