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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy92YWxpZGF0ZS5qcyJdLCJuYW1lcyI6WyJ0b1BhdGgiLCJBanYiLCJhanYiLCJjcmVhdGVBanZJbnN0YW5jZSIsImRlZXBFcXVhbHMiLCJnZXREZWZhdWx0Rm9ybVN0YXRlIiwiZm9ybWVyQ3VzdG9tRm9ybWF0cyIsImZvcm1lck1ldGFTY2hlbWEiLCJST09UX1NDSEVNQV9QUkVGSVgiLCJpc09iamVjdCIsIm1lcmdlT2JqZWN0cyIsImVycm9yRGF0YVBhdGgiLCJhbGxFcnJvcnMiLCJtdWx0aXBsZU9mUHJlY2lzaW9uIiwic2NoZW1hSWQiLCJ1bmtub3duRm9ybWF0cyIsImFkZEZvcm1hdCIsInRvRXJyb3JTY2hlbWEiLCJlcnJvcnMiLCJsZW5ndGgiLCJyZWR1Y2UiLCJlcnJvclNjaGVtYSIsImVycm9yIiwicHJvcGVydHkiLCJtZXNzYWdlIiwicGF0aCIsInBhcmVudCIsInNwbGljZSIsInNsaWNlIiwic2VnbWVudCIsIkFycmF5IiwiaXNBcnJheSIsIl9fZXJyb3JzIiwiY29uY2F0IiwidG9FcnJvckxpc3QiLCJmaWVsZE5hbWUiLCJlcnJvckxpc3QiLCJtYXAiLCJzdGFjayIsIk9iamVjdCIsImtleXMiLCJhY2MiLCJrZXkiLCJjcmVhdGVFcnJvckhhbmRsZXIiLCJmb3JtRGF0YSIsImhhbmRsZXIiLCJhZGRFcnJvciIsInB1c2giLCJ2YWx1ZSIsInVud3JhcEVycm9ySGFuZGxlciIsImVycm9ySGFuZGxlciIsInRyYW5zZm9ybUFqdkVycm9ycyIsImUiLCJkYXRhUGF0aCIsImtleXdvcmQiLCJwYXJhbXMiLCJzY2hlbWFQYXRoIiwibmFtZSIsInRyaW0iLCJ2YWxpZGF0ZUZvcm1EYXRhIiwic2NoZW1hIiwiY3VzdG9tVmFsaWRhdGUiLCJ0cmFuc2Zvcm1FcnJvcnMiLCJhZGRpdGlvbmFsTWV0YVNjaGVtYXMiLCJjdXN0b21Gb3JtYXRzIiwidmFsaWRhdGVTY2hlbWEiLCJyb290U2NoZW1hIiwibmV3TWV0YVNjaGVtYXMiLCJuZXdGb3JtYXRzIiwiYWRkTWV0YVNjaGVtYSIsImZvckVhY2giLCJmb3JtYXROYW1lIiwidmFsaWRhdGlvbkVycm9yIiwidmFsaWRhdGUiLCJlcnIiLCJub1Byb3Blck1ldGFTY2hlbWEiLCJpbmNsdWRlcyIsIiRzY2hlbWEiLCJ1c2VyRXJyb3JTY2hlbWEiLCJuZXdFcnJvclNjaGVtYSIsIm5ld0Vycm9ycyIsIndpdGhJZFJlZlByZWZpeCIsInNjaGVtYU5vZGUiLCJvYmoiLCJjb25zdHJ1Y3RvciIsInN0YXJ0c1dpdGgiLCJpIiwiaXNWYWxpZCIsImRhdGEiLCJhZGRTY2hlbWEiLCJyZW1vdmVTY2hlbWEiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLE9BQU9BLE1BQVAsTUFBbUIsZUFBbkI7QUFDQSxPQUFPQyxHQUFQLE1BQWdCLEtBQWhCO0FBQ0EsSUFBSUMsR0FBRyxHQUFHQyxpQkFBaUIsRUFBM0I7QUFDQSxTQUFTQyxVQUFULEVBQXFCQyxtQkFBckIsUUFBZ0QsU0FBaEQ7QUFFQSxJQUFJQyxtQkFBbUIsR0FBRyxJQUExQjtBQUNBLElBQUlDLGdCQUFnQixHQUFHLElBQXZCO0FBQ0EsSUFBTUMsa0JBQWtCLEdBQUcsbUJBQTNCO0FBRUEsU0FBU0MsUUFBVCxFQUFtQkMsWUFBbkIsUUFBdUMsU0FBdkM7O0FBRUEsU0FBU1AsaUJBQVQsR0FBNkI7QUFDM0IsTUFBTUQsR0FBRyxHQUFHLElBQUlELEdBQUosQ0FBUTtBQUNsQlUsSUFBQUEsYUFBYSxFQUFFLFVBREc7QUFFbEJDLElBQUFBLFNBQVMsRUFBRSxJQUZPO0FBR2xCQyxJQUFBQSxtQkFBbUIsRUFBRSxDQUhIO0FBSWxCQyxJQUFBQSxRQUFRLEVBQUUsTUFKUTtBQUtsQkMsSUFBQUEsY0FBYyxFQUFFO0FBTEUsR0FBUixDQUFaLENBRDJCLENBUzNCOztBQUNBYixFQUFBQSxHQUFHLENBQUNjLFNBQUosQ0FDRSxVQURGLEVBRUUsMkRBRkY7QUFJQWQsRUFBQUEsR0FBRyxDQUFDYyxTQUFKLENBQ0UsT0FERixFQUVFLDRZQUZGO0FBSUEsU0FB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O0FBQ0Q7QUFDRjtBQUNGLEdBZEQsTUFjTyxJQUFJbEIsS0FBSyxDQUFDQyxPQUFOLENBQWNtRCxVQUFkLENBQUosRUFBK0I7QUFDcENDLElBQUFBLEdBQUcsc0JBQU9ELFVBQVAsQ0FBSDs7QUFDQSxTQUFLLElBQUlJLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdILEdBQUcsQ0FBQ2hFLE1BQXhCLEVBQWdDbUUsQ0FBQyxFQUFqQyxFQUFxQztBQUNuQ0gsTUFBQUEsR0FBRyxDQUFDRyxDQUFELENBQUgsR0FBU0wsZUFBZSxDQUFDRSxHQUFHLENBQUNHLENBQUQsQ0FBSixDQUF4QjtBQUNEO0FBQ0Y7O0FBQ0QsU0FBT0gsR0FBUDtBQUNEO0FBRUQ7Ozs7OztBQUtBLE9BQU8sU0FBU0ksT0FBVCxDQUFpQjNCLE1BQWpCLEVBQXlCNEIsSUFBekIsRUFBK0J0QixVQUEvQixFQUEyQztBQUNoRCxNQUFJO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFPaEUsR0FBRyxDQUNQdUYsU0FESSxDQUNNdkIsVUFETixFQUNrQjFELGtCQURsQixFQUVKaUUsUUFGSSxDQUVLUSxlQUFlLENBQUNyQixNQUFELENBRnBCLEVBRThCNEIsSUFGOUIsQ0FBUDtBQUdELEdBUkQsQ0FRRSxPQUFPcEMsQ0FBUCxFQUFVO0FBQ1YsV0FBTyxLQUFQO0FBQ0QsR0FWRCxTQVVVO0FBQ1I7QUFDQWxELElBQUFBLEdBQUcsQ0FBQ3dGLFlBQUosQ0FBaUJsRixrQkFBakI7QUFDRDtBQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHRvUGF0aCBmcm9tIFwibG9kYXNoL3RvUGF0aFwiO1xuaW1wb3J0IEFqdiBmcm9tIFwiYWp2XCI7XG5sZXQgYWp2ID0gY3JlYXRlQWp2SW5zdGFuY2UoKTtcbmltcG9ydCB7IGRlZXBFcXVhbHMsIGdldERlZmF1bHRGb3JtU3RhdGUgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5sZXQgZm9ybWVyQ3VzdG9tRm9ybWF0cyA9IG51bGw7XG5sZXQgZm9ybWVyTWV0YVNjaGVtYSA9IG51bGw7XG5jb25zdCBST09UX1NDSEVNQV9QUkVGSVggPSBcIl9fcmpzZl9yb290U2NoZW1hXCI7XG5cbmltcG9ydCB7IGlzT2JqZWN0LCBtZXJnZU9iamVjdHMgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5mdW5jdGlvbiBjcmVhdGVBanZJbnN0YW5jZSgpIHtcbiAgY29uc3QgYWp2ID0gbmV3IEFqdih7XG4gICAgZXJyb3JEYXRhUGF0aDogXCJwcm9wZXJ0eVwiLFxuICAgIGFsbEVycm9yczogdHJ1ZSxcbiAgICBtdWx0aXBsZU9mUHJlY2lzaW9uOiA4LFxuICAgIHNjaGVtYUlkOiBcImF1dG9cIixcbiAgICB1bmtub3duRm9ybWF0czogXCJpZ25vcmVcIixcbiAgfSk7XG5cbiAgLy8gYWRkIGN1c3RvbSBmb3JtYXRzXG4gIGFqdi5hZGRGb3JtYXQoXG4gICAgXCJkYXRhLXVybFwiLFxuICAgIC9eZGF0YTooW2Etel0rXFwvW2EtejAtOS0rLl0rKT87KD86bmFtZT0oLiopOyk/YmFzZTY0LCguKikkL1xuICApO1xuICBhanYuYWRkRm9ybWF0KFxuICAgIFwiY29sb3JcIixcbiAgICAvXigjPyhbMC05QS1GYS1mXXszfSl7MSwyfVxcYnxhcXVhfGJsYWNrfGJsdWV8ZnVjaHNpYXxncmF5fGdyZWVufGxpbWV8bWFyb29ufG5hdnl8b2xpdmV8b3JhbmdlfHB1cnBsZXxyZWR8c2lsdmVyfHRlYWx8d2hpdGV8eWVsbG93fChyZ2JcXChcXHMqXFxiKFswLTldfFsxLTldWzAtOV18MVswLTldWzAtOV18MlswLTRdWzAtOV18MjVbMC01XSlcXGJcXHMqLFxccypcXGIoWzAtOV18WzEtOV1bMC05XXwxWzAtOV1bMC05XXwyWzAtNF1bMC05XXwyNVswLTVdKVxcYlxccyosXFxzKlxcYihbMC05XXxbMS05XVswLTldfDFbMC05XVswLTldfDJbMC00XVswLTldfDI1WzAtNV0pXFxiXFxzKlxcKSl8KHJnYlxcKFxccyooXFxkP1xcZCV8MTAwJSkrXFxzKixcXHMqKFxcZD9cXGQlfDEwMCUpK1xccyosXFxzKihcXGQ/XFxkJXwxMDAlKStcXHMqXFwpKSkkL1xuICApO1xuICByZXR1cm4gYWp2O1xufVxuXG5mdW5jdGlvbiB0b0Vycm9yU2NoZW1hKGVycm9ycykge1xuICAvLyBUcmFuc2Zvcm1zIGEgYWp2IHZhbGlkYXRpb24gZXJyb3JzIGxpc3Q6XG4gIC8vIFtcbiAgLy8gICB7cHJvcGVydHk6IFwiLmxldmVsMS5sZXZlbDJbMl0ubGV2ZWwzXCIsIG1lc3NhZ2U6IFwiZXJyIGFcIn0sXG4gIC8vICAge3Byb3BlcnR5OiBcIi5sZXZlbDEubGV2ZWwyWzJdLmxldmVsM1wiLCBtZXNzYWdlOiBcImVyciBiXCJ9LFxuICAvLyAgIHtwcm9wZXJ0eTogXCIubGV2ZWwxLmxldmVsMls0XS5sZXZlbDNcIiwgbWVzc2FnZTogXCJlcnIgYlwifSxcbiAgLy8gXVxuICAvLyBJbnRvIGFuIGVycm9yIHRyZWU6XG4gIC8vIHtcbiAgLy8gICBsZXZlbDE6IHtcbiAgLy8gICAgIGxldmVsMjoge1xuICAvLyAgICAgICAyOiB7bGV2ZWwzOiB7ZXJyb3JzOiBbXCJlcnIgYVwiLCBcImVyciBiXCJdfX0sXG4gIC8vICAgICAgIDQ6IHtsZXZlbDM6IHtlcnJvcnM6IFtcImVyciBiXCJdfX0sXG4gIC8vICAgICB9XG4gIC8vICAgfVxuICAvLyB9O1xuICBpZiAoIWVycm9ycy5sZW5ndGgpIHtcbiAgICByZXR1cm4ge307XG4gIH1cbiAgcmV0dXJuIGVycm9ycy5yZWR1Y2UoKGVycm9yU2NoZW1hLCBlcnJvcikgPT4ge1xuICAgIGNvbnN0IHsgcHJvcGVydHksIG1lc3NhZ2UgfSA9IGVycm9yO1xuICAgIGNvbnN0IHBhdGggPSB0b1BhdGgocHJvcGVydHkpO1xuICAgIGxldCBwYXJlbnQgPSBlcnJvclNjaGVtYTtcblxuICAgIC8vIElmIHRoZSBwcm9wZXJ0eSBpcyBhdCB0aGUgcm9vdCAoLmxldmVsMSkgdGhlbiB0b1BhdGggY3JlYXRlc1xuICAgIC8vIGFuIGVtcHR5IGFycmF5IGVsZW1lbnQgYXQgdGhlIGZpcnN0IGluZGV4LiBSZW1vdmUgaXQuXG4gICAgaWYgKHBhdGgubGVuZ3RoID4gMCAmJiBwYXRoWzBdID09PSBcIlwiKSB7XG4gICAgICBwYXRoLnNwbGljZSgwLCAxKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHNlZ21lbnQgb2YgcGF0aC5zbGljZSgwKSkge1xuICAgICAgaWYgKCEoc2VnbWVudCBpbiBwYXJlbnQpKSB7XG4gICAgICAgIHBhcmVudFtzZWdtZW50XSA9IHt9O1xuICAgICAgfVxuICAgICAgcGFyZW50ID0gcGFyZW50W3NlZ21lbnRdO1xuICAgIH1cblxuICAgIGlmIChBcnJheS5pc0FycmF5KHBhcmVudC5fX2Vycm9ycykpIHtcbiAgICAgIC8vIFdlIHN0b3JlIHRoZSBsaXN0IG9mIGVycm9ycyBmb3IgdGhpcyBub2RlIGluIGEgcHJvcGVydHkgbmFtZWQgX19lcnJvcnNcbiAgICAgIC8vIHRvIGF2b2lkIG5hbWUgY29sbGlzaW9uIHdpdGggYSBwb3NzaWJsZSBzdWIgc2NoZW1hIGZpZWxkIG5hbWVkXG4gICAgICAvLyBcImVycm9yc1wiIChzZWUgYHZhbGlkYXRlLmNyZWF0ZUVycm9ySGFuZGxlcmApLlxuICAgICAgcGFyZW50Ll9fZXJyb3JzID0gcGFyZW50Ll9fZXJyb3JzLmNvbmNhdChtZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG1lc3NhZ2UpIHtcbiAgICAgICAgcGFyZW50Ll9fZXJyb3JzID0gW21lc3NhZ2VdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZXJyb3JTY2hlbWE7XG4gIH0sIHt9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvRXJyb3JMaXN0KGVycm9yU2NoZW1hLCBmaWVsZE5hbWUgPSBcInJvb3RcIikge1xuICAvLyBYWFg6IFdlIHNob3VsZCB0cmFuc2Zvcm0gZmllbGROYW1lIGFzIGEgZnVsbCBmaWVsZCBwYXRoIHN0cmluZy5cbiAgbGV0IGVycm9yTGlzdCA9IFtdO1xuICBpZiAoXCJfX2Vycm9yc1wiIGluIGVycm9yU2NoZW1hKSB7XG4gICAgZXJyb3JMaXN0ID0gZXJyb3JMaXN0LmNvbmNhdChcbiAgICAgIGVycm9yU2NoZW1hLl9fZXJyb3JzLm1hcChzdGFjayA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3RhY2s6IGAke2ZpZWxkTmFtZX06ICR7c3RhY2t9YCxcbiAgICAgICAgfTtcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuICByZXR1cm4gT2JqZWN0LmtleXMoZXJyb3JTY2hlbWEpLnJlZHVjZSgoYWNjLCBrZXkpID0+IHtcbiAgICBpZiAoa2V5ICE9PSBcIl9fZXJyb3JzXCIpIHtcbiAgICAgIGFjYyA9IGFjYy5jb25jYXQodG9FcnJvckxpc3QoZXJyb3JTY2hlbWFba2V5XSwga2V5KSk7XG4gICAgfVxuICAgIHJldHVybiBhY2M7XG4gIH0sIGVycm9yTGlzdCk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUVycm9ySGFuZGxlcihmb3JtRGF0YSkge1xuICBjb25zdCBoYW5kbGVyID0ge1xuICAgIC8vIFdlIHN0b3JlIHRoZSBsaXN0IG9mIGVycm9ycyBmb3IgdGhpcyBub2RlIGluIGEgcHJvcGVydHkgbmFtZWQgX19lcnJvcnNcbiAgICAvLyB0byBhdm9pZCBuYW1lIGNvbGxpc2lvbiB3aXRoIGEgcG9zc2libGUgc3ViIHNjaGVtYSBmaWVsZCBuYW1lZFxuICAgIC8vIFwiZXJyb3JzXCIgKHNlZSBgdXRpbHMudG9FcnJvclNjaGVtYWApLlxuICAgIF9fZXJyb3JzOiBbXSxcbiAgICBhZGRFcnJvcihtZXNzYWdlKSB7XG4gICAgICB0aGlzLl9fZXJyb3JzLnB1c2gobWVzc2FnZSk7XG4gICAgfSxcbiAgfTtcbiAgaWYgKGlzT2JqZWN0KGZvcm1EYXRhKSkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhmb3JtRGF0YSkucmVkdWNlKChhY2MsIGtleSkgPT4ge1xuICAgICAgcmV0dXJuIHsgLi4uYWNjLCBba2V5XTogY3JlYXRlRXJyb3JIYW5kbGVyKGZvcm1EYXRhW2tleV0pIH07XG4gICAgfSwgaGFuZGxlcik7XG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkoZm9ybURhdGEpKSB7XG4gICAgcmV0dXJuIGZvcm1EYXRhLnJlZHVjZSgoYWNjLCB2YWx1ZSwga2V5KSA9PiB7XG4gICAgICByZXR1cm4geyAuLi5hY2MsIFtrZXldOiBjcmVhdGVFcnJvckhhbmRsZXIodmFsdWUpIH07XG4gICAgfSwgaGFuZGxlcik7XG4gIH1cbiAgcmV0dXJuIGhhbmRsZXI7XG59XG5cbmZ1bmN0aW9uIHVud3JhcEVycm9ySGFuZGxlcihlcnJvckhhbmRsZXIpIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKGVycm9ySGFuZGxlcikucmVkdWNlKChhY2MsIGtleSkgPT4ge1xuICAgIGlmIChrZXkgPT09IFwiYWRkRXJyb3JcIikge1xuICAgICAgcmV0dXJuIGFjYztcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gXCJfX2Vycm9yc1wiKSB7XG4gICAgICByZXR1cm4geyAuLi5hY2MsIFtrZXldOiBlcnJvckhhbmRsZXJba2V5XSB9O1xuICAgIH1cbiAgICByZXR1cm4geyAuLi5hY2MsIFtrZXldOiB1bndyYXBFcnJvckhhbmRsZXIoZXJyb3JIYW5kbGVyW2tleV0pIH07XG4gIH0sIHt9KTtcbn1cblxuLyoqXG4gKiBUcmFuc2Zvcm1pbmcgdGhlIGVycm9yIG91dHB1dCBmcm9tIGFqdiB0byBmb3JtYXQgdXNlZCBieSBqc29uc2NoZW1hLlxuICogQXQgc29tZSBwb2ludCwgY29tcG9uZW50cyBzaG91bGQgYmUgdXBkYXRlZCB0byBzdXBwb3J0IGFqdi5cbiAqL1xuZnVuY3Rpb24gdHJhbnNmb3JtQWp2RXJyb3JzKGVycm9ycyA9IFtdKSB7XG4gIGlmIChlcnJvcnMgPT09IG51bGwpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICByZXR1cm4gZXJyb3JzLm1hcChlID0+IHtcbiAgICBjb25zdCB7IGRhdGFQYXRoLCBrZXl3b3JkLCBtZXNzYWdlLCBwYXJhbXMsIHNjaGVtYVBhdGggfSA9IGU7XG4gICAgbGV0IHByb3BlcnR5ID0gYCR7ZGF0YVBhdGh9YDtcblxuICAgIC8vIHB1dCBkYXRhIGluIGV4cGVjdGVkIGZvcm1hdFxuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiBrZXl3b3JkLFxuICAgICAgcHJvcGVydHksXG4gICAgICBtZXNzYWdlLFxuICAgICAgcGFyYW1zLCAvLyBzcGVjaWZpYyB0byBhanZcbiAgICAgIHN0YWNrOiBgJHtwcm9wZXJ0eX0gJHttZXNzYWdlfWAudHJpbSgpLFxuICAgICAgc2NoZW1hUGF0aCxcbiAgICB9O1xuICB9KTtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIHByb2Nlc3NlcyB0aGUgZm9ybURhdGEgd2l0aCBhIHVzZXIgYHZhbGlkYXRlYCBjb250cmlidXRlZFxuICogZnVuY3Rpb24sIHdoaWNoIHJlY2VpdmVzIHRoZSBmb3JtIGRhdGEgYW5kIGFuIGBlcnJvckhhbmRsZXJgIG9iamVjdCB0aGF0XG4gKiB3aWxsIGJlIHVzZWQgdG8gYWRkIGN1c3RvbSB2YWxpZGF0aW9uIGVycm9ycyBmb3IgZWFjaCBmaWVsZC5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gdmFsaWRhdGVGb3JtRGF0YShcbiAgZm9ybURhdGEsXG4gIHNjaGVtYSxcbiAgY3VzdG9tVmFsaWRhdGUsXG4gIHRyYW5zZm9ybUVycm9ycyxcbiAgYWRkaXRpb25hbE1ldGFTY2hlbWFzID0gW10sXG4gIGN1c3RvbUZvcm1hdHMgPSB7fSxcbiAgdmFsaWRhdGVTY2hlbWFcbikge1xuICBpZiAodmFsaWRhdGVTY2hlbWEpIHtcbiAgICBzY2hlbWEgPSB2YWxpZGF0ZVNjaGVtYTtcbiAgfVxuICAvLyBJbmNsdWRlIGZvcm0gZGF0YSB3aXRoIHVuZGVmaW5lZCB2YWx1ZXMsIHdoaWNoIGlzIHJlcXVpcmVkIGZvciB2YWxpZGF0aW9uLlxuICBjb25zdCByb290U2NoZW1hID0gc2NoZW1hO1xuICBmb3JtRGF0YSA9IGdldERlZmF1bHRGb3JtU3RhdGUoc2NoZW1hLCBmb3JtRGF0YSwgcm9vdFNjaGVtYSwgdHJ1ZSk7XG5cbiAgY29uc3QgbmV3TWV0YVNjaGVtYXMgPSAhZGVlcEVxdWFscyhmb3JtZXJNZXRhU2NoZW1hLCBhZGRpdGlvbmFsTWV0YVNjaGVtYXMpO1xuICBjb25zdCBuZXdGb3JtYXRzID0gIWRlZXBFcXVhbHMoZm9ybWVyQ3VzdG9tRm9ybWF0cywgY3VzdG9tRm9ybWF0cyk7XG5cbiAgaWYgKG5ld01ldGFTY2hlbWFzIHx8IG5ld0Zvcm1hdHMpIHtcbiAgICBhanYgPSBjcmVhdGVBanZJbnN0YW5jZSgpO1xuICB9XG5cbiAgLy8gYWRkIG1vcmUgc2NoZW1hcyB0byB2YWxpZGF0ZSBhZ2FpbnN0XG4gIGlmIChcbiAgICBhZGRpdGlvbmFsTWV0YVNjaGVtYXMgJiZcbiAgICBuZXdNZXRhU2NoZW1hcyAmJlxuICAgIEFycmF5LmlzQXJyYXkoYWRkaXRpb25hbE1ldGFTY2hlbWFzKVxuICApIHtcbiAgICBhanYuYWRkTWV0YVNjaGVtYShhZGRpdGlvbmFsTWV0YVNjaGVtYXMpO1xuICAgIGZvcm1lck1ldGFTY2hlbWEgPSBhZGRpdGlvbmFsTWV0YVNjaGVtYXM7XG4gIH1cblxuICAvLyBhZGQgbW9yZSBjdXN0b20gZm9ybWF0cyB0byB2YWxpZGF0ZSBhZ2FpbnN0XG4gIGlmIChjdXN0b21Gb3JtYXRzICYmIG5ld0Zvcm1hdHMgJiYgaXNPYmplY3QoY3VzdG9tRm9ybWF0cykpIHtcbiAgICBPYmplY3Qua2V5cyhjdXN0b21Gb3JtYXRzKS5mb3JFYWNoKGZvcm1hdE5hbWUgPT4ge1xuICAgICAgYWp2LmFkZEZvcm1hdChmb3JtYXROYW1lLCBjdXN0b21Gb3JtYXRzW2Zvcm1hdE5hbWVdKTtcbiAgICB9KTtcblxuICAgIGZvcm1lckN1c3RvbUZvcm1hdHMgPSBjdXN0b21Gb3JtYXRzO1xuICB9XG5cbiAgbGV0IHZhbGlkYXRpb25FcnJvciA9IG51bGw7XG4gIHRyeSB7XG4gICAgYWp2LnZhbGlkYXRlKHNjaGVtYSwgZm9ybURhdGEpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB2YWxpZGF0aW9uRXJyb3IgPSBlcnI7XG4gIH1cblxuICBsZXQgZXJyb3JzID0gdHJhbnNmb3JtQWp2RXJyb3JzKGFqdi5lcnJvcnMpO1xuICAvLyBDbGVhciBlcnJvcnMgdG8gcHJldmVudCBwZXJzaXN0ZW50IGVycm9ycywgc2VlICMxMTA0XG5cbiAgYWp2LmVycm9ycyA9IG51bGw7XG5cbiAgY29uc3Qgbm9Qcm9wZXJNZXRhU2NoZW1hID1cbiAgICB2YWxpZGF0aW9uRXJyb3IgJiZcbiAgICB2YWxpZGF0aW9uRXJyb3IubWVzc2FnZSAmJlxuICAgIHR5cGVvZiB2YWxpZGF0aW9uRXJyb3IubWVzc2FnZSA9PT0gXCJzdHJpbmdcIiAmJlxuICAgIHZhbGlkYXRpb25FcnJvci5tZXNzYWdlLmluY2x1ZGVzKFwibm8gc2NoZW1hIHdpdGgga2V5IG9yIHJlZiBcIik7XG5cbiAgaWYgKG5vUHJvcGVyTWV0YVNjaGVtYSkge1xuICAgIGVycm9ycyA9IFtcbiAgICAgIC4uLmVycm9ycyxcbiAgICAgIHtcbiAgICAgICAgc3RhY2s6IHZhbGlkYXRpb25FcnJvci5tZXNzYWdlLFxuICAgICAgfSxcbiAgICBdO1xuICB9XG4gIGlmICh0eXBlb2YgdHJhbnNmb3JtRXJyb3JzID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBlcnJvcnMgPSB0cmFuc2Zvcm1FcnJvcnMoZXJyb3JzKTtcbiAgfVxuXG4gIGxldCBlcnJvclNjaGVtYSA9IHRvRXJyb3JTY2hlbWEoZXJyb3JzKTtcblxuICBpZiAobm9Qcm9wZXJNZXRhU2NoZW1hKSB7XG4gICAgZXJyb3JTY2hlbWEgPSB7XG4gICAgICAuLi5lcnJvclNjaGVtYSxcbiAgICAgIC4uLntcbiAgICAgICAgJHNjaGVtYToge1xuICAgICAgICAgIF9fZXJyb3JzOiBbdmFsaWRhdGlvbkVycm9yLm1lc3NhZ2VdLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgaWYgKHR5cGVvZiBjdXN0b21WYWxpZGF0ZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgcmV0dXJuIHsgZXJyb3JzLCBlcnJvclNjaGVtYSB9O1xuICB9XG5cbiAgY29uc3QgZXJyb3JIYW5kbGVyID0gY3VzdG9tVmFsaWRhdGUoZm9ybURhdGEsIGNyZWF0ZUVycm9ySGFuZGxlcihmb3JtRGF0YSkpO1xuICBjb25zdCB1c2VyRXJyb3JTY2hlbWEgPSB1bndyYXBFcnJvckhhbmRsZXIoZXJyb3JIYW5kbGVyKTtcbiAgY29uc3QgbmV3RXJyb3JTY2hlbWEgPSBtZXJnZU9iamVjdHMoZXJyb3JTY2hlbWEsIHVzZXJFcnJvclNjaGVtYSwgdHJ1ZSk7XG4gIC8vIFhYWDogVGhlIGVycm9ycyBsaXN0IHByb2R1Y2VkIGlzIG5vdCBmdWxseSBjb21wbGlhbnQgd2l0aCB0aGUgZm9ybWF0XG4gIC8vIGV4cG9zZWQgYnkgdGhlIGpzb25zY2hlbWEgbGliLCB3aGljaCBjb250YWlucyBmdWxsIGZpZWxkIHBhdGhzIGFuZCBvdGhlclxuICAvLyBwcm9wZXJ0aWVzLlxuICBjb25zdCBuZXdFcnJvcnMgPSB0b0Vycm9yTGlzdChuZXdFcnJvclNjaGVtYSk7XG5cbiAgcmV0dXJuIHtcbiAgICBlcnJvcnM6IG5ld0Vycm9ycyxcbiAgICBlcnJvclNjaGVtYTogbmV3RXJyb3JTY2hlbWEsXG4gIH07XG59XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgcHJlZml4ZXMgYWxsICRyZWYncyBpbiBhIHNjaGVtYSB3aXRoIGBST09UX1NDSEVNQV9QUkVGSVhgXG4gKiBUaGlzIGlzIHVzZWQgaW4gaXNWYWxpZCB0byBtYWtlIHJlZmVyZW5jZXMgdG8gdGhlIHJvb3RTY2hlbWFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhJZFJlZlByZWZpeChzY2hlbWFOb2RlKSB7XG4gIGxldCBvYmogPSBzY2hlbWFOb2RlO1xuICBpZiAoc2NoZW1hTm9kZS5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0KSB7XG4gICAgb2JqID0geyAuLi5zY2hlbWFOb2RlIH07XG4gICAgZm9yIChjb25zdCBrZXkgaW4gb2JqKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IG9ialtrZXldO1xuICAgICAgaWYgKFxuICAgICAgICBrZXkgPT09IFwiJHJlZlwiICYmXG4gICAgICAgIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJlxuICAgICAgICB2YWx1ZS5zdGFydHNXaXRoKFwiI1wiKVxuICAgICAgKSB7XG4gICAgICAgIG9ialtrZXldID0gUk9PVF9TQ0hFTUFfUFJFRklYICsgdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvYmpba2V5XSA9IHdpdGhJZFJlZlByZWZpeCh2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoc2NoZW1hTm9kZSkpIHtcbiAgICBvYmogPSBbLi4uc2NoZW1hTm9kZV07XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmoubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9ialtpXSA9IHdpdGhJZFJlZlByZWZpeChvYmpbaV0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIFZhbGlkYXRlcyBkYXRhIGFnYWluc3QgYSBzY2hlbWEsIHJldHVybmluZyB0cnVlIGlmIHRoZSBkYXRhIGlzIHZhbGlkLCBvclxuICogZmFsc2Ugb3RoZXJ3aXNlLiBJZiB0aGUgc2NoZW1hIGlzIGludmFsaWQsIHRoZW4gdGhpcyBmdW5jdGlvbiB3aWxsIHJldHVyblxuICogZmFsc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbGlkKHNjaGVtYSwgZGF0YSwgcm9vdFNjaGVtYSkge1xuICB0cnkge1xuICAgIC8vIGFkZCB0aGUgcm9vdFNjaGVtYSBST09UX1NDSEVNQV9QUkVGSVggYXMgaWQuXG4gICAgLy8gdGhlbiByZXdyaXRlIHRoZSBzY2hlbWEgcmVmJ3MgdG8gcG9pbnQgdG8gdGhlIHJvb3RTY2hlbWFcbiAgICAvLyB0aGlzIGFjY291bnRzIGZvciB0aGUgY2FzZSB3aGVyZSBzY2hlbWEgaGF2ZSByZWZlcmVuY2VzIHRvIG1vZGVsc1xuICAgIC8vIHRoYXQgbGl2ZXMgaW4gdGhlIHJvb3RTY2hlbWEgYnV0IG5vdCBpbiB0aGUgc2NoZW1hIGluIHF1ZXN0aW9uLlxuICAgIHJldHVybiBhanZcbiAgICAgIC5hZGRTY2hlbWEocm9vdFNjaGVtYSwgUk9PVF9TQ0hFTUFfUFJFRklYKVxuICAgICAgLnZhbGlkYXRlKHdpdGhJZFJlZlByZWZpeChzY2hlbWEpLCBkYXRhKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSBmaW5hbGx5IHtcbiAgICAvLyBtYWtlIHN1cmUgd2UgcmVtb3ZlIHRoZSByb290U2NoZW1hIGZyb20gdGhlIGdsb2JhbCBhanYgaW5zdGFuY2VcbiAgICBhanYucmVtb3ZlU2NoZW1hKFJPT1RfU0NIRU1BX1BSRUZJWCk7XG4gIH1cbn1cbiJdfQ==