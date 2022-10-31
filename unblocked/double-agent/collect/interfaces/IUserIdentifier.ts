import UserBucket from './UserBucket';

export default interface IUserIdentifier {
  bucket: UserBucket;
  category: string;
  id: string;
  raw?: any;
  description?: string;
}
