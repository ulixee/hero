import Protocol from "devtools-protocol";
import { IPuppetFrame } from "@secret-agent/puppet/interfaces/IPuppetFrame";

export interface IFrame extends Protocol.Page.Frame, IPuppetFrame {}
