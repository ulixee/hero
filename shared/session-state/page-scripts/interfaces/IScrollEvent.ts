// tslint:disable-next-line
import { CommandId, ISOTimestamp } from './GenericTypes';

type ScrollX = number;
type ScrollY = number;

export type IScrollEvent = [CommandId, ScrollX, ScrollY, ISOTimestamp];
