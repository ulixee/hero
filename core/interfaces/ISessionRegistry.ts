import SessionDb from '../dbs/SessionDb';

export default interface ISessionRegistry {
  defaultDir: string;
  ids(): Promise<string[]>;
  get(sessionId: string, customPath?: string): Promise<SessionDb>;
  create(sessionId: string, customPath?: string): SessionDb;
  onClosed(sessionId: string, isDeleteRequested: boolean): Promise<void>;
  shutdown(): Promise<void>
}
