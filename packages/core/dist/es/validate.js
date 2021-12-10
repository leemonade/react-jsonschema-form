function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import toPath from "lodash/toPath";
import Ajv from "ajv";
var ajv = createAjvInstance();
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
  console.log('validateSchema', validateSchema);

  if (validateSchema) {
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

  try {
    ajv.validate(schema, formData);
  } catch (err) {
    validationError = err;
  }

  var errors = transformAjvErrors(ajv.errors); // Clear errors to prevent persistent errors, see #1104

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy92YWxpZGF0ZS5qcyJdLCJuYW1lcyI6WyJ0b1BhdGgiLCJBanYiLCJhanYiLCJjcmVhdGVBanZJbnN0YW5jZSIsImRlZXBFcXVhbHMiLCJnZXREZWZhdWx0Rm9ybVN0YXRlIiwiZm9ybWVyQ3VzdG9tRm9ybWF0cyIsImZvcm1lck1ldGFTY2hlbWEiLCJST09UX1NDSEVNQV9QUkVGSVgiLCJpc09iamVjdCIsIm1lcmdlT2JqZWN0cyIsImVycm9yRGF0YVBhdGgiLCJhbGxFcnJvcnMiLCJtdWx0aXBsZU9mUHJlY2lzaW9uIiwic2NoZW1hSWQiLCJ1bmtub3duRm9ybWF0cyIsImFkZEZvcm1hdCIsInRvRXJyb3JTY2hlbWEiLCJlcnJvcnMiLCJsZW5ndGgiLCJyZWR1Y2UiLCJlcnJvclNjaGVtYSIsImVycm9yIiwicHJvcGVydHkiLCJtZXNzYWdlIiwicGF0aCIsInBhcmVudCIsInNwbGljZSIsInNsaWNlIiwic2VnbWVudCIsIkFycmF5IiwiaXNBcnJheSIsIl9fZXJyb3JzIiwiY29uY2F0IiwidG9FcnJvckxpc3QiLCJmaWVsZE5hbWUiLCJlcnJvckxpc3QiLCJtYXAiLCJzdGFjayIsIk9iamVjdCIsImtleXMiLCJhY2MiLCJrZXkiLCJjcmVhdGVFcnJvckhhbmRsZXIiLCJmb3JtRGF0YSIsImhhbmRsZXIiLCJhZGRFcnJvciIsInB1c2giLCJ2YWx1ZSIsInVud3JhcEVycm9ySGFuZGxlciIsImVycm9ySGFuZGxlciIsInRyYW5zZm9ybUFqdkVycm9ycyIsImUiLCJkYXRhUGF0aCIsImtleXdvcmQiLCJwYXJhbXMiLCJzY2hlbWFQYXRoIiwibmFtZSIsInRyaW0iLCJ2YWxpZGF0ZUZvcm1EYXRhIiwic2NoZW1hIiwiY3VzdG9tVmFsaWRhdGUiLCJ0cmFuc2Zvcm1FcnJvcnMiLCJhZGRpdGlvbmFsTWV0YVNjaGVtYXMiLCJjdXN0b21Gb3JtYXRzIiwidmFsaWRhdGVTY2hlbWEiLCJjb25zb2xlIiwibG9nIiwicm9vdFNjaGVtYSIsIm5ld01ldGFTY2hlbWFzIiwibmV3Rm9ybWF0cyIsImFkZE1ldGFTY2hlbWEiLCJmb3JFYWNoIiwiZm9ybWF0TmFtZSIsInZhbGlkYXRpb25FcnJvciIsInZhbGlkYXRlIiwiZXJyIiwibm9Qcm9wZXJNZXRhU2NoZW1hIiwiaW5jbHVkZXMiLCIkc2NoZW1hIiwidXNlckVycm9yU2NoZW1hIiwibmV3RXJyb3JTY2hlbWEiLCJuZXdFcnJvcnMiLCJ3aXRoSWRSZWZQcmVmaXgiLCJzY2hlbWFOb2RlIiwib2JqIiwiY29uc3RydWN0b3IiLCJzdGFydHNXaXRoIiwiaSIsImlzVmFsaWQiLCJkYXRhIiwiYWRkU2NoZW1hIiwicmVtb3ZlU2NoZW1hIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxPQUFPQSxNQUFQLE1BQW1CLGVBQW5CO0FBQ0EsT0FBT0MsR0FBUCxNQUFnQixLQUFoQjtBQUNBLElBQUlDLEdBQUcsR0FBR0MsaUJBQWlCLEVBQTNCO0FBQ0EsU0FBU0MsVUFBVCxFQUFxQkMsbUJBQXJCLFFBQWdELFNBQWhEO0FBRUEsSUFBSUMsbUJBQW1CLEdBQUcsSUFBMUI7QUFDQSxJQUFJQyxnQkFBZ0IsR0FBRyxJQUF2QjtBQUNBLElBQU1DLGtCQUFrQixHQUFHLG1CQUEzQjtBQUVBLFNBQVNDLFFBQVQsRUFBbUJDLFlBQW5CLFFBQXVDLFNBQXZDOztBQUVBLFNBQVNQLGlCQUFULEdBQTZCO0FBQzNCLE1BQU1ELEdBQUcsR0FBRyxJQUFJRCxHQUFKLENBQVE7QUFDbEJVLElBQUFBLGFBQWEsRUFBRSxVQURHO0FBRWxCQyxJQUFBQSxTQUFTLEVBQUUsSUFGTztBQUdsQkMsSUFBQUEsbUJBQW1CLEVBQUUsQ0FISDtBQUlsQkMsSUFBQUEsUUFBUSxFQUFFLE1BSlE7QUFLbEJDLElBQUFBLGNBQWMsRUFBRTtBQUxFLEdBQVIsQ0FBWixDQUQyQixDQVMzQjs7QUFDQWIsRUFBQUEsR0FBRyxDQUFDYyxTQUFKLENBQ0UsVUFERixFQUVFLDJEQUZGO0FBSUFkLEVBQUFBLEdBQUcsQ0FBQ2MsU0FBSixDQUNFLE9BREYs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TkQsTUFNTztBQUNMcUMsUUFBQUEsR0FBRyxDQUFDM0MsR0FBRCxDQUFILEdBQVd5QyxlQUFlLENBQUNuQyxLQUFELENBQTFCO0FBQ0Q7QUFDRjtBQUNGLEdBZEQsTUFjTyxJQUFJbEIsS0FBSyxDQUFDQyxPQUFOLENBQWNxRCxVQUFkLENBQUosRUFBK0I7QUFDcENDLElBQUFBLEdBQUcsc0JBQU9ELFVBQVAsQ0FBSDs7QUFDQSxTQUFLLElBQUlJLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdILEdBQUcsQ0FBQ2xFLE1BQXhCLEVBQWdDcUUsQ0FBQyxFQUFqQyxFQUFxQztBQUNuQ0gsTUFBQUEsR0FBRyxDQUFDRyxDQUFELENBQUgsR0FBU0wsZUFBZSxDQUFDRSxHQUFHLENBQUNHLENBQUQsQ0FBSixDQUF4QjtBQUNEO0FBQ0Y7O0FBQ0QsU0FBT0gsR0FBUDtBQUNEO0FBRUQ7Ozs7OztBQUtBLE9BQU8sU0FBU0ksT0FBVCxDQUFpQjdCLE1BQWpCLEVBQXlCOEIsSUFBekIsRUFBK0J0QixVQUEvQixFQUEyQztBQUNoRCxNQUFJO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFPbEUsR0FBRyxDQUNQeUYsU0FESSxDQUNNdkIsVUFETixFQUNrQjVELGtCQURsQixFQUVKbUUsUUFGSSxDQUVLUSxlQUFlLENBQUN2QixNQUFELENBRnBCLEVBRThCOEIsSUFGOUIsQ0FBUDtBQUdELEdBUkQsQ0FRRSxPQUFPdEMsQ0FBUCxFQUFVO0FBQ1YsV0FBTyxLQUFQO0FBQ0QsR0FWRCxTQVVVO0FBQ1I7QUFDQWxELElBQUFBLEdBQUcsQ0FBQzBGLFlBQUosQ0FBaUJwRixrQkFBakI7QUFDRDtBQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHRvUGF0aCBmcm9tIFwibG9kYXNoL3RvUGF0aFwiO1xuaW1wb3J0IEFqdiBmcm9tIFwiYWp2XCI7XG5sZXQgYWp2ID0gY3JlYXRlQWp2SW5zdGFuY2UoKTtcbmltcG9ydCB7IGRlZXBFcXVhbHMsIGdldERlZmF1bHRGb3JtU3RhdGUgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5sZXQgZm9ybWVyQ3VzdG9tRm9ybWF0cyA9IG51bGw7XG5sZXQgZm9ybWVyTWV0YVNjaGVtYSA9IG51bGw7XG5jb25zdCBST09UX1NDSEVNQV9QUkVGSVggPSBcIl9fcmpzZl9yb290U2NoZW1hXCI7XG5cbmltcG9ydCB7IGlzT2JqZWN0LCBtZXJnZU9iamVjdHMgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5mdW5jdGlvbiBjcmVhdGVBanZJbnN0YW5jZSgpIHtcbiAgY29uc3QgYWp2ID0gbmV3IEFqdih7XG4gICAgZXJyb3JEYXRhUGF0aDogXCJwcm9wZXJ0eVwiLFxuICAgIGFsbEVycm9yczogdHJ1ZSxcbiAgICBtdWx0aXBsZU9mUHJlY2lzaW9uOiA4LFxuICAgIHNjaGVtYUlkOiBcImF1dG9cIixcbiAgICB1bmtub3duRm9ybWF0czogXCJpZ25vcmVcIixcbiAgfSk7XG5cbiAgLy8gYWRkIGN1c3RvbSBmb3JtYXRzXG4gIGFqdi5hZGRGb3JtYXQoXG4gICAgXCJkYXRhLXVybFwiLFxuICAgIC9eZGF0YTooW2Etel0rXFwvW2EtejAtOS0rLl0rKT87KD86bmFtZT0oLiopOyk/YmFzZTY0LCguKikkL1xuICApO1xuICBhanYuYWRkRm9ybWF0KFxuICAgIFwiY29sb3JcIixcbiAgICAvXigjPyhbMC05QS1GYS1mXXszfSl7MSwyfVxcYnxhcXVhfGJsYWNrfGJsdWV8ZnVjaHNpYXxncmF5fGdyZWVufGxpbWV8bWFyb29ufG5hdnl8b2xpdmV8b3JhbmdlfHB1cnBsZXxyZWR8c2lsdmVyfHRlYWx8d2hpdGV8eWVsbG93fChyZ2JcXChcXHMqXFxiKFswLTldfFsxLTldWzAtOV18MVswLTldWzAtOV18MlswLTRdWzAtOV18MjVbMC01XSlcXGJcXHMqLFxccypcXGIoWzAtOV18WzEtOV1bMC05XXwxWzAtOV1bMC05XXwyWzAtNF1bMC05XXwyNVswLTVdKVxcYlxccyosXFxzKlxcYihbMC05XXxbMS05XVswLTldfDFbMC05XVswLTldfDJbMC00XVswLTldfDI1WzAtNV0pXFxiXFxzKlxcKSl8KHJnYlxcKFxccyooXFxkP1xcZCV8MTAwJSkrXFxzKixcXHMqKFxcZD9cXGQlfDEwMCUpK1xccyosXFxzKihcXGQ/XFxkJXwxMDAlKStcXHMqXFwpKSkkL1xuICApO1xuICByZXR1cm4gYWp2O1xufVxuXG5mdW5jdGlvbiB0b0Vycm9yU2NoZW1hKGVycm9ycykge1xuICAvLyBUcmFuc2Zvcm1zIGEgYWp2IHZhbGlkYXRpb24gZXJyb3JzIGxpc3Q6XG4gIC8vIFtcbiAgLy8gICB7cHJvcGVydHk6IFwiLmxldmVsMS5sZXZlbDJbMl0ubGV2ZWwzXCIsIG1lc3NhZ2U6IFwiZXJyIGFcIn0sXG4gIC8vICAge3Byb3BlcnR5OiBcIi5sZXZlbDEubGV2ZWwyWzJdLmxldmVsM1wiLCBtZXNzYWdlOiBcImVyciBiXCJ9LFxuICAvLyAgIHtwcm9wZXJ0eTogXCIubGV2ZWwxLmxldmVsMls0XS5sZXZlbDNcIiwgbWVzc2FnZTogXCJlcnIgYlwifSxcbiAgLy8gXVxuICAvLyBJbnRvIGFuIGVycm9yIHRyZWU6XG4gIC8vIHtcbiAgLy8gICBsZXZlbDE6IHtcbiAgLy8gICAgIGxldmVsMjoge1xuICAvLyAgICAgICAyOiB7bGV2ZWwzOiB7ZXJyb3JzOiBbXCJlcnIgYVwiLCBcImVyciBiXCJdfX0sXG4gIC8vICAgICAgIDQ6IHtsZXZlbDM6IHtlcnJvcnM6IFtcImVyciBiXCJdfX0sXG4gIC8vICAgICB9XG4gIC8vICAgfVxuICAvLyB9O1xuICBpZiAoIWVycm9ycy5sZW5ndGgpIHtcbiAgICByZXR1cm4ge307XG4gIH1cbiAgcmV0dXJuIGVycm9ycy5yZWR1Y2UoKGVycm9yU2NoZW1hLCBlcnJvcikgPT4ge1xuICAgIGNvbnN0IHsgcHJvcGVydHksIG1lc3NhZ2UgfSA9IGVycm9yO1xuICAgIGNvbnN0IHBhdGggPSB0b1BhdGgocHJvcGVydHkpO1xuICAgIGxldCBwYXJlbnQgPSBlcnJvclNjaGVtYTtcblxuICAgIC8vIElmIHRoZSBwcm9wZXJ0eSBpcyBhdCB0aGUgcm9vdCAoLmxldmVsMSkgdGhlbiB0b1BhdGggY3JlYXRlc1xuICAgIC8vIGFuIGVtcHR5IGFycmF5IGVsZW1lbnQgYXQgdGhlIGZpcnN0IGluZGV4LiBSZW1vdmUgaXQuXG4gICAgaWYgKHBhdGgubGVuZ3RoID4gMCAmJiBwYXRoWzBdID09PSBcIlwiKSB7XG4gICAgICBwYXRoLnNwbGljZSgwLCAxKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHNlZ21lbnQgb2YgcGF0aC5zbGljZSgwKSkge1xuICAgICAgaWYgKCEoc2VnbWVudCBpbiBwYXJlbnQpKSB7XG4gICAgICAgIHBhcmVudFtzZWdtZW50XSA9IHt9O1xuICAgICAgfVxuICAgICAgcGFyZW50ID0gcGFyZW50W3NlZ21lbnRdO1xuICAgIH1cblxuICAgIGlmIChBcnJheS5pc0FycmF5KHBhcmVudC5fX2Vycm9ycykpIHtcbiAgICAgIC8vIFdlIHN0b3JlIHRoZSBsaXN0IG9mIGVycm9ycyBmb3IgdGhpcyBub2RlIGluIGEgcHJvcGVydHkgbmFtZWQgX19lcnJvcnNcbiAgICAgIC8vIHRvIGF2b2lkIG5hbWUgY29sbGlzaW9uIHdpdGggYSBwb3NzaWJsZSBzdWIgc2NoZW1hIGZpZWxkIG5hbWVkXG4gICAgICAvLyBcImVycm9yc1wiIChzZWUgYHZhbGlkYXRlLmNyZWF0ZUVycm9ySGFuZGxlcmApLlxuICAgICAgcGFyZW50Ll9fZXJyb3JzID0gcGFyZW50Ll9fZXJyb3JzLmNvbmNhdChtZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG1lc3NhZ2UpIHtcbiAgICAgICAgcGFyZW50Ll9fZXJyb3JzID0gW21lc3NhZ2VdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZXJyb3JTY2hlbWE7XG4gIH0sIHt9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvRXJyb3JMaXN0KGVycm9yU2NoZW1hLCBmaWVsZE5hbWUgPSBcInJvb3RcIikge1xuICAvLyBYWFg6IFdlIHNob3VsZCB0cmFuc2Zvcm0gZmllbGROYW1lIGFzIGEgZnVsbCBmaWVsZCBwYXRoIHN0cmluZy5cbiAgbGV0IGVycm9yTGlzdCA9IFtdO1xuICBpZiAoXCJfX2Vycm9yc1wiIGluIGVycm9yU2NoZW1hKSB7XG4gICAgZXJyb3JMaXN0ID0gZXJyb3JMaXN0LmNvbmNhdChcbiAgICAgIGVycm9yU2NoZW1hLl9fZXJyb3JzLm1hcChzdGFjayA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3RhY2s6IGAke2ZpZWxkTmFtZX06ICR7c3RhY2t9YCxcbiAgICAgICAgfTtcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuICByZXR1cm4gT2JqZWN0LmtleXMoZXJyb3JTY2hlbWEpLnJlZHVjZSgoYWNjLCBrZXkpID0+IHtcbiAgICBpZiAoa2V5ICE9PSBcIl9fZXJyb3JzXCIpIHtcbiAgICAgIGFjYyA9IGFjYy5jb25jYXQodG9FcnJvckxpc3QoZXJyb3JTY2hlbWFba2V5XSwga2V5KSk7XG4gICAgfVxuICAgIHJldHVybiBhY2M7XG4gIH0sIGVycm9yTGlzdCk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUVycm9ySGFuZGxlcihmb3JtRGF0YSkge1xuICBjb25zdCBoYW5kbGVyID0ge1xuICAgIC8vIFdlIHN0b3JlIHRoZSBsaXN0IG9mIGVycm9ycyBmb3IgdGhpcyBub2RlIGluIGEgcHJvcGVydHkgbmFtZWQgX19lcnJvcnNcbiAgICAvLyB0byBhdm9pZCBuYW1lIGNvbGxpc2lvbiB3aXRoIGEgcG9zc2libGUgc3ViIHNjaGVtYSBmaWVsZCBuYW1lZFxuICAgIC8vIFwiZXJyb3JzXCIgKHNlZSBgdXRpbHMudG9FcnJvclNjaGVtYWApLlxuICAgIF9fZXJyb3JzOiBbXSxcbiAgICBhZGRFcnJvcihtZXNzYWdlKSB7XG4gICAgICB0aGlzLl9fZXJyb3JzLnB1c2gobWVzc2FnZSk7XG4gICAgfSxcbiAgfTtcbiAgaWYgKGlzT2JqZWN0KGZvcm1EYXRhKSkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhmb3JtRGF0YSkucmVkdWNlKChhY2MsIGtleSkgPT4ge1xuICAgICAgcmV0dXJuIHsgLi4uYWNjLCBba2V5XTogY3JlYXRlRXJyb3JIYW5kbGVyKGZvcm1EYXRhW2tleV0pIH07XG4gICAgfSwgaGFuZGxlcik7XG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkoZm9ybURhdGEpKSB7XG4gICAgcmV0dXJuIGZvcm1EYXRhLnJlZHVjZSgoYWNjLCB2YWx1ZSwga2V5KSA9PiB7XG4gICAgICByZXR1cm4geyAuLi5hY2MsIFtrZXldOiBjcmVhdGVFcnJvckhhbmRsZXIodmFsdWUpIH07XG4gICAgfSwgaGFuZGxlcik7XG4gIH1cbiAgcmV0dXJuIGhhbmRsZXI7XG59XG5cbmZ1bmN0aW9uIHVud3JhcEVycm9ySGFuZGxlcihlcnJvckhhbmRsZXIpIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKGVycm9ySGFuZGxlcikucmVkdWNlKChhY2MsIGtleSkgPT4ge1xuICAgIGlmIChrZXkgPT09IFwiYWRkRXJyb3JcIikge1xuICAgICAgcmV0dXJuIGFjYztcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gXCJfX2Vycm9yc1wiKSB7XG4gICAgICByZXR1cm4geyAuLi5hY2MsIFtrZXldOiBlcnJvckhhbmRsZXJba2V5XSB9O1xuICAgIH1cbiAgICByZXR1cm4geyAuLi5hY2MsIFtrZXldOiB1bndyYXBFcnJvckhhbmRsZXIoZXJyb3JIYW5kbGVyW2tleV0pIH07XG4gIH0sIHt9KTtcbn1cblxuLyoqXG4gKiBUcmFuc2Zvcm1pbmcgdGhlIGVycm9yIG91dHB1dCBmcm9tIGFqdiB0byBmb3JtYXQgdXNlZCBieSBqc29uc2NoZW1hLlxuICogQXQgc29tZSBwb2ludCwgY29tcG9uZW50cyBzaG91bGQgYmUgdXBkYXRlZCB0byBzdXBwb3J0IGFqdi5cbiAqL1xuZnVuY3Rpb24gdHJhbnNmb3JtQWp2RXJyb3JzKGVycm9ycyA9IFtdKSB7XG4gIGlmIChlcnJvcnMgPT09IG51bGwpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICByZXR1cm4gZXJyb3JzLm1hcChlID0+IHtcbiAgICBjb25zdCB7IGRhdGFQYXRoLCBrZXl3b3JkLCBtZXNzYWdlLCBwYXJhbXMsIHNjaGVtYVBhdGggfSA9IGU7XG4gICAgbGV0IHByb3BlcnR5ID0gYCR7ZGF0YVBhdGh9YDtcblxuICAgIC8vIHB1dCBkYXRhIGluIGV4cGVjdGVkIGZvcm1hdFxuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiBrZXl3b3JkLFxuICAgICAgcHJvcGVydHksXG4gICAgICBtZXNzYWdlLFxuICAgICAgcGFyYW1zLCAvLyBzcGVjaWZpYyB0byBhanZcbiAgICAgIHN0YWNrOiBgJHtwcm9wZXJ0eX0gJHttZXNzYWdlfWAudHJpbSgpLFxuICAgICAgc2NoZW1hUGF0aCxcbiAgICB9O1xuICB9KTtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIHByb2Nlc3NlcyB0aGUgZm9ybURhdGEgd2l0aCBhIHVzZXIgYHZhbGlkYXRlYCBjb250cmlidXRlZFxuICogZnVuY3Rpb24sIHdoaWNoIHJlY2VpdmVzIHRoZSBmb3JtIGRhdGEgYW5kIGFuIGBlcnJvckhhbmRsZXJgIG9iamVjdCB0aGF0XG4gKiB3aWxsIGJlIHVzZWQgdG8gYWRkIGN1c3RvbSB2YWxpZGF0aW9uIGVycm9ycyBmb3IgZWFjaCBmaWVsZC5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gdmFsaWRhdGVGb3JtRGF0YShcbiAgZm9ybURhdGEsXG4gIHNjaGVtYSxcbiAgY3VzdG9tVmFsaWRhdGUsXG4gIHRyYW5zZm9ybUVycm9ycyxcbiAgYWRkaXRpb25hbE1ldGFTY2hlbWFzID0gW10sXG4gIGN1c3RvbUZvcm1hdHMgPSB7fSxcbiAgdmFsaWRhdGVTY2hlbWFcbikge1xuICBjb25zb2xlLmxvZygndmFsaWRhdGVTY2hlbWEnLCB2YWxpZGF0ZVNjaGVtYSk7XG4gIGlmICh2YWxpZGF0ZVNjaGVtYSkge1xuICAgIHNjaGVtYSA9IHZhbGlkYXRlU2NoZW1hO1xuICB9XG4gIC8vIEluY2x1ZGUgZm9ybSBkYXRhIHdpdGggdW5kZWZpbmVkIHZhbHVlcywgd2hpY2ggaXMgcmVxdWlyZWQgZm9yIHZhbGlkYXRpb24uXG4gIGNvbnN0IHJvb3RTY2hlbWEgPSBzY2hlbWE7XG4gIGZvcm1EYXRhID0gZ2V0RGVmYXVsdEZvcm1TdGF0ZShzY2hlbWEsIGZvcm1EYXRhLCByb290U2NoZW1hLCB0cnVlKTtcblxuICBjb25zdCBuZXdNZXRhU2NoZW1hcyA9ICFkZWVwRXF1YWxzKGZvcm1lck1ldGFTY2hlbWEsIGFkZGl0aW9uYWxNZXRhU2NoZW1hcyk7XG4gIGNvbnN0IG5ld0Zvcm1hdHMgPSAhZGVlcEVxdWFscyhmb3JtZXJDdXN0b21Gb3JtYXRzLCBjdXN0b21Gb3JtYXRzKTtcblxuICBpZiAobmV3TWV0YVNjaGVtYXMgfHwgbmV3Rm9ybWF0cykge1xuICAgIGFqdiA9IGNyZWF0ZUFqdkluc3RhbmNlKCk7XG4gIH1cblxuICAvLyBhZGQgbW9yZSBzY2hlbWFzIHRvIHZhbGlkYXRlIGFnYWluc3RcbiAgaWYgKFxuICAgIGFkZGl0aW9uYWxNZXRhU2NoZW1hcyAmJlxuICAgIG5ld01ldGFTY2hlbWFzICYmXG4gICAgQXJyYXkuaXNBcnJheShhZGRpdGlvbmFsTWV0YVNjaGVtYXMpXG4gICkge1xuICAgIGFqdi5hZGRNZXRhU2NoZW1hKGFkZGl0aW9uYWxNZXRhU2NoZW1hcyk7XG4gICAgZm9ybWVyTWV0YVNjaGVtYSA9IGFkZGl0aW9uYWxNZXRhU2NoZW1hcztcbiAgfVxuXG4gIC8vIGFkZCBtb3JlIGN1c3RvbSBmb3JtYXRzIHRvIHZhbGlkYXRlIGFnYWluc3RcbiAgaWYgKGN1c3RvbUZvcm1hdHMgJiYgbmV3Rm9ybWF0cyAmJiBpc09iamVjdChjdXN0b21Gb3JtYXRzKSkge1xuICAgIE9iamVjdC5rZXlzKGN1c3RvbUZvcm1hdHMpLmZvckVhY2goZm9ybWF0TmFtZSA9PiB7XG4gICAgICBhanYuYWRkRm9ybWF0KGZvcm1hdE5hbWUsIGN1c3RvbUZvcm1hdHNbZm9ybWF0TmFtZV0pO1xuICAgIH0pO1xuXG4gICAgZm9ybWVyQ3VzdG9tRm9ybWF0cyA9IGN1c3RvbUZvcm1hdHM7XG4gIH1cblxuICBsZXQgdmFsaWRhdGlvbkVycm9yID0gbnVsbDtcbiAgdHJ5IHtcbiAgICBhanYudmFsaWRhdGUoc2NoZW1hLCBmb3JtRGF0YSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHZhbGlkYXRpb25FcnJvciA9IGVycjtcbiAgfVxuXG4gIGxldCBlcnJvcnMgPSB0cmFuc2Zvcm1BanZFcnJvcnMoYWp2LmVycm9ycyk7XG4gIC8vIENsZWFyIGVycm9ycyB0byBwcmV2ZW50IHBlcnNpc3RlbnQgZXJyb3JzLCBzZWUgIzExMDRcblxuICBhanYuZXJyb3JzID0gbnVsbDtcblxuICBjb25zdCBub1Byb3Blck1ldGFTY2hlbWEgPVxuICAgIHZhbGlkYXRpb25FcnJvciAmJlxuICAgIHZhbGlkYXRpb25FcnJvci5tZXNzYWdlICYmXG4gICAgdHlwZW9mIHZhbGlkYXRpb25FcnJvci5tZXNzYWdlID09PSBcInN0cmluZ1wiICYmXG4gICAgdmFsaWRhdGlvbkVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoXCJubyBzY2hlbWEgd2l0aCBrZXkgb3IgcmVmIFwiKTtcblxuICBpZiAobm9Qcm9wZXJNZXRhU2NoZW1hKSB7XG4gICAgZXJyb3JzID0gW1xuICAgICAgLi4uZXJyb3JzLFxuICAgICAge1xuICAgICAgICBzdGFjazogdmFsaWRhdGlvbkVycm9yLm1lc3NhZ2UsXG4gICAgICB9LFxuICAgIF07XG4gIH1cbiAgaWYgKHR5cGVvZiB0cmFuc2Zvcm1FcnJvcnMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIGVycm9ycyA9IHRyYW5zZm9ybUVycm9ycyhlcnJvcnMpO1xuICB9XG5cbiAgbGV0IGVycm9yU2NoZW1hID0gdG9FcnJvclNjaGVtYShlcnJvcnMpO1xuXG4gIGlmIChub1Byb3Blck1ldGFTY2hlbWEpIHtcbiAgICBlcnJvclNjaGVtYSA9IHtcbiAgICAgIC4uLmVycm9yU2NoZW1hLFxuICAgICAgLi4ue1xuICAgICAgICAkc2NoZW1hOiB7XG4gICAgICAgICAgX19lcnJvcnM6IFt2YWxpZGF0aW9uRXJyb3IubWVzc2FnZV0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICBpZiAodHlwZW9mIGN1c3RvbVZhbGlkYXRlICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICByZXR1cm4geyBlcnJvcnMsIGVycm9yU2NoZW1hIH07XG4gIH1cblxuICBjb25zdCBlcnJvckhhbmRsZXIgPSBjdXN0b21WYWxpZGF0ZShmb3JtRGF0YSwgY3JlYXRlRXJyb3JIYW5kbGVyKGZvcm1EYXRhKSk7XG4gIGNvbnN0IHVzZXJFcnJvclNjaGVtYSA9IHVud3JhcEVycm9ySGFuZGxlcihlcnJvckhhbmRsZXIpO1xuICBjb25zdCBuZXdFcnJvclNjaGVtYSA9IG1lcmdlT2JqZWN0cyhlcnJvclNjaGVtYSwgdXNlckVycm9yU2NoZW1hLCB0cnVlKTtcbiAgLy8gWFhYOiBUaGUgZXJyb3JzIGxpc3QgcHJvZHVjZWQgaXMgbm90IGZ1bGx5IGNvbXBsaWFudCB3aXRoIHRoZSBmb3JtYXRcbiAgLy8gZXhwb3NlZCBieSB0aGUganNvbnNjaGVtYSBsaWIsIHdoaWNoIGNvbnRhaW5zIGZ1bGwgZmllbGQgcGF0aHMgYW5kIG90aGVyXG4gIC8vIHByb3BlcnRpZXMuXG4gIGNvbnN0IG5ld0Vycm9ycyA9IHRvRXJyb3JMaXN0KG5ld0Vycm9yU2NoZW1hKTtcblxuICByZXR1cm4ge1xuICAgIGVycm9yczogbmV3RXJyb3JzLFxuICAgIGVycm9yU2NoZW1hOiBuZXdFcnJvclNjaGVtYSxcbiAgfTtcbn1cblxuLyoqXG4gKiBSZWN1cnNpdmVseSBwcmVmaXhlcyBhbGwgJHJlZidzIGluIGEgc2NoZW1hIHdpdGggYFJPT1RfU0NIRU1BX1BSRUZJWGBcbiAqIFRoaXMgaXMgdXNlZCBpbiBpc1ZhbGlkIHRvIG1ha2UgcmVmZXJlbmNlcyB0byB0aGUgcm9vdFNjaGVtYVxuICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aElkUmVmUHJlZml4KHNjaGVtYU5vZGUpIHtcbiAgbGV0IG9iaiA9IHNjaGVtYU5vZGU7XG4gIGlmIChzY2hlbWFOb2RlLmNvbnN0cnVjdG9yID09PSBPYmplY3QpIHtcbiAgICBvYmogPSB7IC4uLnNjaGVtYU5vZGUgfTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBvYmopIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gb2JqW2tleV07XG4gICAgICBpZiAoXG4gICAgICAgIGtleSA9PT0gXCIkcmVmXCIgJiZcbiAgICAgICAgdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICYmXG4gICAgICAgIHZhbHVlLnN0YXJ0c1dpdGgoXCIjXCIpXG4gICAgICApIHtcbiAgICAgICAgb2JqW2tleV0gPSBST09UX1NDSEVNQV9QUkVGSVggKyB2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9ialtrZXldID0gd2l0aElkUmVmUHJlZml4KHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWFOb2RlKSkge1xuICAgIG9iaiA9IFsuLi5zY2hlbWFOb2RlXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9iai5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqW2ldID0gd2l0aElkUmVmUHJlZml4KG9ialtpXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogVmFsaWRhdGVzIGRhdGEgYWdhaW5zdCBhIHNjaGVtYSwgcmV0dXJuaW5nIHRydWUgaWYgdGhlIGRhdGEgaXMgdmFsaWQsIG9yXG4gKiBmYWxzZSBvdGhlcndpc2UuIElmIHRoZSBzY2hlbWEgaXMgaW52YWxpZCwgdGhlbiB0aGlzIGZ1bmN0aW9uIHdpbGwgcmV0dXJuXG4gKiBmYWxzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzVmFsaWQoc2NoZW1hLCBkYXRhLCByb290U2NoZW1hKSB7XG4gIHRyeSB7XG4gICAgLy8gYWRkIHRoZSByb290U2NoZW1hIFJPT1RfU0NIRU1BX1BSRUZJWCBhcyBpZC5cbiAgICAvLyB0aGVuIHJld3JpdGUgdGhlIHNjaGVtYSByZWYncyB0byBwb2ludCB0byB0aGUgcm9vdFNjaGVtYVxuICAgIC8vIHRoaXMgYWNjb3VudHMgZm9yIHRoZSBjYXNlIHdoZXJlIHNjaGVtYSBoYXZlIHJlZmVyZW5jZXMgdG8gbW9kZWxzXG4gICAgLy8gdGhhdCBsaXZlcyBpbiB0aGUgcm9vdFNjaGVtYSBidXQgbm90IGluIHRoZSBzY2hlbWEgaW4gcXVlc3Rpb24uXG4gICAgcmV0dXJuIGFqdlxuICAgICAgLmFkZFNjaGVtYShyb290U2NoZW1hLCBST09UX1NDSEVNQV9QUkVGSVgpXG4gICAgICAudmFsaWRhdGUod2l0aElkUmVmUHJlZml4KHNjaGVtYSksIGRhdGEpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9IGZpbmFsbHkge1xuICAgIC8vIG1ha2Ugc3VyZSB3ZSByZW1vdmUgdGhlIHJvb3RTY2hlbWEgZnJvbSB0aGUgZ2xvYmFsIGFqdiBpbnN0YW5jZVxuICAgIGFqdi5yZW1vdmVTY2hlbWEoUk9PVF9TQ0hFTUFfUFJFRklYKTtcbiAgfVxufVxuIl19