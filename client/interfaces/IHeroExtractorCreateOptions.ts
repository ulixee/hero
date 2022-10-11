import Hero from "../lib/Hero";
import IHeroCreateOptions from "./IHeroCreateOptions";

export default interface IHeroExtractorCreateOptions extends IHeroCreateOptions {
  previousSessionId: string;
  hero?: Hero;
}