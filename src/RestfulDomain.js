/*
  I make a few assumptions that will become more abstract in later versions:
  1) you're using either Express or Restify (future: Hapi)
  2) you're delivering a Mongoose model (future: sequelize)
 */
export default class RestfulDomain {

  constructor({server, model, name, collectionName, serverModuleName, modelModuleName, pathSeparator}) {
    this.pathSeparator = pathSeparator || '/';
    this.server = server;
    this.serverModuleName = serverModuleName;
    this.model = model;
    this.modelModuleName = modelModuleName;
    // if you prefer plural or singular names for requests that expect an array or object, I've got you covered
    this.name = name || collectionName;
    this.collectionName = collectionName || name;
    // request objects
    this.headers = {};
    this.params = {};
    this.query = {};
    this.body = {};
  }

  methodPath(methodType, getList) {
    const domainPath = [this.name,':id'];
    switch(methodType) {
      case 'get': return getList ? [this.collectionName]: domainPath;
      case 'post': return [this.name];
      default: return domainPath; // expecting put, patch, del
    }
  }

  path(options) {
    const ps = this.pathSeparator;
    return `${ps}${this.methodPath(options.method,options.getList).join(ps)}`;
  }

  state(method, name, pathOptions) {
    pathOptions = pathOptions || {};
    pathOptions.method = method;
    pathOptions.getList = !name.indexOf('search'); // method name starts with list (index:0)
    this.server[method](this.path(pathOptions), this.reply(name));
  }

  reply(methodName) {
    return (req, res, next)=>{
      this.headers = req.headers;
      this.params = req.params;
      this.query = req.query;
      this.body = req.body;
      const methodInstance = this[methodName]();
      if (methodInstance instanceof Promise) {
        this.defer(methodInstance, res, next);
      }
      else {
        this.send(methodInstance, res, next);
      }
    }
  }

  defer(promiseData, response, callback) {
    promiseData.then((data)=>{
      if (data instanceof Promise) {
        data.then((resolvedData)=>{
          response.send(resolvedData);
          callback();
        });
      }
      else {
        response.send(data);
        callback();
      }
    }).catch((rejection)=>{
      response.send(rejection.statusCode, rejection.error);
      callback();
    });
  }

  send(data, dispatcher, callback) {
    dispatcher.send(data);
    callback();
  }

  scrud() {
    this.state('get', 'list');
    this.state('get', 'read');
    this.state('post', 'create');
    this.state('put', 'update');
    this.state('patch', 'update');
    // TODO: Currently only accepts 'del' and 'destroy' respectfully; need to map accordingly
    this.state('delete', 'delete');
  }

  search() {
    return this.model.find(this.query);
  }

  create() {
    return this.model.create(this.body);
  }

  read() {
    return this.model.findById(this.params.id);
  }

  update() {
    return this.model.findByIdAndUpdate(this.params.id, this.body);
  }

  destroy() {
    return this.model.findByIdAndRemove(this.params.id);
  }
}