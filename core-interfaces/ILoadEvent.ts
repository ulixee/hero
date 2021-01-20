import { CommandId, ISOTimestamp } from './GenericTypes';

type EventName = string;
type Url = string;

export type ILoadEvent = [CommandId, EventName, Url, ISOTimestamp];
