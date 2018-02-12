'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.t = exports.defineType = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.type = type;
exports.typeList = typeList;
exports.typeVar = typeVar;

var _typeCheck = require('type-check');

var TYPE_NAME_KEY = '__typeName';
var DEFAULT_OPTIONS = {
  strict: true,
  fatal: false
};

function getTypeName(schemaType) {
  return schemaType[TYPE_NAME_KEY] || 'Type (unknow or not defined)';
}

function getOptions(options) {
  return _extends({}, DEFAULT_OPTIONS, options);
}

function error(message, fatalMode) {
  if (fatalMode) {
    throw new TypeError(message);
  } else {
    console.warn(message);
  }
}

function typeError(schemaType, element, fatalMode) {
  var schemaKey = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;
  var schemaTypeKey = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : undefined;
  var elementValue = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : undefined;

  var message = void 0;
  if (schemaKey && schemaTypeKey && elementValue) {
    message = '[' + getTypeName(schemaType) + '] Invalid value \'' + elementValue + '\' supplied to \'' + schemaKey + '\' (' + schemaTypeKey + ')';
  } else {
    message = '[' + getTypeName(schemaType) + '] Invalid type \'' + element.toString() + '\'';
  }

  return error(message, fatalMode);
}

function lengthError(schemaType, schemaKeys, elementKeys, fatalMode) {
  var formatKeys = function formatKeys(keys) {
    return keys.filter(function (k) {
      return k !== TYPE_NAME_KEY;
    }).join(' | ');
  };
  var message = '[' + getTypeName(schemaType) + ' - Strict mode] Invalid type length\n  Element has \'' + formatKeys(elementKeys) + '\' keys but schema has \'' + formatKeys(schemaKeys) + '\' keys.';

  return error(message, fatalMode);
}

function unknowKeyerror(schemaType, elementKey, fatalMode) {
  var message = '[' + getTypeName(schemaType) + '] - Strict mode] Unknow type for key ' + elementKey;
  return error(message, fatalMode);
}

var defineType = exports.defineType = function defineType(name) {
  var schema = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return Object.freeze(_extends({ __typeName: name }, schema));
};

function type(schemaType) {
  return function (element) {
    var typeOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var options = getOptions(typeOptions);
    var typeKeys = Object.keys(schemaType);
    var elementKeys = Object.keys(element);

    if (options.strict) {
      var rawTypeKeys = typeKeys.filter(function (type) {
        return type !== TYPE_NAME_KEY;
      });
      if (rawTypeKeys.length !== elementKeys.length) {
        lengthError(schemaType, typeKeys, elementKeys, options.fatal);
      }

      elementKeys.forEach(function (key) {
        if (!rawTypeKeys.includes(key)) {
          return unknowKeyerror(schemaType, key, options.fatal);
        }
      });
    }

    elementKeys.forEach(function (key) {
      if (typeKeys.includes(key)) {
        if ((0, _typeCheck.typeCheck)('Object', schemaType[key])) {
          type(schemaType[key])(element[key], options);
        } else {
          var isValid = (0, _typeCheck.typeCheck)(schemaType[key], element[key]);
          if (!isValid) {
            typeError(schemaType, element, options.fatal, key, schemaType[key], element[key].toString());
          }
        }
      }
    });

    return true;
  };
}

function typeList(schemaArray) {
  return function () {
    var elementArray = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var typeOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var options = getOptions(typeOptions);
    var toObject = function toObject(arr) {
      return arr.reduce(function (result, item, index, array) {
        result[index] = item;
        return result;
      }, {});
    };

    var schemaType = toObject(schemaArray);
    var elementType = toObject(Array.from(elementArray));

    return type(schemaType)(elementType, options);
  };
}

function typeVar(schemaString) {
  return function (elementString) {
    var typeOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var options = getOptions(typeOptions);
    var schemaArray = [schemaString];
    var elementArray = [elementString];
    return typeList(schemaArray)(elementArray, options);
  };
}

var any = '*';
var number = 'Number';
var string = 'String';
var boolean = 'Boolean';
var array = 'Array';
var func = 'Function';
var object = 'Object';
var oneOf = function oneOf() {
  for (var _len = arguments.length, types = Array(_len), _key = 0; _key < _len; _key++) {
    types[_key] = arguments[_key];
  }

  return types.join(' | ');
};
var arrayOf = function arrayOf() {
  return '[' + oneOf.apply(undefined, arguments) + ']';
};
var maybe = function maybe(type) {
  return 'Maybe ' + type;
};

var t = exports.t = {
  any: any,
  number: number,
  string: string,
  boolean: boolean,
  array: array,
  func: func,
  object: object,
  arrayOf: arrayOf,
  oneOf: oneOf,
  maybe: maybe
};