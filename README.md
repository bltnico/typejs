# :warning: WIP

## Install

`@TODO`

## Use

```javascript
import { defineType, type, typeList, typeVar } from 'typejs-pck';
```

## API

Define a new schema type

`defineType(name: String, schema: Object)`

```javascript
const UserType = defineType('UserType', {
  id: 'Number',
  username: 'String',
  email: 'Maybe String',
  premium: 'Boolean',
});
```

A schema is only an object but with an optional key `__typeName`. This key is used for error message for a better development experience.

You can do:

```javascript
const UserType = {
  __typeName: 'UserType',
  id: 'Number',
  username: 'String',
  email: 'Maybe String',
  premium: 'Boolean',
};
```

But for code flexibility, I recommend to use `defineType` API.

Check schema type

`type(schemaType: Object)(element: Object, typeOptions: Object)`

```javascript
const dummyUser = {
  id: 1,
  username: 'bltnico',
  email: 'contact@nicolasbellot.fr',
  premium: 'yes',
};

type(UserType)(dummyUser);

// [UserType] Invalid type for 'premium' (Boolean) with value: yes
```

Check variable type

`typeVar(schemaString: String)(elementString: String, typeOptions: Object)`

```javascript
typeVar('String')('bltnico');
```

Check a list

`typeList(schemaArray: Array)(elementArray: Array, typeOptions: Object)`

```javascript
function doSomething(str, bool) {
  typeList(['String', 'Boolean'])(arguments);
  // do really something
}
```

Options

* strict (default to `true`): Compare length and key name
* fatal (default to `false`): When is `true`, an error throw an exception

## Examples

**Type**

* String: `'String'`
* Number: `'Number'`
* Boolean: `'Boolean'`
* Object: `'Object'`
* Array: `'Array'`
* Null or string: `'Maybe String'`
* An array of Number: `'[Number]'`
* A string or an array: `'String | Array'`
* An array with String and Number: `'[String | Number]'`
* An array with two keys of Object type: `'(Object, Object)'`

Or use **variable type**

```javascript
import { t } from 'typejs-pck';

const {
  string,
  number,
  bool,
  object,
  array,
  arrayOf,
  oneOf,
  maybe,
} = t;
```

* String: `string`
* Number: `number`
* Boolean: `bool`
* Object: `object`
* Array: `array`
* Null or string: `maybe(string)`
* An array of Number: `arrayOf(number)`
* A string or an array: `oneOf(string, array)`
* An array with String and Number: `arrayOf(string, number)`

**Sample code**

```javascript
import { defineType, type, t } from 'type';
const {
  string,
  number,
  bool,  
  maybe,
  objectStruct,
} = t;

const PictureType = defineType('PictureType', {
  thumb: string,
  full: string,
});

const UserType = defineType('UserType', {
  id: number,
  username: string,
  email: maybe(string),
  premium: bool,
  account: objectStruct({ active: bool }),
  picture: PictureType,
});

const dummyUser = {
  id: 1,
  username: 'bltnico',
  email: 'contact@nicolasbellot.fr',
  premium: false,
  account: { 
    active: true
  },
  picture: {
    thumb: 'https://...',
    full: 'https://...',
  },
};

type(UserType)(dummyUser, { fatal: true });
```
**Don't check type in prod env**

```javascript
import { type as originalType } from 'typejs-pck';

const type = schemaType => {
  return (element, options = {}) => {
    isDevMode() && originalType(schemaType)(element, {
      fatal: true,
      strict: true,
      ...options,
    });
  };
};

type(UserType)(dummyUser);
```
