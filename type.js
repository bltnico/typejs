import { typeCheck } from 'type-check';

const TYPE_NAME_KEY = '__typeName';
const DEFAULT_OPTIONS = {
  strict: true,
  fatal: false,
};

function getTypeName(schemaType) {
  return schemaType[TYPE_NAME_KEY] || 'Type (unknow or not defined)';
}

function getOptions(options) {
  return { ...DEFAULT_OPTIONS, ...options };
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
  if (schemaKey && schemaTypeKey && elementValue) {
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
  Object.freeze({ __typeName: name, ...schema })
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
        if (typeCheck('Object', schemaType[key])) {
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
const boolean = 'Boolean';
const array = 'Array';
const func = 'Function';
const object = 'Object';
const oneOf = (...types) => types.join(' | ');
const arrayOf = (...types) => `[${oneOf(...types)}]`;
const maybe = type => `Maybe ${type}`;

export const t = {
  any,
  number,
  string,
  boolean,
  array,
  func,
  object,
  arrayOf,
  oneOf,
  maybe,
};
