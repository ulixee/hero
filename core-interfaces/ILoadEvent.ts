import { UnixTimestamp } from './GenericTypes';

type EventName = string;
type Url = string;

export type ILoadEvent = [EventName, Url, UnixTimestamp];
