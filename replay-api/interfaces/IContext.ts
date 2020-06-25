import Koa from 'koa';
import IContextValidate from './IContextValidate';

export default interface IContext extends Koa.Context {
  validate: IContextValidate;
}
