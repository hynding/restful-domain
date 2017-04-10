'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
  I make a few assumptions that will become more abstract in later versions:
  1) you're using either Express or Restify (future: Hapi)
  2) you're delivering a Mongoose model (future: sequelize)
 */
var RestfulDomain = function () {
  function RestfulDomain(_ref) {
    var server = _ref.server,
        model = _ref.model,
        name = _ref.name,
        collectionName = _ref.collectionName,
        serverModuleName = _ref.serverModuleName,
        modelModuleName = _ref.modelModuleName,
        pathSeparator = _ref.pathSeparator;

    _classCallCheck(this, RestfulDomain);

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

  _createClass(RestfulDomain, [{
    key: 'methodPath',
    value: function methodPath(methodType, getList) {
      var domainPath = [this.name, ':id'];
      switch (methodType) {
        case 'get':
          return getList ? [this.collectionName] : domainPath;
        case 'post':
          return [this.name];
        default:
          return domainPath; // expecting put, patch, del
      }
    }
  }, {
    key: 'path',
    value: function path(options) {
      var ps = this.pathSeparator;
      return '' + ps + this.methodPath(options.method, options.getList).join(ps);
    }
  }, {
    key: 'state',
    value: function state(method, name, pathOptions) {
      pathOptions = pathOptions || {};
      pathOptions.method = method;
      pathOptions.getList = !name.indexOf('list'); // method name starts with list (index:0)
      this.server[method](this.path(pathOptions), this.reply(name));
    }
  }, {
    key: 'reply',
    value: function reply(methodName) {
      var _this = this;

      return function (req, res, next) {
        _this.headers = req.headers;
        _this.params = req.params;
        _this.query = req.query;
        _this.body = req.body;
        var methodInstance = _this[methodName]();
        if (methodInstance instanceof Promise) {
          _this.defer(methodInstance, res, next);
        } else {
          _this.send(methodInstance, res, next);
        }
      };
    }
  }, {
    key: 'defer',
    value: function defer(promiseData, response, callback) {
      promiseData.then(function (data) {
        if (data instanceof Promise) {
          data.then(function (resolvedData) {
            response.send(resolvedData);
            callback();
          });
        } else {
          response.send(data);
          callback();
        }
      }).catch(function (rejection) {
        response.send(rejection.statusCode, rejection.error);
        callback();
      });
    }
  }, {
    key: 'send',
    value: function send(data, dispatcher, callback) {
      dispatcher.send(data);
      callback();
    }
  }, {
    key: 'search',
    value: function search() {
      return this.model.find(this.query);
    }
  }, {
    key: 'create',
    value: function create() {
      return this.model.create(this.body);
    }
  }, {
    key: 'read',
    value: function read() {
      return this.model.findById(this.params.id);
    }
  }, {
    key: 'update',
    value: function update() {
      return this.model.findByIdAndUpdate(this.params.id, this.body);
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      return this.model.findByIdAndRemove(this.params.id);
    }
  }]);

  return RestfulDomain;
}();

exports.default = RestfulDomain;