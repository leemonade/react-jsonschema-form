function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import toPath from "lodash/toPath";
import Ajv from "ajv";
var ajv = createAjvInstance();
import _isEmpty from "lodash/isEmpty";
import { deepEquals, getDefaultFormState } from "./utils";
var formerCustomFormats = null;
var formerMetaSchema = null;
var ROOT_SCHEMA_PREFIX = "__rjsf_rootSchema";
import { isObject, mergeObjects } from "./utils";

function createAjvInstance() {
  var ajv = new Ajv({
    errorDataPath: "property",
    allErrors: true,
    multipleOfPrecision: 8,
    schemaId: "auto",
    unknownFormats: "ignore"
  }); // add custom formats

  ajv.addFormat("data-url", /^data:([a-z]+\/[a-z0-9-+.]+)?;(?:name=(.*);)?base64,(.*)$/);
  ajv.addFormat("color", /^(#?([0-9A-Fa-f]{3}){1,2}\b|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|(rgb\(\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\)))$/);
  return ajv;
}

function toErrorSchema(errors) {
  // Transforms a ajv validation errors list:
  // [
  //   {property: ".level1.level2[2].level3", message: "err a"},
  //   {property: ".level1.level2[2].level3", message: "err b"},
  //   {property: ".level1.level2[4].level3", message: "err b"},
  // ]
  // Into an error tree:
  // {
  //   level1: {
  //     level2: {
  //       2: {level3: {errors: ["err a", "err b"]}},
  //       4: {level3: {errors: ["err b"]}},
  //     }
  //   }
  // };
  if (!errors.length) {
    return {};
  }

  return errors.reduce(function (errorSchema, error) {
    var property = error.property,
        message = error.message;
    var path = toPath(property);
    var parent = errorSchema; // If the property is at the root (.level1) then toPath creates
    // an empty array element at the first index. Remove it.

    if (path.length > 0 && path[0] === "") {
      path.splice(0, 1);
    }

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = path.slice(0)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var segment = _step.value;

        if (!(segment in parent)) {
          parent[segment] = {};
        }

        parent = parent[segment];
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    if (Array.isArray(parent.__errors)) {
      // We store the list of errors for this node in a property named __errors
      // to avoid name collision with a possible sub schema field named
      // "errors" (see `validate.createErrorHandler`).
      parent.__errors = parent.__errors.concat(message);
    } else {
      if (message) {
        parent.__errors = [message];
      }
    }

    return errorSchema;
  }, {});
}

export function toErrorList(errorSchema) {
  var fieldName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "root";
  // XXX: We should transform fieldName as a full field path string.
  var errorList = [];

  if ("__errors" in errorSchema) {
    errorList = errorList.concat(errorSchema.__errors.map(function (stack) {
      return {
        stack: "".concat(fieldName, ": ").concat(stack)
      };
    }));
  }

  return Object.keys(errorSchema).reduce(function (acc, key) {
    if (key !== "__errors") {
      acc = acc.concat(toErrorList(errorSchema[key], key));
    }

    return acc;
  }, errorList);
}

function createErrorHandler(formData) {
  var handler = {
    // We store the list of errors for this node in a property named __errors
    // to avoid name collision with a possible sub schema field named
    // "errors" (see `utils.toErrorSchema`).
    __errors: [],
    addError: function addError(message) {
      this.__errors.push(message);
    }
  };

  if (isObject(formData)) {
    return Object.keys(formData).reduce(function (acc, key) {
      return _objectSpread({}, acc, _defineProperty({}, key, createErrorHandler(formData[key])));
    }, handler);
  }

  if (Array.isArray(formData)) {
    return formData.reduce(function (acc, value, key) {
      return _objectSpread({}, acc, _defineProperty({}, key, createErrorHandler(value)));
    }, handler);
  }

  return handler;
}

function unwrapErrorHandler(errorHandler) {
  return Object.keys(errorHandler).reduce(function (acc, key) {
    if (key === "addError") {
      return acc;
    } else if (key === "__errors") {
      return _objectSpread({}, acc, _defineProperty({}, key, errorHandler[key]));
    }

    return _objectSpread({}, acc, _defineProperty({}, key, unwrapErrorHandler(errorHandler[key])));
  }, {});
}
/**
 * Transforming the error output from ajv to format used by jsonschema.
 * At some point, components should be updated to support ajv.
 */


function transformAjvErrors() {
  var errors = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

  if (errors === null) {
    return [];
  }

  return errors.map(function (e) {
    var dataPath = e.dataPath,
        keyword = e.keyword,
        message = e.message,
        params = e.params,
        schemaPath = e.schemaPath;
    var property = "".concat(dataPath); // put data in expected format

    return {
      name: keyword,
      property: property,
      message: message,
      params: params,
      // specific to ajv
      stack: "".concat(property, " ").concat(message).trim(),
      schemaPath: schemaPath
    };
  });
}
/**
 * This function processes the formData with a user `validate` contributed
 * function, which receives the form data and an `errorHandler` object that
 * will be used to add custom validation errors for each field.
 */


export default function validateFormData(formData, schema, customValidate, transformErrors) {
  var additionalMetaSchemas = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];
  var customFormats = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
  var validateSchema = arguments.length > 6 ? arguments[6] : undefined;

  var _transformAjvErrors = arguments.length > 7 ? arguments[7] : undefined;

  if (!_isEmpty(validateSchema)) {
    schema = validateSchema;
  } // Include form data with undefined values, which is required for validation.


  var rootSchema = schema;
  formData = getDefaultFormState(schema, formData, rootSchema, true);
  var newMetaSchemas = !deepEquals(formerMetaSchema, additionalMetaSchemas);
  var newFormats = !deepEquals(formerCustomFormats, customFormats);

  if (newMetaSchemas || newFormats) {
    ajv = createAjvInstance();
  } // add more schemas to validate against


  if (additionalMetaSchemas && newMetaSchemas && Array.isArray(additionalMetaSchemas)) {
    ajv.addMetaSchema(additionalMetaSchemas);
    formerMetaSchema = additionalMetaSchemas;
  } // add more custom formats to validate against


  if (customFormats && newFormats && isObject(customFormats)) {
    Object.keys(customFormats).forEach(function (formatName) {
      ajv.addFormat(formatName, customFormats[formatName]);
    });
    formerCustomFormats = customFormats;
  }

  var validationError = null;
  console.log(schema, formData);

  try {
    ajv.validate(schema, formData);
  } catch (err) {
    validationError = err;
  }

  console.log(ajv.errors);
  var errors = [];

  if (typeof _transformAjvErrors === 'function') {
    errors = _transformAjvErrors(ajv.errors, schema);
  } else {
    errors = transformAjvErrors(ajv.errors);
  } // Clear errors to prevent persistent errors, see #1104


  ajv.errors = null;
  var noProperMetaSchema = validationError && validationError.message && typeof validationError.message === "string" && validationError.message.includes("no schema with key or ref ");

  if (noProperMetaSchema) {
    errors = [].concat(_toConsumableArray(errors), [{
      stack: validationError.message
    }]);
  }

  if (typeof transformErrors === "function") {
    errors = transformErrors(errors);
  }

  var errorSchema = toErrorSchema(errors);

  if (noProperMetaSchema) {
    errorSchema = _objectSpread({}, errorSchema, {
      $schema: {
        __errors: [validationError.message]
      }
    });
  }

  if (typeof customValidate !== "function") {
    return {
      errors: errors,
      errorSchema: errorSchema
    };
  }

  var errorHandler = customValidate(formData, createErrorHandler(formData));
  var userErrorSchema = unwrapErrorHandler(errorHandler);
  var newErrorSchema = mergeObjects(errorSchema, userErrorSchema, true); // XXX: The errors list produced is not fully compliant with the format
  // exposed by the jsonschema lib, which contains full field paths and other
  // properties.

  var newErrors = toErrorList(newErrorSchema);
  return {
    errors: newErrors,
    errorSchema: newErrorSchema
  };
}
/**
 * Recursively prefixes all $ref's in a schema with `ROOT_SCHEMA_PREFIX`
 * This is used in isValid to make references to the rootSchema
 */

export function withIdRefPrefix(schemaNode) {
  var obj = schemaNode;

  if (schemaNode.constructor === Object) {
    obj = _objectSpread({}, schemaNode);

    for (var key in obj) {
      var value = obj[key];

      if (key === "$ref" && typeof value === "string" && value.startsWith("#")) {
        obj[key] = ROOT_SCHEMA_PREFIX + value;
      } else {
        obj[key] = withIdRefPrefix(value);
      }
    }
  } else if (Array.isArray(schemaNode)) {
    obj = _toConsumableArray(schemaNode);

    for (var i = 0; i < obj.length; i++) {
      obj[i] = withIdRefPrefix(obj[i]);
    }
  }

  return obj;
}
/**
 * Validates data against a schema, returning true if the data is valid, or
 * false otherwise. If the schema is invalid, then this function will return
 * false.
 */

export function isValid(schema, data, rootSchema) {
  try {
    // add the rootSchema ROOT_SCHEMA_PREFIX as id.
    // then rewrite the schema ref's to point to the rootSchema
    // this accounts for the case where schema have references to models
    // that lives in the rootSchema but not in the schema in question.
    return ajv.addSchema(rootSchema, ROOT_SCHEMA_PREFIX).validate(withIdRefPrefix(schema), data);
  } catch (e) {
    return false;
  } finally {
    // make sure we remove the rootSchema from the global ajv instance
    ajv.removeSchema(ROOT_SCHEMA_PREFIX);
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy92YWxpZGF0ZS5qcyJdLCJuYW1lcyI6WyJ0b1BhdGgiLCJBanYiLCJhanYiLCJjcmVhdGVBanZJbnN0YW5jZSIsIl9pc0VtcHR5IiwiZGVlcEVxdWFscyIsImdldERlZmF1bHRGb3JtU3RhdGUiLCJmb3JtZXJDdXN0b21Gb3JtYXRzIiwiZm9ybWVyTWV0YVNjaGVtYSIsIlJPT1RfU0NIRU1BX1BSRUZJWCIsImlzT2JqZWN0IiwibWVyZ2VPYmplY3RzIiwiZXJyb3JEYXRhUGF0aCIsImFsbEVycm9ycyIsIm11bHRpcGxlT2ZQcmVjaXNpb24iLCJzY2hlbWFJZCIsInVua25vd25Gb3JtYXRzIiwiYWRkRm9ybWF0IiwidG9FcnJvclNjaGVtYSIsImVycm9ycyIsImxlbmd0aCIsInJlZHVjZSIsImVycm9yU2NoZW1hIiwiZXJyb3IiLCJwcm9wZXJ0eSIsIm1lc3NhZ2UiLCJwYXRoIiwicGFyZW50Iiwic3BsaWNlIiwic2xpY2UiLCJzZWdtZW50IiwiQXJyYXkiLCJpc0FycmF5IiwiX19lcnJvcnMiLCJjb25jYXQiLCJ0b0Vycm9yTGlzdCIsImZpZWxkTmFtZSIsImVycm9yTGlzdCIsIm1hcCIsInN0YWNrIiwiT2JqZWN0Iiwia2V5cyIsImFjYyIsImtleSIsImNyZWF0ZUVycm9ySGFuZGxlciIsImZvcm1EYXRhIiwiaGFuZGxlciIsImFkZEVycm9yIiwicHVzaCIsInZhbHVlIiwidW53cmFwRXJyb3JIYW5kbGVyIiwiZXJyb3JIYW5kbGVyIiwidHJhbnNmb3JtQWp2RXJyb3JzIiwiZSIsImRhdGFQYXRoIiwia2V5d29yZCIsInBhcmFtcyIsInNjaGVtYVBhdGgiLCJuYW1lIiwidHJpbSIsInZhbGlkYXRlRm9ybURhdGEiLCJzY2hlbWEiLCJjdXN0b21WYWxpZGF0ZSIsInRyYW5zZm9ybUVycm9ycyIsImFkZGl0aW9uYWxNZXRhU2NoZW1hcyIsImN1c3RvbUZvcm1hdHMiLCJ2YWxpZGF0ZVNjaGVtYSIsIl90cmFuc2Zvcm1BanZFcnJvcnMiLCJyb290U2NoZW1hIiwibmV3TWV0YVNjaGVtYXMiLCJuZXdGb3JtYXRzIiwiYWRkTWV0YVNjaGVtYSIsImZvckVhY2giLCJmb3JtYXROYW1lIiwidmFsaWRhdGlvbkVycm9yIiwiY29uc29sZSIsImxvZyIsInZhbGlkYXRlIiwiZXJyIiwibm9Qcm9wZXJNZXRhU2NoZW1hIiwiaW5jbHVkZXMiLCIkc2NoZW1hIiwidXNlckVycm9yU2NoZW1hIiwibmV3RXJyb3JTY2hlbWEiLCJuZXdFcnJvcnMiLCJ3aXRoSWRSZWZQcmVmaXgiLCJzY2hlbWFOb2RlIiwib2JqIiwiY29uc3RydWN0b3IiLCJzdGFydHNXaXRoIiwiaSIsImlzVmFsaWQiLCJkYXRhIiwiYWRkU2NoZW1hIiwicmVtb3ZlU2NoZW1hIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxPQUFPQSxNQUFQLE1BQW1CLGVBQW5CO0FBQ0EsT0FBT0MsR0FBUCxNQUFnQixLQUFoQjtBQUNBLElBQUlDLEdBQUcsR0FBR0MsaUJBQWlCLEVBQTNCO0FBQ0EsT0FBT0MsUUFBUCxNQUFxQixnQkFBckI7QUFDQSxTQUFTQyxVQUFULEVBQXFCQyxtQkFBckIsUUFBZ0QsU0FBaEQ7QUFFQSxJQUFJQyxtQkFBbUIsR0FBRyxJQUExQjtBQUNBLElBQUlDLGdCQUFnQixHQUFHLElBQXZCO0FBQ0EsSUFBTUMsa0JBQWtCLEdBQUcsbUJBQTNCO0FBRUEsU0FBU0MsUUFBVCxFQUFtQkMsWUFBbkIsUUFBdUMsU0FBdkM7O0FBRUEsU0FBU1IsaUJBQVQsR0FBNkI7QUFDM0IsTUFBTUQsR0FBRyxHQUFHLElBQUlELEdBQUosQ0FBUTtBQUNsQlcsSUFBQUEsYUFBYSxFQUFFLFVBREc7QUFFbEJDLElBQUFBLFNBQVMsRUFBRSxJQUZPO0FBR2xCQyxJQUFBQSxtQkFBbUIsRUFBRSxDQUhIO0FBSWxCQyxJQUFBQSxRQUFRLEVBQUUsTUFKUTtBQUtsQkMsSUFBQUEsY0FBYyxFQUFFO0FBTEUsR0FBUixDQUFaLENBRDJCLENBUzNCOztBQUNBZCxFQUFBQSxHQUFHLENBQUNlLFNBQUos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QUQsQ0FGcEIsRUFFOEIrQixJQUY5QixDQUFQO0FBR0QsR0FSRCxDQVFFLE9BQU92QyxDQUFQLEVBQVU7QUFDVixXQUFPLEtBQVA7QUFDRCxHQVZELFNBVVU7QUFDUjtBQUNBbkQsSUFBQUEsR0FBRyxDQUFDNEYsWUFBSixDQUFpQnJGLGtCQUFqQjtBQUNEO0FBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdG9QYXRoIGZyb20gXCJsb2Rhc2gvdG9QYXRoXCI7XG5pbXBvcnQgQWp2IGZyb20gXCJhanZcIjtcbmxldCBhanYgPSBjcmVhdGVBanZJbnN0YW5jZSgpO1xuaW1wb3J0IF9pc0VtcHR5IGZyb20gXCJsb2Rhc2gvaXNFbXB0eVwiO1xuaW1wb3J0IHsgZGVlcEVxdWFscywgZ2V0RGVmYXVsdEZvcm1TdGF0ZSB9IGZyb20gXCIuL3V0aWxzXCI7XG5cbmxldCBmb3JtZXJDdXN0b21Gb3JtYXRzID0gbnVsbDtcbmxldCBmb3JtZXJNZXRhU2NoZW1hID0gbnVsbDtcbmNvbnN0IFJPT1RfU0NIRU1BX1BSRUZJWCA9IFwiX19yanNmX3Jvb3RTY2hlbWFcIjtcblxuaW1wb3J0IHsgaXNPYmplY3QsIG1lcmdlT2JqZWN0cyB9IGZyb20gXCIuL3V0aWxzXCI7XG5cbmZ1bmN0aW9uIGNyZWF0ZUFqdkluc3RhbmNlKCkge1xuICBjb25zdCBhanYgPSBuZXcgQWp2KHtcbiAgICBlcnJvckRhdGFQYXRoOiBcInByb3BlcnR5XCIsXG4gICAgYWxsRXJyb3JzOiB0cnVlLFxuICAgIG11bHRpcGxlT2ZQcmVjaXNpb246IDgsXG4gICAgc2NoZW1hSWQ6IFwiYXV0b1wiLFxuICAgIHVua25vd25Gb3JtYXRzOiBcImlnbm9yZVwiLFxuICB9KTtcblxuICAvLyBhZGQgY3VzdG9tIGZvcm1hdHNcbiAgYWp2LmFkZEZvcm1hdChcbiAgICBcImRhdGEtdXJsXCIsXG4gICAgL15kYXRhOihbYS16XStcXC9bYS16MC05LSsuXSspPzsoPzpuYW1lPSguKik7KT9iYXNlNjQsKC4qKSQvXG4gICk7XG4gIGFqdi5hZGRGb3JtYXQoXG4gICAgXCJjb2xvclwiLFxuICAgIC9eKCM/KFswLTlBLUZhLWZdezN9KXsxLDJ9XFxifGFxdWF8YmxhY2t8Ymx1ZXxmdWNoc2lhfGdyYXl8Z3JlZW58bGltZXxtYXJvb258bmF2eXxvbGl2ZXxvcmFuZ2V8cHVycGxlfHJlZHxzaWx2ZXJ8dGVhbHx3aGl0ZXx5ZWxsb3d8KHJnYlxcKFxccypcXGIoWzAtOV18WzEtOV1bMC05XXwxWzAtOV1bMC05XXwyWzAtNF1bMC05XXwyNVswLTVdKVxcYlxccyosXFxzKlxcYihbMC05XXxbMS05XVswLTldfDFbMC05XVswLTldfDJbMC00XVswLTldfDI1WzAtNV0pXFxiXFxzKixcXHMqXFxiKFswLTldfFsxLTldWzAtOV18MVswLTldWzAtOV18MlswLTRdWzAtOV18MjVbMC01XSlcXGJcXHMqXFwpKXwocmdiXFwoXFxzKihcXGQ/XFxkJXwxMDAlKStcXHMqLFxccyooXFxkP1xcZCV8MTAwJSkrXFxzKixcXHMqKFxcZD9cXGQlfDEwMCUpK1xccypcXCkpKSQvXG4gICk7XG4gIHJldHVybiBhanY7XG59XG5cbmZ1bmN0aW9uIHRvRXJyb3JTY2hlbWEoZXJyb3JzKSB7XG4gIC8vIFRyYW5zZm9ybXMgYSBhanYgdmFsaWRhdGlvbiBlcnJvcnMgbGlzdDpcbiAgLy8gW1xuICAvLyAgIHtwcm9wZXJ0eTogXCIubGV2ZWwxLmxldmVsMlsyXS5sZXZlbDNcIiwgbWVzc2FnZTogXCJlcnIgYVwifSxcbiAgLy8gICB7cHJvcGVydHk6IFwiLmxldmVsMS5sZXZlbDJbMl0ubGV2ZWwzXCIsIG1lc3NhZ2U6IFwiZXJyIGJcIn0sXG4gIC8vICAge3Byb3BlcnR5OiBcIi5sZXZlbDEubGV2ZWwyWzRdLmxldmVsM1wiLCBtZXNzYWdlOiBcImVyciBiXCJ9LFxuICAvLyBdXG4gIC8vIEludG8gYW4gZXJyb3IgdHJlZTpcbiAgLy8ge1xuICAvLyAgIGxldmVsMToge1xuICAvLyAgICAgbGV2ZWwyOiB7XG4gIC8vICAgICAgIDI6IHtsZXZlbDM6IHtlcnJvcnM6IFtcImVyciBhXCIsIFwiZXJyIGJcIl19fSxcbiAgLy8gICAgICAgNDoge2xldmVsMzoge2Vycm9yczogW1wiZXJyIGJcIl19fSxcbiAgLy8gICAgIH1cbiAgLy8gICB9XG4gIC8vIH07XG4gIGlmICghZXJyb3JzLmxlbmd0aCkge1xuICAgIHJldHVybiB7fTtcbiAgfVxuICByZXR1cm4gZXJyb3JzLnJlZHVjZSgoZXJyb3JTY2hlbWEsIGVycm9yKSA9PiB7XG4gICAgY29uc3QgeyBwcm9wZXJ0eSwgbWVzc2FnZSB9ID0gZXJyb3I7XG4gICAgY29uc3QgcGF0aCA9IHRvUGF0aChwcm9wZXJ0eSk7XG4gICAgbGV0IHBhcmVudCA9IGVycm9yU2NoZW1hO1xuXG4gICAgLy8gSWYgdGhlIHByb3BlcnR5IGlzIGF0IHRoZSByb290ICgubGV2ZWwxKSB0aGVuIHRvUGF0aCBjcmVhdGVzXG4gICAgLy8gYW4gZW1wdHkgYXJyYXkgZWxlbWVudCBhdCB0aGUgZmlyc3QgaW5kZXguIFJlbW92ZSBpdC5cbiAgICBpZiAocGF0aC5sZW5ndGggPiAwICYmIHBhdGhbMF0gPT09IFwiXCIpIHtcbiAgICAgIHBhdGguc3BsaWNlKDAsIDEpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3Qgc2VnbWVudCBvZiBwYXRoLnNsaWNlKDApKSB7XG4gICAgICBpZiAoIShzZWdtZW50IGluIHBhcmVudCkpIHtcbiAgICAgICAgcGFyZW50W3NlZ21lbnRdID0ge307XG4gICAgICB9XG4gICAgICBwYXJlbnQgPSBwYXJlbnRbc2VnbWVudF07XG4gICAgfVxuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkocGFyZW50Ll9fZXJyb3JzKSkge1xuICAgICAgLy8gV2Ugc3RvcmUgdGhlIGxpc3Qgb2YgZXJyb3JzIGZvciB0aGlzIG5vZGUgaW4gYSBwcm9wZXJ0eSBuYW1lZCBfX2Vycm9yc1xuICAgICAgLy8gdG8gYXZvaWQgbmFtZSBjb2xsaXNpb24gd2l0aCBhIHBvc3NpYmxlIHN1YiBzY2hlbWEgZmllbGQgbmFtZWRcbiAgICAgIC8vIFwiZXJyb3JzXCIgKHNlZSBgdmFsaWRhdGUuY3JlYXRlRXJyb3JIYW5kbGVyYCkuXG4gICAgICBwYXJlbnQuX19lcnJvcnMgPSBwYXJlbnQuX19lcnJvcnMuY29uY2F0KG1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobWVzc2FnZSkge1xuICAgICAgICBwYXJlbnQuX19lcnJvcnMgPSBbbWVzc2FnZV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlcnJvclNjaGVtYTtcbiAgfSwge30pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9FcnJvckxpc3QoZXJyb3JTY2hlbWEsIGZpZWxkTmFtZSA9IFwicm9vdFwiKSB7XG4gIC8vIFhYWDogV2Ugc2hvdWxkIHRyYW5zZm9ybSBmaWVsZE5hbWUgYXMgYSBmdWxsIGZpZWxkIHBhdGggc3RyaW5nLlxuICBsZXQgZXJyb3JMaXN0ID0gW107XG4gIGlmIChcIl9fZXJyb3JzXCIgaW4gZXJyb3JTY2hlbWEpIHtcbiAgICBlcnJvckxpc3QgPSBlcnJvckxpc3QuY29uY2F0KFxuICAgICAgZXJyb3JTY2hlbWEuX19lcnJvcnMubWFwKHN0YWNrID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdGFjazogYCR7ZmllbGROYW1lfTogJHtzdGFja31gLFxuICAgICAgICB9O1xuICAgICAgfSlcbiAgICApO1xuICB9XG4gIHJldHVybiBPYmplY3Qua2V5cyhlcnJvclNjaGVtYSkucmVkdWNlKChhY2MsIGtleSkgPT4ge1xuICAgIGlmIChrZXkgIT09IFwiX19lcnJvcnNcIikge1xuICAgICAgYWNjID0gYWNjLmNvbmNhdCh0b0Vycm9yTGlzdChlcnJvclNjaGVtYVtrZXldLCBrZXkpKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjYztcbiAgfSwgZXJyb3JMaXN0KTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlRXJyb3JIYW5kbGVyKGZvcm1EYXRhKSB7XG4gIGNvbnN0IGhhbmRsZXIgPSB7XG4gICAgLy8gV2Ugc3RvcmUgdGhlIGxpc3Qgb2YgZXJyb3JzIGZvciB0aGlzIG5vZGUgaW4gYSBwcm9wZXJ0eSBuYW1lZCBfX2Vycm9yc1xuICAgIC8vIHRvIGF2b2lkIG5hbWUgY29sbGlzaW9uIHdpdGggYSBwb3NzaWJsZSBzdWIgc2NoZW1hIGZpZWxkIG5hbWVkXG4gICAgLy8gXCJlcnJvcnNcIiAoc2VlIGB1dGlscy50b0Vycm9yU2NoZW1hYCkuXG4gICAgX19lcnJvcnM6IFtdLFxuICAgIGFkZEVycm9yKG1lc3NhZ2UpIHtcbiAgICAgIHRoaXMuX19lcnJvcnMucHVzaChtZXNzYWdlKTtcbiAgICB9LFxuICB9O1xuICBpZiAoaXNPYmplY3QoZm9ybURhdGEpKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKGZvcm1EYXRhKS5yZWR1Y2UoKGFjYywga2V5KSA9PiB7XG4gICAgICByZXR1cm4geyAuLi5hY2MsIFtrZXldOiBjcmVhdGVFcnJvckhhbmRsZXIoZm9ybURhdGFba2V5XSkgfTtcbiAgICB9LCBoYW5kbGVyKTtcbiAgfVxuICBpZiAoQXJyYXkuaXNBcnJheShmb3JtRGF0YSkpIHtcbiAgICByZXR1cm4gZm9ybURhdGEucmVkdWNlKChhY2MsIHZhbHVlLCBrZXkpID0+IHtcbiAgICAgIHJldHVybiB7IC4uLmFjYywgW2tleV06IGNyZWF0ZUVycm9ySGFuZGxlcih2YWx1ZSkgfTtcbiAgICB9LCBoYW5kbGVyKTtcbiAgfVxuICByZXR1cm4gaGFuZGxlcjtcbn1cblxuZnVuY3Rpb24gdW53cmFwRXJyb3JIYW5kbGVyKGVycm9ySGFuZGxlcikge1xuICByZXR1cm4gT2JqZWN0LmtleXMoZXJyb3JIYW5kbGVyKS5yZWR1Y2UoKGFjYywga2V5KSA9PiB7XG4gICAgaWYgKGtleSA9PT0gXCJhZGRFcnJvclwiKSB7XG4gICAgICByZXR1cm4gYWNjO1xuICAgIH0gZWxzZSBpZiAoa2V5ID09PSBcIl9fZXJyb3JzXCIpIHtcbiAgICAgIHJldHVybiB7IC4uLmFjYywgW2tleV06IGVycm9ySGFuZGxlcltrZXldIH07XG4gICAgfVxuICAgIHJldHVybiB7IC4uLmFjYywgW2tleV06IHVud3JhcEVycm9ySGFuZGxlcihlcnJvckhhbmRsZXJba2V5XSkgfTtcbiAgfSwge30pO1xufVxuXG4vKipcbiAqIFRyYW5zZm9ybWluZyB0aGUgZXJyb3Igb3V0cHV0IGZyb20gYWp2IHRvIGZvcm1hdCB1c2VkIGJ5IGpzb25zY2hlbWEuXG4gKiBBdCBzb21lIHBvaW50LCBjb21wb25lbnRzIHNob3VsZCBiZSB1cGRhdGVkIHRvIHN1cHBvcnQgYWp2LlxuICovXG5mdW5jdGlvbiB0cmFuc2Zvcm1BanZFcnJvcnMoZXJyb3JzID0gW10pIHtcbiAgaWYgKGVycm9ycyA9PT0gbnVsbCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIHJldHVybiBlcnJvcnMubWFwKGUgPT4ge1xuICAgIGNvbnN0IHsgZGF0YVBhdGgsIGtleXdvcmQsIG1lc3NhZ2UsIHBhcmFtcywgc2NoZW1hUGF0aCB9ID0gZTtcbiAgICBsZXQgcHJvcGVydHkgPSBgJHtkYXRhUGF0aH1gO1xuXG4gICAgLy8gcHV0IGRhdGEgaW4gZXhwZWN0ZWQgZm9ybWF0XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IGtleXdvcmQsXG4gICAgICBwcm9wZXJ0eSxcbiAgICAgIG1lc3NhZ2UsXG4gICAgICBwYXJhbXMsIC8vIHNwZWNpZmljIHRvIGFqdlxuICAgICAgc3RhY2s6IGAke3Byb3BlcnR5fSAke21lc3NhZ2V9YC50cmltKCksXG4gICAgICBzY2hlbWFQYXRoLFxuICAgIH07XG4gIH0pO1xufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gcHJvY2Vzc2VzIHRoZSBmb3JtRGF0YSB3aXRoIGEgdXNlciBgdmFsaWRhdGVgIGNvbnRyaWJ1dGVkXG4gKiBmdW5jdGlvbiwgd2hpY2ggcmVjZWl2ZXMgdGhlIGZvcm0gZGF0YSBhbmQgYW4gYGVycm9ySGFuZGxlcmAgb2JqZWN0IHRoYXRcbiAqIHdpbGwgYmUgdXNlZCB0byBhZGQgY3VzdG9tIHZhbGlkYXRpb24gZXJyb3JzIGZvciBlYWNoIGZpZWxkLlxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB2YWxpZGF0ZUZvcm1EYXRhKFxuICBmb3JtRGF0YSxcbiAgc2NoZW1hLFxuICBjdXN0b21WYWxpZGF0ZSxcbiAgdHJhbnNmb3JtRXJyb3JzLFxuICBhZGRpdGlvbmFsTWV0YVNjaGVtYXMgPSBbXSxcbiAgY3VzdG9tRm9ybWF0cyA9IHt9LFxuICB2YWxpZGF0ZVNjaGVtYSxcbiAgX3RyYW5zZm9ybUFqdkVycm9yc1xuKSB7XG4gIGlmICghX2lzRW1wdHkodmFsaWRhdGVTY2hlbWEpKSB7XG4gICAgc2NoZW1hID0gdmFsaWRhdGVTY2hlbWE7XG4gIH1cbiAgLy8gSW5jbHVkZSBmb3JtIGRhdGEgd2l0aCB1bmRlZmluZWQgdmFsdWVzLCB3aGljaCBpcyByZXF1aXJlZCBmb3IgdmFsaWRhdGlvbi5cbiAgY29uc3Qgcm9vdFNjaGVtYSA9IHNjaGVtYTtcbiAgZm9ybURhdGEgPSBnZXREZWZhdWx0Rm9ybVN0YXRlKHNjaGVtYSwgZm9ybURhdGEsIHJvb3RTY2hlbWEsIHRydWUpO1xuXG4gIGNvbnN0IG5ld01ldGFTY2hlbWFzID0gIWRlZXBFcXVhbHMoZm9ybWVyTWV0YVNjaGVtYSwgYWRkaXRpb25hbE1ldGFTY2hlbWFzKTtcbiAgY29uc3QgbmV3Rm9ybWF0cyA9ICFkZWVwRXF1YWxzKGZvcm1lckN1c3RvbUZvcm1hdHMsIGN1c3RvbUZvcm1hdHMpO1xuXG4gIGlmIChuZXdNZXRhU2NoZW1hcyB8fCBuZXdGb3JtYXRzKSB7XG4gICAgYWp2ID0gY3JlYXRlQWp2SW5zdGFuY2UoKTtcbiAgfVxuXG4gIC8vIGFkZCBtb3JlIHNjaGVtYXMgdG8gdmFsaWRhdGUgYWdhaW5zdFxuICBpZiAoXG4gICAgYWRkaXRpb25hbE1ldGFTY2hlbWFzICYmXG4gICAgbmV3TWV0YVNjaGVtYXMgJiZcbiAgICBBcnJheS5pc0FycmF5KGFkZGl0aW9uYWxNZXRhU2NoZW1hcylcbiAgKSB7XG4gICAgYWp2LmFkZE1ldGFTY2hlbWEoYWRkaXRpb25hbE1ldGFTY2hlbWFzKTtcbiAgICBmb3JtZXJNZXRhU2NoZW1hID0gYWRkaXRpb25hbE1ldGFTY2hlbWFzO1xuICB9XG5cbiAgLy8gYWRkIG1vcmUgY3VzdG9tIGZvcm1hdHMgdG8gdmFsaWRhdGUgYWdhaW5zdFxuICBpZiAoY3VzdG9tRm9ybWF0cyAmJiBuZXdGb3JtYXRzICYmIGlzT2JqZWN0KGN1c3RvbUZvcm1hdHMpKSB7XG4gICAgT2JqZWN0LmtleXMoY3VzdG9tRm9ybWF0cykuZm9yRWFjaChmb3JtYXROYW1lID0+IHtcbiAgICAgIGFqdi5hZGRGb3JtYXQoZm9ybWF0TmFtZSwgY3VzdG9tRm9ybWF0c1tmb3JtYXROYW1lXSk7XG4gICAgfSk7XG5cbiAgICBmb3JtZXJDdXN0b21Gb3JtYXRzID0gY3VzdG9tRm9ybWF0cztcbiAgfVxuXG4gIGxldCB2YWxpZGF0aW9uRXJyb3IgPSBudWxsO1xuICBjb25zb2xlLmxvZyhzY2hlbWEsIGZvcm1EYXRhKTtcbiAgdHJ5IHtcbiAgICBhanYudmFsaWRhdGUoc2NoZW1hLCBmb3JtRGF0YSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHZhbGlkYXRpb25FcnJvciA9IGVycjtcbiAgfVxuXG4gIGNvbnNvbGUubG9nKGFqdi5lcnJvcnMpO1xuXG4gIGxldCBlcnJvcnMgPSBbXTtcbiAgaWYgKHR5cGVvZiBfdHJhbnNmb3JtQWp2RXJyb3JzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZXJyb3JzID0gX3RyYW5zZm9ybUFqdkVycm9ycyhhanYuZXJyb3JzLCBzY2hlbWEpO1xuICB9IGVsc2Uge1xuICAgIGVycm9ycyA9IHRyYW5zZm9ybUFqdkVycm9ycyhhanYuZXJyb3JzKTtcbiAgfVxuICAvLyBDbGVhciBlcnJvcnMgdG8gcHJldmVudCBwZXJzaXN0ZW50IGVycm9ycywgc2VlICMxMTA0XG5cbiAgYWp2LmVycm9ycyA9IG51bGw7XG5cbiAgY29uc3Qgbm9Qcm9wZXJNZXRhU2NoZW1hID1cbiAgICB2YWxpZGF0aW9uRXJyb3IgJiZcbiAgICB2YWxpZGF0aW9uRXJyb3IubWVzc2FnZSAmJlxuICAgIHR5cGVvZiB2YWxpZGF0aW9uRXJyb3IubWVzc2FnZSA9PT0gXCJzdHJpbmdcIiAmJlxuICAgIHZhbGlkYXRpb25FcnJvci5tZXNzYWdlLmluY2x1ZGVzKFwibm8gc2NoZW1hIHdpdGgga2V5IG9yIHJlZiBcIik7XG5cbiAgaWYgKG5vUHJvcGVyTWV0YVNjaGVtYSkge1xuICAgIGVycm9ycyA9IFtcbiAgICAgIC4uLmVycm9ycyxcbiAgICAgIHtcbiAgICAgICAgc3RhY2s6IHZhbGlkYXRpb25FcnJvci5tZXNzYWdlLFxuICAgICAgfSxcbiAgICBdO1xuICB9XG4gIGlmICh0eXBlb2YgdHJhbnNmb3JtRXJyb3JzID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBlcnJvcnMgPSB0cmFuc2Zvcm1FcnJvcnMoZXJyb3JzKTtcbiAgfVxuXG4gIGxldCBlcnJvclNjaGVtYSA9IHRvRXJyb3JTY2hlbWEoZXJyb3JzKTtcblxuICBpZiAobm9Qcm9wZXJNZXRhU2NoZW1hKSB7XG4gICAgZXJyb3JTY2hlbWEgPSB7XG4gICAgICAuLi5lcnJvclNjaGVtYSxcbiAgICAgIC4uLntcbiAgICAgICAgJHNjaGVtYToge1xuICAgICAgICAgIF9fZXJyb3JzOiBbdmFsaWRhdGlvbkVycm9yLm1lc3NhZ2VdLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgaWYgKHR5cGVvZiBjdXN0b21WYWxpZGF0ZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgcmV0dXJuIHsgZXJyb3JzLCBlcnJvclNjaGVtYSB9O1xuICB9XG5cbiAgY29uc3QgZXJyb3JIYW5kbGVyID0gY3VzdG9tVmFsaWRhdGUoZm9ybURhdGEsIGNyZWF0ZUVycm9ySGFuZGxlcihmb3JtRGF0YSkpO1xuICBjb25zdCB1c2VyRXJyb3JTY2hlbWEgPSB1bndyYXBFcnJvckhhbmRsZXIoZXJyb3JIYW5kbGVyKTtcbiAgY29uc3QgbmV3RXJyb3JTY2hlbWEgPSBtZXJnZU9iamVjdHMoZXJyb3JTY2hlbWEsIHVzZXJFcnJvclNjaGVtYSwgdHJ1ZSk7XG4gIC8vIFhYWDogVGhlIGVycm9ycyBsaXN0IHByb2R1Y2VkIGlzIG5vdCBmdWxseSBjb21wbGlhbnQgd2l0aCB0aGUgZm9ybWF0XG4gIC8vIGV4cG9zZWQgYnkgdGhlIGpzb25zY2hlbWEgbGliLCB3aGljaCBjb250YWlucyBmdWxsIGZpZWxkIHBhdGhzIGFuZCBvdGhlclxuICAvLyBwcm9wZXJ0aWVzLlxuICBjb25zdCBuZXdFcnJvcnMgPSB0b0Vycm9yTGlzdChuZXdFcnJvclNjaGVtYSk7XG5cbiAgcmV0dXJuIHtcbiAgICBlcnJvcnM6IG5ld0Vycm9ycyxcbiAgICBlcnJvclNjaGVtYTogbmV3RXJyb3JTY2hlbWEsXG4gIH07XG59XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgcHJlZml4ZXMgYWxsICRyZWYncyBpbiBhIHNjaGVtYSB3aXRoIGBST09UX1NDSEVNQV9QUkVGSVhgXG4gKiBUaGlzIGlzIHVzZWQgaW4gaXNWYWxpZCB0byBtYWtlIHJlZmVyZW5jZXMgdG8gdGhlIHJvb3RTY2hlbWFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhJZFJlZlByZWZpeChzY2hlbWFOb2RlKSB7XG4gIGxldCBvYmogPSBzY2hlbWFOb2RlO1xuICBpZiAoc2NoZW1hTm9kZS5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0KSB7XG4gICAgb2JqID0geyAuLi5zY2hlbWFOb2RlIH07XG4gICAgZm9yIChjb25zdCBrZXkgaW4gb2JqKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IG9ialtrZXldO1xuICAgICAgaWYgKFxuICAgICAgICBrZXkgPT09IFwiJHJlZlwiICYmXG4gICAgICAgIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJlxuICAgICAgICB2YWx1ZS5zdGFydHNXaXRoKFwiI1wiKVxuICAgICAgKSB7XG4gICAgICAgIG9ialtrZXldID0gUk9PVF9TQ0hFTUFfUFJFRklYICsgdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvYmpba2V5XSA9IHdpdGhJZFJlZlByZWZpeCh2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hTm9kZSkpIHtcbiAgICBvYmogPSBbLi4uc2NoZW1hTm9kZV07XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmoubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9ialtpXSA9IHdpdGhJZFJlZlByZWZpeChvYmpbaV0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIFZhbGlkYXRlcyBkYXRhIGFnYWluc3QgYSBzY2hlbWEsIHJldHVybmluZyB0cnVlIGlmIHRoZSBkYXRhIGlzIHZhbGlkLCBvclxuICogZmFsc2Ugb3RoZXJ3aXNlLiBJZiB0aGUgc2NoZW1hIGlzIGludmFsaWQsIHRoZW4gdGhpcyBmdW5jdGlvbiB3aWxsIHJldHVyblxuICogZmFsc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbGlkKHNjaGVtYSwgZGF0YSwgcm9vdFNjaGVtYSkge1xuICB0cnkge1xuICAgIC8vIGFkZCB0aGUgcm9vdFNjaGVtYSBST09UX1NDSEVNQV9QUkVGSVggYXMgaWQuXG4gICAgLy8gdGhlbiByZXdyaXRlIHRoZSBzY2hlbWEgcmVmJ3MgdG8gcG9pbnQgdG8gdGhlIHJvb3RTY2hlbWFcbiAgICAvLyB0aGlzIGFjY291bnRzIGZvciB0aGUgY2FzZSB3aGVyZSBzY2hlbWEgaGF2ZSByZWZlcmVuY2VzIHRvIG1vZGVsc1xuICAgIC8vIHRoYXQgbGl2ZXMgaW4gdGhlIHJvb3RTY2hlbWEgYnV0IG5vdCBpbiB0aGUgc2NoZW1hIGluIHF1ZXN0aW9uLlxuICAgIHJldHVybiBhanZcbiAgICAgIC5hZGRTY2hlbWEocm9vdFNjaGVtYSwgUk9PVF9TQ0hFTUFfUFJFRklYKVxuICAgICAgLnZhbGlkYXRlKHdpdGhJZFJlZlByZWZpeChzY2hlbWEpLCBkYXRhKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSBmaW5hbGx5IHtcbiAgICAvLyBtYWtlIHN1cmUgd2UgcmVtb3ZlIHRoZSByb290U2NoZW1hIGZyb20gdGhlIGdsb2JhbCBhanYgaW5zdGFuY2VcbiAgICBhanYucmVtb3ZlU2NoZW1hKFJPT1RfU0NIRU1BX1BSRUZJWCk7XG4gIH1cbn1cbiJdfQ==