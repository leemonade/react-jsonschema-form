"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toErrorList = toErrorList;
exports["default"] = validateFormData;
exports.withIdRefPrefix = withIdRefPrefix;
exports.isValid = isValid;

var _toPath = _interopRequireDefault(require("lodash/toPath"));

var _ajv = _interopRequireDefault(require("ajv"));

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var ajv = createAjvInstance();
var formerCustomFormats = null;
var formerMetaSchema = null;
var ROOT_SCHEMA_PREFIX = "__rjsf_rootSchema";

function createAjvInstance() {
  var ajv = new _ajv["default"]({
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
    var path = (0, _toPath["default"])(property);
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

function toErrorList(errorSchema) {
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

  if ((0, _utils.isObject)(formData)) {
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


function validateFormData(formData, schema, customValidate, transformErrors) {
  var additionalMetaSchemas = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];
  var customFormats = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
  var validateSchema = arguments.length > 6 ? arguments[6] : undefined;

  if (validateSchema) {
    schema = validateSchema;
  } // Include form data with undefined values, which is required for validation.


  var rootSchema = schema;
  formData = (0, _utils.getDefaultFormState)(schema, formData, rootSchema, true);
  var newMetaSchemas = !(0, _utils.deepEquals)(formerMetaSchema, additionalMetaSchemas);
  var newFormats = !(0, _utils.deepEquals)(formerCustomFormats, customFormats);

  if (newMetaSchemas || newFormats) {
    ajv = createAjvInstance();
  } // add more schemas to validate against


  if (additionalMetaSchemas && newMetaSchemas && Array.isArray(additionalMetaSchemas)) {
    ajv.addMetaSchema(additionalMetaSchemas);
    formerMetaSchema = additionalMetaSchemas;
  } // add more custom formats to validate against


  if (customFormats && newFormats && (0, _utils.isObject)(customFormats)) {
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
  var newErrorSchema = (0, _utils.mergeObjects)(errorSchema, userErrorSchema, true); // XXX: The errors list produced is not fully compliant with the format
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


function withIdRefPrefix(schemaNode) {
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


function isValid(schema, data, rootSchema) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy92YWxpZGF0ZS5qcyJdLCJuYW1lcyI6WyJhanYiLCJjcmVhdGVBanZJbnN0YW5jZSIsImZvcm1lckN1c3RvbUZvcm1hdHMiLCJmb3JtZXJNZXRhU2NoZW1hIiwiUk9PVF9TQ0hFTUFfUFJFRklYIiwiQWp2IiwiZXJyb3JEYXRhUGF0aCIsImFsbEVycm9ycyIsIm11bHRpcGxlT2ZQcmVjaXNpb24iLCJzY2hlbWFJZCIsInVua25vd25Gb3JtYXRzIiwiYWRkRm9ybWF0IiwidG9FcnJvclNjaGVtYSIsImVycm9ycyIsImxlbmd0aCIsInJlZHVjZSIsImVycm9yU2NoZW1hIiwiZXJyb3IiLCJwcm9wZXJ0eSIsIm1lc3NhZ2UiLCJwYXRoIiwicGFyZW50Iiwic3BsaWNlIiwic2xpY2UiLCJzZWdtZW50IiwiQXJyYXkiLCJpc0FycmF5IiwiX19lcnJvcnMiLCJjb25jYXQiLCJ0b0Vycm9yTGlzdCIsImZpZWxkTmFtZSIsImVycm9yTGlzdCIsIm1hcCIsInN0YWNrIiwiT2JqZWN0Iiwia2V5cyIsImFjYyIsImtleSIsImNyZWF0ZUVycm9ySGFuZGxlciIsImZvcm1EYXRhIiwiaGFuZGxlciIsImFkZEVycm9yIiwicHVzaCIsInZhbHVlIiwidW53cmFwRXJyb3JIYW5kbGVyIiwiZXJyb3JIYW5kbGVyIiwidHJhbnNmb3JtQWp2RXJyb3JzIiwiZSIsImRhdGFQYXRoIiwia2V5d29yZCIsInBhcmFtcyIsInNjaGVtYVBhdGgiLCJuYW1lIiwidHJpbSIsInZhbGlkYXRlRm9ybURhdGEiLCJzY2hlbWEiLCJjdXN0b21WYWxpZGF0ZSIsInRyYW5zZm9ybUVycm9ycyIsImFkZGl0aW9uYWxNZXRhU2NoZW1hcyIsImN1c3RvbUZvcm1hdHMiLCJ2YWxpZGF0ZVNjaGVtYSIsInJvb3RTY2hlbWEiLCJuZXdNZXRhU2NoZW1hcyIsIm5ld0Zvcm1hdHMiLCJhZGRNZXRhU2NoZW1hIiwiZm9yRWFjaCIsImZvcm1hdE5hbWUiLCJ2YWxpZGF0aW9uRXJyb3IiLCJ2YWxpZGF0ZSIsImVyciIsIm5vUHJvcGVyTWV0YVNjaGVtYSIsImluY2x1ZGVzIiwiJHNjaGVtYSIsInVzZXJFcnJvclNjaGVtYSIsIm5ld0Vycm9yU2NoZW1hIiwibmV3RXJyb3JzIiwid2l0aElkUmVmUHJlZml4Iiwic2NoZW1hTm9kZSIsIm9iaiIsImNvbnN0cnVjdG9yIiwic3RhcnRzV2l0aCIsImkiLCJpc1ZhbGlkIiwiZGF0YSIsImFkZFNjaGVtYSIsInJlbW92ZVNjaGVtYSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7O0FBREEsSUFBSUEsR0FBRyxHQUFHQyxpQkFBaUIsRUFBM0I7QUFHQSxJQUFJQyxtQkFBbUIsR0FBRyxJQUExQjtBQUNBLElBQUlDLGdCQUFnQixHQUFHLElBQXZCO0FBQ0EsSUFBTUMsa0JBQWtCLEdBQUcsbUJBQTNCOztBQUlBLFNBQVNILGlCQUFULEdBQTZCO0FBQzNCLE1BQU1ELEdBQUcsR0FBRyxJQUFJSyxlQUFKLENBQVE7QUFDbEJDLElBQUFBLGFBQWEsRUFBRSxVQURHO0FBRWxCQyxJQUFBQSxTQUFTLEVBQUUsSUFGTztBQUdsQkMsSUFBQUEsbUJBQW1CLEVBQUUsQ0FISDtBQUlsQkMsSUFBQUEsUUFBUSxFQUFFLE1BSlE7QUFLbEJDLElBQUFBLGNBQWMsRUFBRTtBQUxFLEdBQVIsQ0FBWixDQUQyQixDQVMzQjs7QUFDQVYsRUFBQUEsR0FBRyxDQUFDVyxTQUFKLENBQ0UsVUFERixFQUVFLDJEQUZGO0FBSUFYLEVBQUFBLEdBQUcsQ0FBQ1csU0FBSixDQUNFLE9BREYsRUFFRSw0WUFGRjtBQUlBLFNBQU9YLEdBQVA7QUFDRDs7QUFFRCxTQUFTWSxhQUFULENBQXVCQyxNQUF2QixFQUErQjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFJLENBQUNBLE1BQU0sQ0FBQ0MsTUFBWixFQUFvQjtBQUNsQixXQUFPLEVB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QUgsR0FBU0wsZUFBZSxDQUFDRSxHQUFHLENBQUNHLENBQUQsQ0FBSixDQUF4QjtBQUNEO0FBQ0Y7O0FBQ0QsU0FBT0gsR0FBUDtBQUNEO0FBRUQ7Ozs7Ozs7QUFLTyxTQUFTSSxPQUFULENBQWlCM0IsTUFBakIsRUFBeUI0QixJQUF6QixFQUErQnRCLFVBQS9CLEVBQTJDO0FBQ2hELE1BQUk7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQU83RCxHQUFHLENBQ1BvRixTQURJLENBQ012QixVQUROLEVBQ2tCekQsa0JBRGxCLEVBRUpnRSxRQUZJLENBRUtRLGVBQWUsQ0FBQ3JCLE1BQUQsQ0FGcEIsRUFFOEI0QixJQUY5QixDQUFQO0FBR0QsR0FSRCxDQVFFLE9BQU9wQyxDQUFQLEVBQVU7QUFDVixXQUFPLEtBQVA7QUFDRCxHQVZELFNBVVU7QUFDUjtBQUNBL0MsSUFBQUEsR0FBRyxDQUFDcUYsWUFBSixDQUFpQmpGLGtCQUFqQjtBQUNEO0FBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdG9QYXRoIGZyb20gXCJsb2Rhc2gvdG9QYXRoXCI7XG5pbXBvcnQgQWp2IGZyb20gXCJhanZcIjtcbmxldCBhanYgPSBjcmVhdGVBanZJbnN0YW5jZSgpO1xuaW1wb3J0IHsgZGVlcEVxdWFscywgZ2V0RGVmYXVsdEZvcm1TdGF0ZSB9IGZyb20gXCIuL3V0aWxzXCI7XG5cbmxldCBmb3JtZXJDdXN0b21Gb3JtYXRzID0gbnVsbDtcbmxldCBmb3JtZXJNZXRhU2NoZW1hID0gbnVsbDtcbmNvbnN0IFJPT1RfU0NIRU1BX1BSRUZJWCA9IFwiX19yanNmX3Jvb3RTY2hlbWFcIjtcblxuaW1wb3J0IHsgaXNPYmplY3QsIG1lcmdlT2JqZWN0cyB9IGZyb20gXCIuL3V0aWxzXCI7XG5cbmZ1bmN0aW9uIGNyZWF0ZUFqdkluc3RhbmNlKCkge1xuICBjb25zdCBhanYgPSBuZXcgQWp2KHtcbiAgICBlcnJvckRhdGFQYXRoOiBcInByb3BlcnR5XCIsXG4gICAgYWxsRXJyb3JzOiB0cnVlLFxuICAgIG11bHRpcGxlT2ZQcmVjaXNpb246IDgsXG4gICAgc2NoZW1hSWQ6IFwiYXV0b1wiLFxuICAgIHVua25vd25Gb3JtYXRzOiBcImlnbm9yZVwiLFxuICB9KTtcblxuICAvLyBhZGQgY3VzdG9tIGZvcm1hdHNcbiAgYWp2LmFkZEZvcm1hdChcbiAgICBcImRhdGEtdXJsXCIsXG4gICAgL15kYXRhOihbYS16XStcXC9bYS16MC05LSsuXSspPzsoPzpuYW1lPSguKik7KT9iYXNlNjQsKC4qKSQvXG4gICk7XG4gIGFqdi5hZGRGb3JtYXQoXG4gICAgXCJjb2xvclwiLFxuICAgIC9eKCM/KFswLTlBLUZhLWZdezN9KXsxLDJ9XFxifGFxdWF8YmxhY2t8Ymx1ZXxmdWNoc2lhfGdyYXl8Z3JlZW58bGltZXxtYXJvb258bmF2eXxvbGl2ZXxvcmFuZ2V8cHVycGxlfHJlZHxzaWx2ZXJ8dGVhbHx3aGl0ZXx5ZWxsb3d8KHJnYlxcKFxccypcXGIoWzAtOV18WzEtOV1bMC05XXwxWzAtOV1bMC05XXwyWzAtNF1bMC05XXwyNVswLTVdKVxcYlxccyosXFxzKlxcYihbMC05XXxbMS05XVswLTldfDFbMC05XVswLTldfDJbMC00XVswLTldfDI1WzAtNV0pXFxiXFxzKixcXHMqXFxiKFswLTldfFsxLTldWzAtOV18MVswLTldWzAtOV18MlswLTRdWzAtOV18MjVbMC01XSlcXGJcXHMqXFwpKXwocmdiXFwoXFxzKihcXGQ/XFxkJXwxMDAlKStcXHMqLFxccyooXFxkP1xcZCV8MTAwJSkrXFxzKixcXHMqKFxcZD9cXGQlfDEwMCUpK1xccypcXCkpKSQvXG4gICk7XG4gIHJldHVybiBhanY7XG59XG5cbmZ1bmN0aW9uIHRvRXJyb3JTY2hlbWEoZXJyb3JzKSB7XG4gIC8vIFRyYW5zZm9ybXMgYSBhanYgdmFsaWRhdGlvbiBlcnJvcnMgbGlzdDpcbiAgLy8gW1xuICAvLyAgIHtwcm9wZXJ0eTogXCIubGV2ZWwxLmxldmVsMlsyXS5sZXZlbDNcIiwgbWVzc2FnZTogXCJlcnIgYVwifSxcbiAgLy8gICB7cHJvcGVydHk6IFwiLmxldmVsMS5sZXZlbDJbMl0ubGV2ZWwzXCIsIG1lc3NhZ2U6IFwiZXJyIGJcIn0sXG4gIC8vICAge3Byb3BlcnR5OiBcIi5sZXZlbDEubGV2ZWwyWzRdLmxldmVsM1wiLCBtZXNzYWdlOiBcImVyciBiXCJ9LFxuICAvLyBdXG4gIC8vIEludG8gYW4gZXJyb3IgdHJlZTpcbiAgLy8ge1xuICAvLyAgIGxldmVsMToge1xuICAvLyAgICAgbGV2ZWwyOiB7XG4gIC8vICAgICAgIDI6IHtsZXZlbDM6IHtlcnJvcnM6IFtcImVyciBhXCIsIFwiZXJyIGJcIl19fSxcbiAgLy8gICAgICAgNDoge2xldmVsMzoge2Vycm9yczogW1wiZXJyIGJcIl19fSxcbiAgLy8gICAgIH1cbiAgLy8gICB9XG4gIC8vIH07XG4gIGlmICghZXJyb3JzLmxlbmd0aCkge1xuICAgIHJldHVybiB7fTtcbiAgfVxuICByZXR1cm4gZXJyb3JzLnJlZHVjZSgoZXJyb3JTY2hlbWEsIGVycm9yKSA9PiB7XG4gICAgY29uc3QgeyBwcm9wZXJ0eSwgbWVzc2FnZSB9ID0gZXJyb3I7XG4gICAgY29uc3QgcGF0aCA9IHRvUGF0aChwcm9wZXJ0eSk7XG4gICAgbGV0IHBhcmVudCA9IGVycm9yU2NoZW1hO1xuXG4gICAgLy8gSWYgdGhlIHByb3BlcnR5IGlzIGF0IHRoZSByb290ICgubGV2ZWwxKSB0aGVuIHRvUGF0aCBjcmVhdGVzXG4gICAgLy8gYW4gZW1wdHkgYXJyYXkgZWxlbWVudCBhdCB0aGUgZmlyc3QgaW5kZXguIFJlbW92ZSBpdC5cbiAgICBpZiAocGF0aC5sZW5ndGggPiAwICYmIHBhdGhbMF0gPT09IFwiXCIpIHtcbiAgICAgIHBhdGguc3BsaWNlKDAsIDEpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3Qgc2VnbWVudCBvZiBwYXRoLnNsaWNlKDApKSB7XG4gICAgICBpZiAoIShzZWdtZW50IGluIHBhcmVudCkpIHtcbiAgICAgICAgcGFyZW50W3NlZ21lbnRdID0ge307XG4gICAgICB9XG4gICAgICBwYXJlbnQgPSBwYXJlbnRbc2VnbWVudF07XG4gICAgfVxuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkocGFyZW50Ll9fZXJyb3JzKSkge1xuICAgICAgLy8gV2Ugc3RvcmUgdGhlIGxpc3Qgb2YgZXJyb3JzIGZvciB0aGlzIG5vZGUgaW4gYSBwcm9wZXJ0eSBuYW1lZCBfX2Vycm9yc1xuICAgICAgLy8gdG8gYXZvaWQgbmFtZSBjb2xsaXNpb24gd2l0aCBhIHBvc3NpYmxlIHN1YiBzY2hlbWEgZmllbGQgbmFtZWRcbiAgICAgIC8vIFwiZXJyb3JzXCIgKHNlZSBgdmFsaWRhdGUuY3JlYXRlRXJyb3JIYW5kbGVyYCkuXG4gICAgICBwYXJlbnQuX19lcnJvcnMgPSBwYXJlbnQuX19lcnJvcnMuY29uY2F0KG1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobWVzc2FnZSkge1xuICAgICAgICBwYXJlbnQuX19lcnJvcnMgPSBbbWVzc2FnZV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlcnJvclNjaGVtYTtcbiAgfSwge30pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9FcnJvckxpc3QoZXJyb3JTY2hlbWEsIGZpZWxkTmFtZSA9IFwicm9vdFwiKSB7XG4gIC8vIFhYWDogV2Ugc2hvdWxkIHRyYW5zZm9ybSBmaWVsZE5hbWUgYXMgYSBmdWxsIGZpZWxkIHBhdGggc3RyaW5nLlxuICBsZXQgZXJyb3JMaXN0ID0gW107XG4gIGlmIChcIl9fZXJyb3JzXCIgaW4gZXJyb3JTY2hlbWEpIHtcbiAgICBlcnJvckxpc3QgPSBlcnJvckxpc3QuY29uY2F0KFxuICAgICAgZXJyb3JTY2hlbWEuX19lcnJvcnMubWFwKHN0YWNrID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdGFjazogYCR7ZmllbGROYW1lfTogJHtzdGFja31gLFxuICAgICAgICB9O1xuICAgICAgfSlcbiAgICApO1xuICB9XG4gIHJldHVybiBPYmplY3Qua2V5cyhlcnJvclNjaGVtYSkucmVkdWNlKChhY2MsIGtleSkgPT4ge1xuICAgIGlmIChrZXkgIT09IFwiX19lcnJvcnNcIikge1xuICAgICAgYWNjID0gYWNjLmNvbmNhdCh0b0Vycm9yTGlzdChlcnJvclNjaGVtYVtrZXldLCBrZXkpKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjYztcbiAgfSwgZXJyb3JMaXN0KTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlRXJyb3JIYW5kbGVyKGZvcm1EYXRhKSB7XG4gIGNvbnN0IGhhbmRsZXIgPSB7XG4gICAgLy8gV2Ugc3RvcmUgdGhlIGxpc3Qgb2YgZXJyb3JzIGZvciB0aGlzIG5vZGUgaW4gYSBwcm9wZXJ0eSBuYW1lZCBfX2Vycm9yc1xuICAgIC8vIHRvIGF2b2lkIG5hbWUgY29sbGlzaW9uIHdpdGggYSBwb3NzaWJsZSBzdWIgc2NoZW1hIGZpZWxkIG5hbWVkXG4gICAgLy8gXCJlcnJvcnNcIiAoc2VlIGB1dGlscy50b0Vycm9yU2NoZW1hYCkuXG4gICAgX19lcnJvcnM6IFtdLFxuICAgIGFkZEVycm9yKG1lc3NhZ2UpIHtcbiAgICAgIHRoaXMuX19lcnJvcnMucHVzaChtZXNzYWdlKTtcbiAgICB9LFxuICB9O1xuICBpZiAoaXNPYmplY3QoZm9ybURhdGEpKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKGZvcm1EYXRhKS5yZWR1Y2UoKGFjYywga2V5KSA9PiB7XG4gICAgICByZXR1cm4geyAuLi5hY2MsIFtrZXldOiBjcmVhdGVFcnJvckhhbmRsZXIoZm9ybURhdGFba2V5XSkgfTtcbiAgICB9LCBoYW5kbGVyKTtcbiAgfVxuICBpZiAoQXJyYXkuaXNBcnJheShmb3JtRGF0YSkpIHtcbiAgICByZXR1cm4gZm9ybURhdGEucmVkdWNlKChhY2MsIHZhbHVlLCBrZXkpID0+IHtcbiAgICAgIHJldHVybiB7IC4uLmFjYywgW2tleV06IGNyZWF0ZUVycm9ySGFuZGxlcih2YWx1ZSkgfTtcbiAgICB9LCBoYW5kbGVyKTtcbiAgfVxuICByZXR1cm4gaGFuZGxlcjtcbn1cblxuZnVuY3Rpb24gdW53cmFwRXJyb3JIYW5kbGVyKGVycm9ySGFuZGxlcikge1xuICByZXR1cm4gT2JqZWN0LmtleXMoZXJyb3JIYW5kbGVyKS5yZWR1Y2UoKGFjYywga2V5KSA9PiB7XG4gICAgaWYgKGtleSA9PT0gXCJhZGRFcnJvclwiKSB7XG4gICAgICByZXR1cm4gYWNjO1xuICAgIH0gZWxzZSBpZiAoa2V5ID09PSBcIl9fZXJyb3JzXCIpIHtcbiAgICAgIHJldHVybiB7IC4uLmFjYywgW2tleV06IGVycm9ySGFuZGxlcltrZXldIH07XG4gICAgfVxuICAgIHJldHVybiB7IC4uLmFjYywgW2tleV06IHVud3JhcEVycm9ySGFuZGxlcihlcnJvckhhbmRsZXJba2V5XSkgfTtcbiAgfSwge30pO1xufVxuXG4vKipcbiAqIFRyYW5zZm9ybWluZyB0aGUgZXJyb3Igb3V0cHV0IGZyb20gYWp2IHRvIGZvcm1hdCB1c2VkIGJ5IGpzb25zY2hlbWEuXG4gKiBBdCBzb21lIHBvaW50LCBjb21wb25lbnRzIHNob3VsZCBiZSB1cGRhdGVkIHRvIHN1cHBvcnQgYWp2LlxuICovXG5mdW5jdGlvbiB0cmFuc2Zvcm1BanZFcnJvcnMoZXJyb3JzID0gW10pIHtcbiAgaWYgKGVycm9ycyA9PT0gbnVsbCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIHJldHVybiBlcnJvcnMubWFwKGUgPT4ge1xuICAgIGNvbnN0IHsgZGF0YVBhdGgsIGtleXdvcmQsIG1lc3NhZ2UsIHBhcmFtcywgc2NoZW1hUGF0aCB9ID0gZTtcbiAgICBsZXQgcHJvcGVydHkgPSBgJHtkYXRhUGF0aH1gO1xuXG4gICAgLy8gcHV0IGRhdGEgaW4gZXhwZWN0ZWQgZm9ybWF0XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IGtleXdvcmQsXG4gICAgICBwcm9wZXJ0eSxcbiAgICAgIG1lc3NhZ2UsXG4gICAgICBwYXJhbXMsIC8vIHNwZWNpZmljIHRvIGFqdlxuICAgICAgc3RhY2s6IGAke3Byb3BlcnR5fSAke21lc3NhZ2V9YC50cmltKCksXG4gICAgICBzY2hlbWFQYXRoLFxuICAgIH07XG4gIH0pO1xufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gcHJvY2Vzc2VzIHRoZSBmb3JtRGF0YSB3aXRoIGEgdXNlciBgdmFsaWRhdGVgIGNvbnRyaWJ1dGVkXG4gKiBmdW5jdGlvbiwgd2hpY2ggcmVjZWl2ZXMgdGhlIGZvcm0gZGF0YSBhbmQgYW4gYGVycm9ySGFuZGxlcmAgb2JqZWN0IHRoYXRcbiAqIHdpbGwgYmUgdXNlZCB0byBhZGQgY3VzdG9tIHZhbGlkYXRpb24gZXJyb3JzIGZvciBlYWNoIGZpZWxkLlxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB2YWxpZGF0ZUZvcm1EYXRhKFxuICBmb3JtRGF0YSxcbiAgc2NoZW1hLFxuICBjdXN0b21WYWxpZGF0ZSxcbiAgdHJhbnNmb3JtRXJyb3JzLFxuICBhZGRpdGlvbmFsTWV0YVNjaGVtYXMgPSBbXSxcbiAgY3VzdG9tRm9ybWF0cyA9IHt9LFxuICB2YWxpZGF0ZVNjaGVtYVxuKSB7XG4gIGlmICh2YWxpZGF0ZVNjaGVtYSkge1xuICAgIHNjaGVtYSA9IHZhbGlkYXRlU2NoZW1hO1xuICB9XG4gIC8vIEluY2x1ZGUgZm9ybSBkYXRhIHdpdGggdW5kZWZpbmVkIHZhbHVlcywgd2hpY2ggaXMgcmVxdWlyZWQgZm9yIHZhbGlkYXRpb24uXG4gIGNvbnN0IHJvb3RTY2hlbWEgPSBzY2hlbWE7XG4gIGZvcm1EYXRhID0gZ2V0RGVmYXVsdEZvcm1TdGF0ZShzY2hlbWEsIGZvcm1EYXRhLCByb290U2NoZW1hLCB0cnVlKTtcblxuICBjb25zdCBuZXdNZXRhU2NoZW1hcyA9ICFkZWVwRXF1YWxzKGZvcm1lck1ldGFTY2hlbWEsIGFkZGl0aW9uYWxNZXRhU2NoZW1hcyk7XG4gIGNvbnN0IG5ld0Zvcm1hdHMgPSAhZGVlcEVxdWFscyhmb3JtZXJDdXN0b21Gb3JtYXRzLCBjdXN0b21Gb3JtYXRzKTtcblxuICBpZiAobmV3TWV0YVNjaGVtYXMgfHwgbmV3Rm9ybWF0cykge1xuICAgIGFqdiA9IGNyZWF0ZUFqdkluc3RhbmNlKCk7XG4gIH1cblxuICAvLyBhZGQgbW9yZSBzY2hlbWFzIHRvIHZhbGlkYXRlIGFnYWluc3RcbiAgaWYgKFxuICAgIGFkZGl0aW9uYWxNZXRhU2NoZW1hcyAmJlxuICAgIG5ld01ldGFTY2hlbWFzICYmXG4gICAgQXJyYXkuaXNBcnJheShhZGRpdGlvbmFsTWV0YVNjaGVtYXMpXG4gICkge1xuICAgIGFqdi5hZGRNZXRhU2NoZW1hKGFkZGl0aW9uYWxNZXRhU2NoZW1hcyk7XG4gICAgZm9ybWVyTWV0YVNjaGVtYSA9IGFkZGl0aW9uYWxNZXRhU2NoZW1hcztcbiAgfVxuXG4gIC8vIGFkZCBtb3JlIGN1c3RvbSBmb3JtYXRzIHRvIHZhbGlkYXRlIGFnYWluc3RcbiAgaWYgKGN1c3RvbUZvcm1hdHMgJiYgbmV3Rm9ybWF0cyAmJiBpc09iamVjdChjdXN0b21Gb3JtYXRzKSkge1xuICAgIE9iamVjdC5rZXlzKGN1c3RvbUZvcm1hdHMpLmZvckVhY2goZm9ybWF0TmFtZSA9PiB7XG4gICAgICBhanYuYWRkRm9ybWF0KGZvcm1hdE5hbWUsIGN1c3RvbUZvcm1hdHNbZm9ybWF0TmFtZV0pO1xuICAgIH0pO1xuXG4gICAgZm9ybWVyQ3VzdG9tRm9ybWF0cyA9IGN1c3RvbUZvcm1hdHM7XG4gIH1cblxuICBsZXQgdmFsaWRhdGlvbkVycm9yID0gbnVsbDtcbiAgdHJ5IHtcbiAgICBhanYudmFsaWRhdGUoc2NoZW1hLCBmb3JtRGF0YSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHZhbGlkYXRpb25FcnJvciA9IGVycjtcbiAgfVxuXG4gIGxldCBlcnJvcnMgPSB0cmFuc2Zvcm1BanZFcnJvcnMoYWp2LmVycm9ycyk7XG4gIC8vIENsZWFyIGVycm9ycyB0byBwcmV2ZW50IHBlcnNpc3RlbnQgZXJyb3JzLCBzZWUgIzExMDRcblxuICBhanYuZXJyb3JzID0gbnVsbDtcblxuICBjb25zdCBub1Byb3Blck1ldGFTY2hlbWEgPVxuICAgIHZhbGlkYXRpb25FcnJvciAmJlxuICAgIHZhbGlkYXRpb25FcnJvci5tZXNzYWdlICYmXG4gICAgdHlwZW9mIHZhbGlkYXRpb25FcnJvci5tZXNzYWdlID09PSBcInN0cmluZ1wiICYmXG4gICAgdmFsaWRhdGlvbkVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoXCJubyBzY2hlbWEgd2l0aCBrZXkgb3IgcmVmIFwiKTtcblxuICBpZiAobm9Qcm9wZXJNZXRhU2NoZW1hKSB7XG4gICAgZXJyb3JzID0gW1xuICAgICAgLi4uZXJyb3JzLFxuICAgICAge1xuICAgICAgICBzdGFjazogdmFsaWRhdGlvbkVycm9yLm1lc3NhZ2UsXG4gICAgICB9LFxuICAgIF07XG4gIH1cbiAgaWYgKHR5cGVvZiB0cmFuc2Zvcm1FcnJvcnMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIGVycm9ycyA9IHRyYW5zZm9ybUVycm9ycyhlcnJvcnMpO1xuICB9XG5cbiAgbGV0IGVycm9yU2NoZW1hID0gdG9FcnJvclNjaGVtYShlcnJvcnMpO1xuXG4gIGlmIChub1Byb3Blck1ldGFTY2hlbWEpIHtcbiAgICBlcnJvclNjaGVtYSA9IHtcbiAgICAgIC4uLmVycm9yU2NoZW1hLFxuICAgICAgLi4ue1xuICAgICAgICAkc2NoZW1hOiB7XG4gICAgICAgICAgX19lcnJvcnM6IFt2YWxpZGF0aW9uRXJyb3IubWVzc2FnZV0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICBpZiAodHlwZW9mIGN1c3RvbVZhbGlkYXRlICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICByZXR1cm4geyBlcnJvcnMsIGVycm9yU2NoZW1hIH07XG4gIH1cblxuICBjb25zdCBlcnJvckhhbmRsZXIgPSBjdXN0b21WYWxpZGF0ZShmb3JtRGF0YSwgY3JlYXRlRXJyb3JIYW5kbGVyKGZvcm1EYXRhKSk7XG4gIGNvbnN0IHVzZXJFcnJvclNjaGVtYSA9IHVud3JhcEVycm9ySGFuZGxlcihlcnJvckhhbmRsZXIpO1xuICBjb25zdCBuZXdFcnJvclNjaGVtYSA9IG1lcmdlT2JqZWN0cyhlcnJvclNjaGVtYSwgdXNlckVycm9yU2NoZW1hLCB0cnVlKTtcbiAgLy8gWFhYOiBUaGUgZXJyb3JzIGxpc3QgcHJvZHVjZWQgaXMgbm90IGZ1bGx5IGNvbXBsaWFudCB3aXRoIHRoZSBmb3JtYXRcbiAgLy8gZXhwb3NlZCBieSB0aGUganNvbnNjaGVtYSBsaWIsIHdoaWNoIGNvbnRhaW5zIGZ1bGwgZmllbGQgcGF0aHMgYW5kIG90aGVyXG4gIC8vIHByb3BlcnRpZXMuXG4gIGNvbnN0IG5ld0Vycm9ycyA9IHRvRXJyb3JMaXN0KG5ld0Vycm9yU2NoZW1hKTtcblxuICByZXR1cm4ge1xuICAgIGVycm9yczogbmV3RXJyb3JzLFxuICAgIGVycm9yU2NoZW1hOiBuZXdFcnJvclNjaGVtYSxcbiAgfTtcbn1cblxuLyoqXG4gKiBSZWN1cnNpdmVseSBwcmVmaXhlcyBhbGwgJHJlZidzIGluIGEgc2NoZW1hIHdpdGggYFJPT1RfU0NIRU1BX1BSRUZJWGBcbiAqIFRoaXMgaXMgdXNlZCBpbiBpc1ZhbGlkIHRvIG1ha2UgcmVmZXJlbmNlcyB0byB0aGUgcm9vdFNjaGVtYVxuICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aElkUmVmUHJlZml4KHNjaGVtYU5vZGUpIHtcbiAgbGV0IG9iaiA9IHNjaGVtYU5vZGU7XG4gIGlmIChzY2hlbWFOb2RlLmNvbnN0cnVjdG9yID09PSBPYmplY3QpIHtcbiAgICBvYmogPSB7IC4uLnNjaGVtYU5vZGUgfTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBvYmopIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gb2JqW2tleV07XG4gICAgICBpZiAoXG4gICAgICAgIGtleSA9PT0gXCIkcmVmXCIgJiZcbiAgICAgICAgdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICYmXG4gICAgICAgIHZhbHVlLnN0YXJ0c1dpdGgoXCIjXCIpXG4gICAgICApIHtcbiAgICAgICAgb2JqW2tleV0gPSBST09UX1NDSEVNQV9QUkVGSVggKyB2YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9ialtrZXldID0gd2l0aElkUmVmUHJlZml4KHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShzY2hlbWFOb2RlKSkge1xuICAgIG9iaiA9IFsuLi5zY2hlbWFOb2RlXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9iai5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqW2ldID0gd2l0aElkUmVmUHJlZml4KG9ialtpXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogVmFsaWRhdGVzIGRhdGEgYWdhaW5zdCBhIHNjaGVtYSwgcmV0dXJuaW5nIHRydWUgaWYgdGhlIGRhdGEgaXMgdmFsaWQsIG9yXG4gKiBmYWxzZSBvdGhlcndpc2UuIElmIHRoZSBzY2hlbWEgaXMgaW52YWxpZCwgdGhlbiB0aGlzIGZ1bmN0aW9uIHdpbGwgcmV0dXJuXG4gKiBmYWxzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzVmFsaWQoc2NoZW1hLCBkYXRhLCByb290U2NoZW1hKSB7XG4gIHRyeSB7XG4gICAgLy8gYWRkIHRoZSByb290U2NoZW1hIFJPT1RfU0NIRU1BX1BSRUZJWCBhcyBpZC5cbiAgICAvLyB0aGVuIHJld3JpdGUgdGhlIHNjaGVtYSByZWYncyB0byBwb2ludCB0byB0aGUgcm9vdFNjaGVtYVxuICAgIC8vIHRoaXMgYWNjb3VudHMgZm9yIHRoZSBjYXNlIHdoZXJlIHNjaGVtYSBoYXZlIHJlZmVyZW5jZXMgdG8gbW9kZWxzXG4gICAgLy8gdGhhdCBsaXZlcyBpbiB0aGUgcm9vdFNjaGVtYSBidXQgbm90IGluIHRoZSBzY2hlbWEgaW4gcXVlc3Rpb24uXG4gICAgcmV0dXJuIGFqdlxuICAgICAgLmFkZFNjaGVtYShyb290U2NoZW1hLCBST09UX1NDSEVNQV9QUkVGSVgpXG4gICAgICAudmFsaWRhdGUod2l0aElkUmVmUHJlZml4KHNjaGVtYSksIGRhdGEpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9IGZpbmFsbHkge1xuICAgIC8vIG1ha2Ugc3VyZSB3ZSByZW1vdmUgdGhlIHJvb3RTY2hlbWEgZnJvbSB0aGUgZ2xvYmFsIGFqdiBpbnN0YW5jZVxuICAgIGFqdi5yZW1vdmVTY2hlbWEoUk9PVF9TQ0hFTUFfUFJFRklYKTtcbiAgfVxufVxuIl19