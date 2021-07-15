import Protocol from 'devtools-protocol';
import JavascriptDialogOpeningEvent = Protocol.Page.JavascriptDialogOpeningEvent;

export default interface IPuppetDialog extends JavascriptDialogOpeningEvent {}
