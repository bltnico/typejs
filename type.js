import { typeCheck } from 'type-check';

const TYPE_NAME_KEY = '__typeName';
const TYPE_SCHEMA_PREFIX = '__type/';
const DEFAULT_OPTIONS = {
  strict: true,
  fatal: false,
};
const SPECIAL_TYPE = {
  EQUAL: 'equal',
  PROMISE: 'promise',
};

function getTypeName(schemaType) {
  return schemaType[TYPE_NAME_KEY] || 'Type (unknow or not defined)';
}

function getOptions(options) {
  return { ...DEFAULT_OPTIONS, ...options };
}

function getSpecialTypeSchemaKey(type) {
  return `${TYPE_SCHEMA_PREFIX}${type}`;
}

function isSpecialTypeSchemaKey(object) {
  if (!typeCheck('Object', object)) {
    return false;
  }

  return Object.keys(object).some(key => !!key.startsWith(TYPE_SCHEMA_PREFIX));
}

function getSpecialTypeSchemaKeyName(object) {
  const keys = Object.keys(object)[0];
  return keys ? keys.split('/')[1] : null;
}

function checkSpecialTypeSchema(schemaType, element, options, key) {
  switch (getSpecialTypeSchemaKeyName(schemaType[key])) {
    case SPECIAL_TYPE.EQUAL:
      const list = schemaType[key][getSpecialTypeSchemaKey(SPECIAL_TYPE.EQUAL)];
      if (!list.includes(element[key])) {
        return typeError(schemaType, element, options.fatal, key, 'Type/Equal', element[key].toString());
      }
    break;
    case SPECIAL_TYPE.PROMISE:
      const isPromise = Promise.resolve(element[key]) === element[key];
      if (!isPromise) {
        return typeError(schemaType, element, options.fatal, key, 'Type/Promise', '');
      }
    break;
    default:
      return true;
  }
}

function error(message, fatalMode) {
  if (fatalMode) {
    throw new TypeError(message);
  } else {
    console.warn(message);
  }
}

function typeError(
  schemaType,
  element,
  fatalMode,
  schemaKey = undefined,
  schemaTypeKey = undefined,
  elementValue = undefined
) {
  let message;
  if (schemaKey !== undefined && schemaTypeKey !== undefined && elementValue !== undefined) {
    message = `[${getTypeName(schemaType)}] Invalid value '${elementValue}' supplied to '${schemaKey}' (${schemaTypeKey})`;
  } else {
    message = `[${getTypeName(schemaType)}] Invalid type '${element.toString()}'`;
  }

  return error(message, fatalMode);
}

function lengthError(schemaType, schemaKeys, elementKeys, fatalMode) {
  const formatKeys = keys => keys.filter(k => k !== TYPE_NAME_KEY).join(' | ');
  const message = `[${getTypeName(schemaType)} - Strict mode] Invalid type length
  Element has '${formatKeys(elementKeys)}' keys but schema has '${formatKeys(schemaKeys)}' keys.`;

  return error(message, fatalMode);
}

function unknowKeyerror(schemaType, elementKey, fatalMode) {
  const message = `[${getTypeName(schemaType)}] - Strict mode] Unknow type for key ${elementKey}`;
  return error(message, fatalMode);
}

export const defineType = (name, schema = {}) => (
  Object.freeze({ [TYPE_NAME_KEY]: name, ...schema })
);

export function type(schemaType) {
  return (element, typeOptions = {}) => {
    const options = getOptions(typeOptions);
    const typeKeys = Object.keys(schemaType);
    const elementKeys = Object.keys(element);

    if (options.strict) {
      const rawTypeKeys = typeKeys.filter(type => type !== TYPE_NAME_KEY);
      if (rawTypeKeys.length !== elementKeys.length) {
        lengthError(schemaType, typeKeys, elementKeys, options.fatal);
      }

      elementKeys.forEach(key => {
        if (!rawTypeKeys.includes(key)) {
          return unknowKeyerror(schemaType, key, options.fatal);
        }
      });
    }

    elementKeys.forEach(key => {
      if (typeKeys.includes(key)) {
        if (isSpecialTypeSchemaKey(schemaType[key])) {
          checkSpecialTypeSchema(schemaType, element, options, key);
        } else if (typeCheck('Object', schemaType[key])) {
          type(schemaType[key])(element[key], options);
        } else {
          const isValid = typeCheck(schemaType[key], element[key]);
          if (!isValid) {
            typeError(
              schemaType,
              element,
              options.fatal,
              key,
              schemaType[key],
              element[key].toString()
            );
          }
        }
      }
    });

    return true;
  };
}

export function typeList(schemaArray) {
  return (elementArray = [], typeOptions = {}) => {
    const options = getOptions(typeOptions);
    const toObject = arr => {
      return arr.reduce((result, item, index, array) => {
        result[index] = item;
        return result;
      }, {})
    };

    const schemaType = toObject(schemaArray);
    const elementType = toObject(Array.from(elementArray));

    return type(schemaType)(elementType, options);
  }
}

export function typeVar(schemaString) {
  return (elementString, typeOptions = {}) => {
    const options = getOptions(typeOptions);
    const schemaArray = [schemaString];
    const elementArray = [elementString];
    return typeList(schemaArray)(elementArray, options);
  }
}

const any = '*';
const number = 'Number';
const string = 'String';
const date = 'Date';
const bool = 'Boolean';
const array = 'Array';
const func = 'Function';
const object = 'Object';
const promise = { [getSpecialTypeSchemaKey(SPECIAL_TYPE.PROMISE)]: true };
const maybe = type => `Maybe ${type}`;
const equal = (...args) => ({ [getSpecialTypeSchemaKey(SPECIAL_TYPE.EQUAL)]: args });
const oneOf = (...types) => types.join(' | ');
const arrayOf = (...types) => `[${oneOf(...types)}]`;
const objectStruct = (childObject = {}) => ({
  [TYPE_NAME_KEY]: childObject[TYPE_NAME_KEY] || 'Type/objectStruct', ...childObject
});

export const t = {
  any,
  number,
  string,
  date,
  bool,
  array,
  func,
  object,
  promise,
  maybe,
  equal,
  arrayOf,
  oneOf,
  objectStruct,
};
