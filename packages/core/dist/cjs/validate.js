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

var _isEmpty2 = _interopRequireDefault(require("lodash/isEmpty"));

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

  var _transformAjvErrors = arguments.length > 7 ? arguments[7] : undefined;

  if (!(0, _isEmpty2["default"])(validateSchema)) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy92YWxpZGF0ZS5qcyJdLCJuYW1lcyI6WyJhanYiLCJjcmVhdGVBanZJbnN0YW5jZSIsImZvcm1lckN1c3RvbUZvcm1hdHMiLCJmb3JtZXJNZXRhU2NoZW1hIiwiUk9PVF9TQ0hFTUFfUFJFRklYIiwiQWp2IiwiZXJyb3JEYXRhUGF0aCIsImFsbEVycm9ycyIsIm11bHRpcGxlT2ZQcmVjaXNpb24iLCJzY2hlbWFJZCIsInVua25vd25Gb3JtYXRzIiwiYWRkRm9ybWF0IiwidG9FcnJvclNjaGVtYSIsImVycm9ycyIsImxlbmd0aCIsInJlZHVjZSIsImVycm9yU2NoZW1hIiwiZXJyb3IiLCJwcm9wZXJ0eSIsIm1lc3NhZ2UiLCJwYXRoIiwicGFyZW50Iiwic3BsaWNlIiwic2xpY2UiLCJzZWdtZW50IiwiQXJyYXkiLCJpc0FycmF5IiwiX19lcnJvcnMiLCJjb25jYXQiLCJ0b0Vycm9yTGlzdCIsImZpZWxkTmFtZSIsImVycm9yTGlzdCIsIm1hcCIsInN0YWNrIiwiT2JqZWN0Iiwia2V5cyIsImFjYyIsImtleSIsImNyZWF0ZUVycm9ySGFuZGxlciIsImZvcm1EYXRhIiwiaGFuZGxlciIsImFkZEVycm9yIiwicHVzaCIsInZhbHVlIiwidW53cmFwRXJyb3JIYW5kbGVyIiwiZXJyb3JIYW5kbGVyIiwidHJhbnNmb3JtQWp2RXJyb3JzIiwiZSIsImRhdGFQYXRoIiwia2V5d29yZCIsInBhcmFtcyIsInNjaGVtYVBhdGgiLCJuYW1lIiwidHJpbSIsInZhbGlkYXRlRm9ybURhdGEiLCJzY2hlbWEiLCJjdXN0b21WYWxpZGF0ZSIsInRyYW5zZm9ybUVycm9ycyIsImFkZGl0aW9uYWxNZXRhU2NoZW1hcyIsImN1c3RvbUZvcm1hdHMiLCJ2YWxpZGF0ZVNjaGVtYSIsIl90cmFuc2Zvcm1BanZFcnJvcnMiLCJyb290U2NoZW1hIiwibmV3TWV0YVNjaGVtYXMiLCJuZXdGb3JtYXRzIiwiYWRkTWV0YVNjaGVtYSIsImZvckVhY2giLCJmb3JtYXROYW1lIiwidmFsaWRhdGlvbkVycm9yIiwidmFsaWRhdGUiLCJlcnIiLCJub1Byb3Blck1ldGFTY2hlbWEiLCJpbmNsdWRlcyIsIiRzY2hlbWEiLCJ1c2VyRXJyb3JTY2hlbWEiLCJuZXdFcnJvclNjaGVtYSIsIm5ld0Vycm9ycyIsIndpdGhJZFJlZlByZWZpeCIsInNjaGVtYU5vZGUiLCJvYmoiLCJjb25zdHJ1Y3RvciIsInN0YXJ0c1dpdGgiLCJpIiwiaXNWYWxpZCIsImRhdGEiLCJhZGRTY2hlbWEiLCJyZW1vdmVTY2hlbWEiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFFQTs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7OztBQUZBLElBQUlBLEdBQUcsR0FBR0MsaUJBQWlCLEVBQTNCO0FBSUEsSUFBSUMsbUJBQW1CLEdBQUcsSUFBMUI7QUFDQSxJQUFJQyxnQkFBZ0IsR0FBRyxJQUF2QjtBQUNBLElBQU1DLGtCQUFrQixHQUFHLG1CQUEzQjs7QUFJQSxTQUFTSCxpQkFBVCxHQUE2QjtBQUMzQixNQUFNRCxHQUFHLEdBQUcsSUFBSUssZUFBSixDQUFRO0FBQ2xCQyxJQUFBQSxhQUFhLEVBQUUsVUFERztBQUVsQkMsSUFBQUEsU0FBUyxFQUFFLElBRk87QUFHbEJDLElBQUFBLG1CQUFtQixFQUFFLENBSEg7QUFJbEJDLElBQUFBLFFBQVEsRUFBRSxNQUpRO0FBS2xCQyxJQUFBQSxjQUFjLEVBQUU7QUFMRSxHQUFSLENBQVosQ0FEMkIsQ0FTM0I7O0FBQ0FWLEVBQUFBLEdBQUcsQ0FBQ1csU0FBSixDQUNFLFVBREYsRUFFRSwyREFGRjtBQUlBWCxFQUFBQSxHQUFHLENBQUNXLFNBQUosQ0FDRSxPQURGLEVBRUUsNFlBRkY7QUFJQSxTQUFPWCxHQUFQO0FBQ0Q7O0FBRUQsU0FBU1ksYUFBVCxDQUF1QkMsTUFBdkIsRUFBK0I7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSSxDQUFDQSxNQUFNLENB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RDtBQUNGO0FBQ0YsR0FkRCxNQWNPLElBQUlsQixLQUFLLENBQUNDLE9BQU4sQ0FBY29ELFVBQWQsQ0FBSixFQUErQjtBQUNwQ0MsSUFBQUEsR0FBRyxzQkFBT0QsVUFBUCxDQUFIOztBQUNBLFNBQUssSUFBSUksQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR0gsR0FBRyxDQUFDakUsTUFBeEIsRUFBZ0NvRSxDQUFDLEVBQWpDLEVBQXFDO0FBQ25DSCxNQUFBQSxHQUFHLENBQUNHLENBQUQsQ0FBSCxHQUFTTCxlQUFlLENBQUNFLEdBQUcsQ0FBQ0csQ0FBRCxDQUFKLENBQXhCO0FBQ0Q7QUFDRjs7QUFDRCxTQUFPSCxHQUFQO0FBQ0Q7QUFFRDs7Ozs7OztBQUtPLFNBQVNJLE9BQVQsQ0FBaUI1QixNQUFqQixFQUF5QjZCLElBQXpCLEVBQStCdEIsVUFBL0IsRUFBMkM7QUFDaEQsTUFBSTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBTzlELEdBQUcsQ0FDUHFGLFNBREksQ0FDTXZCLFVBRE4sRUFDa0IxRCxrQkFEbEIsRUFFSmlFLFFBRkksQ0FFS1EsZUFBZSxDQUFDdEIsTUFBRCxDQUZwQixFQUU4QjZCLElBRjlCLENBQVA7QUFHRCxHQVJELENBUUUsT0FBT3JDLENBQVAsRUFBVTtBQUNWLFdBQU8sS0FBUDtBQUNELEdBVkQsU0FVVTtBQUNSO0FBQ0EvQyxJQUFBQSxHQUFHLENBQUNzRixZQUFKLENBQWlCbEYsa0JBQWpCO0FBQ0Q7QUFDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0b1BhdGggZnJvbSBcImxvZGFzaC90b1BhdGhcIjtcbmltcG9ydCBBanYgZnJvbSBcImFqdlwiO1xubGV0IGFqdiA9IGNyZWF0ZUFqdkluc3RhbmNlKCk7XG5pbXBvcnQgX2lzRW1wdHkgZnJvbSBcImxvZGFzaC9pc0VtcHR5XCI7XG5pbXBvcnQgeyBkZWVwRXF1YWxzLCBnZXREZWZhdWx0Rm9ybVN0YXRlIH0gZnJvbSBcIi4vdXRpbHNcIjtcblxubGV0IGZvcm1lckN1c3RvbUZvcm1hdHMgPSBudWxsO1xubGV0IGZvcm1lck1ldGFTY2hlbWEgPSBudWxsO1xuY29uc3QgUk9PVF9TQ0hFTUFfUFJFRklYID0gXCJfX3Jqc2Zfcm9vdFNjaGVtYVwiO1xuXG5pbXBvcnQgeyBpc09iamVjdCwgbWVyZ2VPYmplY3RzIH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuZnVuY3Rpb24gY3JlYXRlQWp2SW5zdGFuY2UoKSB7XG4gIGNvbnN0IGFqdiA9IG5ldyBBanYoe1xuICAgIGVycm9yRGF0YVBhdGg6IFwicHJvcGVydHlcIixcbiAgICBhbGxFcnJvcnM6IHRydWUsXG4gICAgbXVsdGlwbGVPZlByZWNpc2lvbjogOCxcbiAgICBzY2hlbWFJZDogXCJhdXRvXCIsXG4gICAgdW5rbm93bkZvcm1hdHM6IFwiaWdub3JlXCIsXG4gIH0pO1xuXG4gIC8vIGFkZCBjdXN0b20gZm9ybWF0c1xuICBhanYuYWRkRm9ybWF0KFxuICAgIFwiZGF0YS11cmxcIixcbiAgICAvXmRhdGE6KFthLXpdK1xcL1thLXowLTktKy5dKyk/Oyg/Om5hbWU9KC4qKTspP2Jhc2U2NCwoLiopJC9cbiAgKTtcbiAgYWp2LmFkZEZvcm1hdChcbiAgICBcImNvbG9yXCIsXG4gICAgL14oIz8oWzAtOUEtRmEtZl17M30pezEsMn1cXGJ8YXF1YXxibGFja3xibHVlfGZ1Y2hzaWF8Z3JheXxncmVlbnxsaW1lfG1hcm9vbnxuYXZ5fG9saXZlfG9yYW5nZXxwdXJwbGV8cmVkfHNpbHZlcnx0ZWFsfHdoaXRlfHllbGxvd3wocmdiXFwoXFxzKlxcYihbMC05XXxbMS05XVswLTldfDFbMC05XVswLTldfDJbMC00XVswLTldfDI1WzAtNV0pXFxiXFxzKixcXHMqXFxiKFswLTldfFsxLTldWzAtOV18MVswLTldWzAtOV18MlswLTRdWzAtOV18MjVbMC01XSlcXGJcXHMqLFxccypcXGIoWzAtOV18WzEtOV1bMC05XXwxWzAtOV1bMC05XXwyWzAtNF1bMC05XXwyNVswLTVdKVxcYlxccypcXCkpfChyZ2JcXChcXHMqKFxcZD9cXGQlfDEwMCUpK1xccyosXFxzKihcXGQ/XFxkJXwxMDAlKStcXHMqLFxccyooXFxkP1xcZCV8MTAwJSkrXFxzKlxcKSkpJC9cbiAgKTtcbiAgcmV0dXJuIGFqdjtcbn1cblxuZnVuY3Rpb24gdG9FcnJvclNjaGVtYShlcnJvcnMpIHtcbiAgLy8gVHJhbnNmb3JtcyBhIGFqdiB2YWxpZGF0aW9uIGVycm9ycyBsaXN0OlxuICAvLyBbXG4gIC8vICAge3Byb3BlcnR5OiBcIi5sZXZlbDEubGV2ZWwyWzJdLmxldmVsM1wiLCBtZXNzYWdlOiBcImVyciBhXCJ9LFxuICAvLyAgIHtwcm9wZXJ0eTogXCIubGV2ZWwxLmxldmVsMlsyXS5sZXZlbDNcIiwgbWVzc2FnZTogXCJlcnIgYlwifSxcbiAgLy8gICB7cHJvcGVydHk6IFwiLmxldmVsMS5sZXZlbDJbNF0ubGV2ZWwzXCIsIG1lc3NhZ2U6IFwiZXJyIGJcIn0sXG4gIC8vIF1cbiAgLy8gSW50byBhbiBlcnJvciB0cmVlOlxuICAvLyB7XG4gIC8vICAgbGV2ZWwxOiB7XG4gIC8vICAgICBsZXZlbDI6IHtcbiAgLy8gICAgICAgMjoge2xldmVsMzoge2Vycm9yczogW1wiZXJyIGFcIiwgXCJlcnIgYlwiXX19LFxuICAvLyAgICAgICA0OiB7bGV2ZWwzOiB7ZXJyb3JzOiBbXCJlcnIgYlwiXX19LFxuICAvLyAgICAgfVxuICAvLyAgIH1cbiAgLy8gfTtcbiAgaWYgKCFlcnJvcnMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG4gIHJldHVybiBlcnJvcnMucmVkdWNlKChlcnJvclNjaGVtYSwgZXJyb3IpID0+IHtcbiAgICBjb25zdCB7IHByb3BlcnR5LCBtZXNzYWdlIH0gPSBlcnJvcjtcbiAgICBjb25zdCBwYXRoID0gdG9QYXRoKHByb3BlcnR5KTtcbiAgICBsZXQgcGFyZW50ID0gZXJyb3JTY2hlbWE7XG5cbiAgICAvLyBJZiB0aGUgcHJvcGVydHkgaXMgYXQgdGhlIHJvb3QgKC5sZXZlbDEpIHRoZW4gdG9QYXRoIGNyZWF0ZXNcbiAgICAvLyBhbiBlbXB0eSBhcnJheSBlbGVtZW50IGF0IHRoZSBmaXJzdCBpbmRleC4gUmVtb3ZlIGl0LlxuICAgIGlmIChwYXRoLmxlbmd0aCA+IDAgJiYgcGF0aFswXSA9PT0gXCJcIikge1xuICAgICAgcGF0aC5zcGxpY2UoMCwgMSk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBzZWdtZW50IG9mIHBhdGguc2xpY2UoMCkpIHtcbiAgICAgIGlmICghKHNlZ21lbnQgaW4gcGFyZW50KSkge1xuICAgICAgICBwYXJlbnRbc2VnbWVudF0gPSB7fTtcbiAgICAgIH1cbiAgICAgIHBhcmVudCA9IHBhcmVudFtzZWdtZW50XTtcbiAgICB9XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShwYXJlbnQuX19lcnJvcnMpKSB7XG4gICAgICAvLyBXZSBzdG9yZSB0aGUgbGlzdCBvZiBlcnJvcnMgZm9yIHRoaXMgbm9kZSBpbiBhIHByb3BlcnR5IG5hbWVkIF9fZXJyb3JzXG4gICAgICAvLyB0byBhdm9pZCBuYW1lIGNvbGxpc2lvbiB3aXRoIGEgcG9zc2libGUgc3ViIHNjaGVtYSBmaWVsZCBuYW1lZFxuICAgICAgLy8gXCJlcnJvcnNcIiAoc2VlIGB2YWxpZGF0ZS5jcmVhdGVFcnJvckhhbmRsZXJgKS5cbiAgICAgIHBhcmVudC5fX2Vycm9ycyA9IHBhcmVudC5fX2Vycm9ycy5jb25jYXQobWVzc2FnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChtZXNzYWdlKSB7XG4gICAgICAgIHBhcmVudC5fX2Vycm9ycyA9IFttZXNzYWdlXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVycm9yU2NoZW1hO1xuICB9LCB7fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0Vycm9yTGlzdChlcnJvclNjaGVtYSwgZmllbGROYW1lID0gXCJyb290XCIpIHtcbiAgLy8gWFhYOiBXZSBzaG91bGQgdHJhbnNmb3JtIGZpZWxkTmFtZSBhcyBhIGZ1bGwgZmllbGQgcGF0aCBzdHJpbmcuXG4gIGxldCBlcnJvckxpc3QgPSBbXTtcbiAgaWYgKFwiX19lcnJvcnNcIiBpbiBlcnJvclNjaGVtYSkge1xuICAgIGVycm9yTGlzdCA9IGVycm9yTGlzdC5jb25jYXQoXG4gICAgICBlcnJvclNjaGVtYS5fX2Vycm9ycy5tYXAoc3RhY2sgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN0YWNrOiBgJHtmaWVsZE5hbWV9OiAke3N0YWNrfWAsXG4gICAgICAgIH07XG4gICAgICB9KVxuICAgICk7XG4gIH1cbiAgcmV0dXJuIE9iamVjdC5rZXlzKGVycm9yU2NoZW1hKS5yZWR1Y2UoKGFjYywga2V5KSA9PiB7XG4gICAgaWYgKGtleSAhPT0gXCJfX2Vycm9yc1wiKSB7XG4gICAgICBhY2MgPSBhY2MuY29uY2F0KHRvRXJyb3JMaXN0KGVycm9yU2NoZW1hW2tleV0sIGtleSkpO1xuICAgIH1cbiAgICByZXR1cm4gYWNjO1xuICB9LCBlcnJvckxpc3QpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVFcnJvckhhbmRsZXIoZm9ybURhdGEpIHtcbiAgY29uc3QgaGFuZGxlciA9IHtcbiAgICAvLyBXZSBzdG9yZSB0aGUgbGlzdCBvZiBlcnJvcnMgZm9yIHRoaXMgbm9kZSBpbiBhIHByb3BlcnR5IG5hbWVkIF9fZXJyb3JzXG4gICAgLy8gdG8gYXZvaWQgbmFtZSBjb2xsaXNpb24gd2l0aCBhIHBvc3NpYmxlIHN1YiBzY2hlbWEgZmllbGQgbmFtZWRcbiAgICAvLyBcImVycm9yc1wiIChzZWUgYHV0aWxzLnRvRXJyb3JTY2hlbWFgKS5cbiAgICBfX2Vycm9yczogW10sXG4gICAgYWRkRXJyb3IobWVzc2FnZSkge1xuICAgICAgdGhpcy5fX2Vycm9ycy5wdXNoKG1lc3NhZ2UpO1xuICAgIH0sXG4gIH07XG4gIGlmIChpc09iamVjdChmb3JtRGF0YSkpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoZm9ybURhdGEpLnJlZHVjZSgoYWNjLCBrZXkpID0+IHtcbiAgICAgIHJldHVybiB7IC4uLmFjYywgW2tleV06IGNyZWF0ZUVycm9ySGFuZGxlcihmb3JtRGF0YVtrZXldKSB9O1xuICAgIH0sIGhhbmRsZXIpO1xuICB9XG4gIGlmIChBcnJheS5pc0FycmF5KGZvcm1EYXRhKSkge1xuICAgIHJldHVybiBmb3JtRGF0YS5yZWR1Y2UoKGFjYywgdmFsdWUsIGtleSkgPT4ge1xuICAgICAgcmV0dXJuIHsgLi4uYWNjLCBba2V5XTogY3JlYXRlRXJyb3JIYW5kbGVyKHZhbHVlKSB9O1xuICAgIH0sIGhhbmRsZXIpO1xuICB9XG4gIHJldHVybiBoYW5kbGVyO1xufVxuXG5mdW5jdGlvbiB1bndyYXBFcnJvckhhbmRsZXIoZXJyb3JIYW5kbGVyKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhlcnJvckhhbmRsZXIpLnJlZHVjZSgoYWNjLCBrZXkpID0+IHtcbiAgICBpZiAoa2V5ID09PSBcImFkZEVycm9yXCIpIHtcbiAgICAgIHJldHVybiBhY2M7XG4gICAgfSBlbHNlIGlmIChrZXkgPT09IFwiX19lcnJvcnNcIikge1xuICAgICAgcmV0dXJuIHsgLi4uYWNjLCBba2V5XTogZXJyb3JIYW5kbGVyW2tleV0gfTtcbiAgICB9XG4gICAgcmV0dXJuIHsgLi4uYWNjLCBba2V5XTogdW53cmFwRXJyb3JIYW5kbGVyKGVycm9ySGFuZGxlcltrZXldKSB9O1xuICB9LCB7fSk7XG59XG5cbi8qKlxuICogVHJhbnNmb3JtaW5nIHRoZSBlcnJvciBvdXRwdXQgZnJvbSBhanYgdG8gZm9ybWF0IHVzZWQgYnkganNvbnNjaGVtYS5cbiAqIEF0IHNvbWUgcG9pbnQsIGNvbXBvbmVudHMgc2hvdWxkIGJlIHVwZGF0ZWQgdG8gc3VwcG9ydCBhanYuXG4gKi9cbmZ1bmN0aW9uIHRyYW5zZm9ybUFqdkVycm9ycyhlcnJvcnMgPSBbXSkge1xuICBpZiAoZXJyb3JzID09PSBudWxsKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgcmV0dXJuIGVycm9ycy5tYXAoZSA9PiB7XG4gICAgY29uc3QgeyBkYXRhUGF0aCwga2V5d29yZCwgbWVzc2FnZSwgcGFyYW1zLCBzY2hlbWFQYXRoIH0gPSBlO1xuICAgIGxldCBwcm9wZXJ0eSA9IGAke2RhdGFQYXRofWA7XG5cbiAgICAvLyBwdXQgZGF0YSBpbiBleHBlY3RlZCBmb3JtYXRcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZToga2V5d29yZCxcbiAgICAgIHByb3BlcnR5LFxuICAgICAgbWVzc2FnZSxcbiAgICAgIHBhcmFtcywgLy8gc3BlY2lmaWMgdG8gYWp2XG4gICAgICBzdGFjazogYCR7cHJvcGVydHl9ICR7bWVzc2FnZX1gLnRyaW0oKSxcbiAgICAgIHNjaGVtYVBhdGgsXG4gICAgfTtcbiAgfSk7XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBwcm9jZXNzZXMgdGhlIGZvcm1EYXRhIHdpdGggYSB1c2VyIGB2YWxpZGF0ZWAgY29udHJpYnV0ZWRcbiAqIGZ1bmN0aW9uLCB3aGljaCByZWNlaXZlcyB0aGUgZm9ybSBkYXRhIGFuZCBhbiBgZXJyb3JIYW5kbGVyYCBvYmplY3QgdGhhdFxuICogd2lsbCBiZSB1c2VkIHRvIGFkZCBjdXN0b20gdmFsaWRhdGlvbiBlcnJvcnMgZm9yIGVhY2ggZmllbGQuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHZhbGlkYXRlRm9ybURhdGEoXG4gIGZvcm1EYXRhLFxuICBzY2hlbWEsXG4gIGN1c3RvbVZhbGlkYXRlLFxuICB0cmFuc2Zvcm1FcnJvcnMsXG4gIGFkZGl0aW9uYWxNZXRhU2NoZW1hcyA9IFtdLFxuICBjdXN0b21Gb3JtYXRzID0ge30sXG4gIHZhbGlkYXRlU2NoZW1hLFxuICBfdHJhbnNmb3JtQWp2RXJyb3JzXG4pIHtcbiAgaWYgKCFfaXNFbXB0eSh2YWxpZGF0ZVNjaGVtYSkpIHtcbiAgICBzY2hlbWEgPSB2YWxpZGF0ZVNjaGVtYTtcbiAgfVxuICAvLyBJbmNsdWRlIGZvcm0gZGF0YSB3aXRoIHVuZGVmaW5lZCB2YWx1ZXMsIHdoaWNoIGlzIHJlcXVpcmVkIGZvciB2YWxpZGF0aW9uLlxuICBjb25zdCByb290U2NoZW1hID0gc2NoZW1hO1xuICBmb3JtRGF0YSA9IGdldERlZmF1bHRGb3JtU3RhdGUoc2NoZW1hLCBmb3JtRGF0YSwgcm9vdFNjaGVtYSwgdHJ1ZSk7XG5cbiAgY29uc3QgbmV3TWV0YVNjaGVtYXMgPSAhZGVlcEVxdWFscyhmb3JtZXJNZXRhU2NoZW1hLCBhZGRpdGlvbmFsTWV0YVNjaGVtYXMpO1xuICBjb25zdCBuZXdGb3JtYXRzID0gIWRlZXBFcXVhbHMoZm9ybWVyQ3VzdG9tRm9ybWF0cywgY3VzdG9tRm9ybWF0cyk7XG5cbiAgaWYgKG5ld01ldGFTY2hlbWFzIHx8IG5ld0Zvcm1hdHMpIHtcbiAgICBhanYgPSBjcmVhdGVBanZJbnN0YW5jZSgpO1xuICB9XG5cbiAgLy8gYWRkIG1vcmUgc2NoZW1hcyB0byB2YWxpZGF0ZSBhZ2FpbnN0XG4gIGlmIChcbiAgICBhZGRpdGlvbmFsTWV0YVNjaGVtYXMgJiZcbiAgICBuZXdNZXRhU2NoZW1hcyAmJlxuICAgIEFycmF5LmlzQXJyYXkoYWRkaXRpb25hbE1ldGFTY2hlbWFzKVxuICApIHtcbiAgICBhanYuYWRkTWV0YVNjaGVtYShhZGRpdGlvbmFsTWV0YVNjaGVtYXMpO1xuICAgIGZvcm1lck1ldGFTY2hlbWEgPSBhZGRpdGlvbmFsTWV0YVNjaGVtYXM7XG4gIH1cblxuICAvLyBhZGQgbW9yZSBjdXN0b20gZm9ybWF0cyB0byB2YWxpZGF0ZSBhZ2FpbnN0XG4gIGlmIChjdXN0b21Gb3JtYXRzICYmIG5ld0Zvcm1hdHMgJiYgaXNPYmplY3QoY3VzdG9tRm9ybWF0cykpIHtcbiAgICBPYmplY3Qua2V5cyhjdXN0b21Gb3JtYXRzKS5mb3JFYWNoKGZvcm1hdE5hbWUgPT4ge1xuICAgICAgYWp2LmFkZEZvcm1hdChmb3JtYXROYW1lLCBjdXN0b21Gb3JtYXRzW2Zvcm1hdE5hbWVdKTtcbiAgICB9KTtcblxuICAgIGZvcm1lckN1c3RvbUZvcm1hdHMgPSBjdXN0b21Gb3JtYXRzO1xuICB9XG5cbiAgbGV0IHZhbGlkYXRpb25FcnJvciA9IG51bGw7XG4gIHRyeSB7XG4gICAgYWp2LnZhbGlkYXRlKHNjaGVtYSwgZm9ybURhdGEpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB2YWxpZGF0aW9uRXJyb3IgPSBlcnI7XG4gIH1cblxuICBsZXQgZXJyb3JzID0gW107XG4gIGlmICh0eXBlb2YgX3RyYW5zZm9ybUFqdkVycm9ycyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGVycm9ycyA9IF90cmFuc2Zvcm1BanZFcnJvcnMoYWp2LmVycm9ycywgc2NoZW1hKTtcbiAgfSBlbHNlIHtcbiAgICBlcnJvcnMgPSB0cmFuc2Zvcm1BanZFcnJvcnMoYWp2LmVycm9ycyk7XG4gIH1cbiAgLy8gQ2xlYXIgZXJyb3JzIHRvIHByZXZlbnQgcGVyc2lzdGVudCBlcnJvcnMsIHNlZSAjMTEwNFxuXG4gIGFqdi5lcnJvcnMgPSBudWxsO1xuXG4gIGNvbnN0IG5vUHJvcGVyTWV0YVNjaGVtYSA9XG4gICAgdmFsaWRhdGlvbkVycm9yICYmXG4gICAgdmFsaWRhdGlvbkVycm9yLm1lc3NhZ2UgJiZcbiAgICB0eXBlb2YgdmFsaWRhdGlvbkVycm9yLm1lc3NhZ2UgPT09IFwic3RyaW5nXCIgJiZcbiAgICB2YWxpZGF0aW9uRXJyb3IubWVzc2FnZS5pbmNsdWRlcyhcIm5vIHNjaGVtYSB3aXRoIGtleSBvciByZWYgXCIpO1xuXG4gIGlmIChub1Byb3Blck1ldGFTY2hlbWEpIHtcbiAgICBlcnJvcnMgPSBbXG4gICAgICAuLi5lcnJvcnMsXG4gICAgICB7XG4gICAgICAgIHN0YWNrOiB2YWxpZGF0aW9uRXJyb3IubWVzc2FnZSxcbiAgICAgIH0sXG4gICAgXTtcbiAgfVxuICBpZiAodHlwZW9mIHRyYW5zZm9ybUVycm9ycyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgZXJyb3JzID0gdHJhbnNmb3JtRXJyb3JzKGVycm9ycyk7XG4gIH1cblxuICBsZXQgZXJyb3JTY2hlbWEgPSB0b0Vycm9yU2NoZW1hKGVycm9ycyk7XG5cbiAgaWYgKG5vUHJvcGVyTWV0YVNjaGVtYSkge1xuICAgIGVycm9yU2NoZW1hID0ge1xuICAgICAgLi4uZXJyb3JTY2hlbWEsXG4gICAgICAuLi57XG4gICAgICAgICRzY2hlbWE6IHtcbiAgICAgICAgICBfX2Vycm9yczogW3ZhbGlkYXRpb25FcnJvci5tZXNzYWdlXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgY3VzdG9tVmFsaWRhdGUgIT09IFwiZnVuY3Rpb25cIikge1xuICAgIHJldHVybiB7IGVycm9ycywgZXJyb3JTY2hlbWEgfTtcbiAgfVxuXG4gIGNvbnN0IGVycm9ySGFuZGxlciA9IGN1c3RvbVZhbGlkYXRlKGZvcm1EYXRhLCBjcmVhdGVFcnJvckhhbmRsZXIoZm9ybURhdGEpKTtcbiAgY29uc3QgdXNlckVycm9yU2NoZW1hID0gdW53cmFwRXJyb3JIYW5kbGVyKGVycm9ySGFuZGxlcik7XG4gIGNvbnN0IG5ld0Vycm9yU2NoZW1hID0gbWVyZ2VPYmplY3RzKGVycm9yU2NoZW1hLCB1c2VyRXJyb3JTY2hlbWEsIHRydWUpO1xuICAvLyBYWFg6IFRoZSBlcnJvcnMgbGlzdCBwcm9kdWNlZCBpcyBub3QgZnVsbHkgY29tcGxpYW50IHdpdGggdGhlIGZvcm1hdFxuICAvLyBleHBvc2VkIGJ5IHRoZSBqc29uc2NoZW1hIGxpYiwgd2hpY2ggY29udGFpbnMgZnVsbCBmaWVsZCBwYXRocyBhbmQgb3RoZXJcbiAgLy8gcHJvcGVydGllcy5cbiAgY29uc3QgbmV3RXJyb3JzID0gdG9FcnJvckxpc3QobmV3RXJyb3JTY2hlbWEpO1xuXG4gIHJldHVybiB7XG4gICAgZXJyb3JzOiBuZXdFcnJvcnMsXG4gICAgZXJyb3JTY2hlbWE6IG5ld0Vycm9yU2NoZW1hLFxuICB9O1xufVxuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IHByZWZpeGVzIGFsbCAkcmVmJ3MgaW4gYSBzY2hlbWEgd2l0aCBgUk9PVF9TQ0hFTUFfUFJFRklYYFxuICogVGhpcyBpcyB1c2VkIGluIGlzVmFsaWQgdG8gbWFrZSByZWZlcmVuY2VzIHRvIHRoZSByb290U2NoZW1hXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aXRoSWRSZWZQcmVmaXgoc2NoZW1hTm9kZSkge1xuICBsZXQgb2JqID0gc2NoZW1hTm9kZTtcbiAgaWYgKHNjaGVtYU5vZGUuY29uc3RydWN0b3IgPT09IE9iamVjdCkge1xuICAgIG9iaiA9IHsgLi4uc2NoZW1hTm9kZSB9O1xuICAgIGZvciAoY29uc3Qga2V5IGluIG9iaikge1xuICAgICAgY29uc3QgdmFsdWUgPSBvYmpba2V5XTtcbiAgICAgIGlmIChcbiAgICAgICAga2V5ID09PSBcIiRyZWZcIiAmJlxuICAgICAgICB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiZcbiAgICAgICAgdmFsdWUuc3RhcnRzV2l0aChcIiNcIilcbiAgICAgICkge1xuICAgICAgICBvYmpba2V5XSA9IFJPT1RfU0NIRU1BX1BSRUZJWCArIHZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb2JqW2tleV0gPSB3aXRoSWRSZWZQcmVmaXgodmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHNjaGVtYU5vZGUpKSB7XG4gICAgb2JqID0gWy4uLnNjaGVtYU5vZGVdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmpbaV0gPSB3aXRoSWRSZWZQcmVmaXgob2JqW2ldKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG9iajtcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgZGF0YSBhZ2FpbnN0IGEgc2NoZW1hLCByZXR1cm5pbmcgdHJ1ZSBpZiB0aGUgZGF0YSBpcyB2YWxpZCwgb3JcbiAqIGZhbHNlIG90aGVyd2lzZS4gSWYgdGhlIHNjaGVtYSBpcyBpbnZhbGlkLCB0aGVuIHRoaXMgZnVuY3Rpb24gd2lsbCByZXR1cm5cbiAqIGZhbHNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNWYWxpZChzY2hlbWEsIGRhdGEsIHJvb3RTY2hlbWEpIHtcbiAgdHJ5IHtcbiAgICAvLyBhZGQgdGhlIHJvb3RTY2hlbWEgUk9PVF9TQ0hFTUFfUFJFRklYIGFzIGlkLlxuICAgIC8vIHRoZW4gcmV3cml0ZSB0aGUgc2NoZW1hIHJlZidzIHRvIHBvaW50IHRvIHRoZSByb290U2NoZW1hXG4gICAgLy8gdGhpcyBhY2NvdW50cyBmb3IgdGhlIGNhc2Ugd2hlcmUgc2NoZW1hIGhhdmUgcmVmZXJlbmNlcyB0byBtb2RlbHNcbiAgICAvLyB0aGF0IGxpdmVzIGluIHRoZSByb290U2NoZW1hIGJ1dCBub3QgaW4gdGhlIHNjaGVtYSBpbiBxdWVzdGlvbi5cbiAgICByZXR1cm4gYWp2XG4gICAgICAuYWRkU2NoZW1hKHJvb3RTY2hlbWEsIFJPT1RfU0NIRU1BX1BSRUZJWClcbiAgICAgIC52YWxpZGF0ZSh3aXRoSWRSZWZQcmVmaXgoc2NoZW1hKSwgZGF0YSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0gZmluYWxseSB7XG4gICAgLy8gbWFrZSBzdXJlIHdlIHJlbW92ZSB0aGUgcm9vdFNjaGVtYSBmcm9tIHRoZSBnbG9iYWwgYWp2IGluc3RhbmNlXG4gICAgYWp2LnJlbW92ZVNjaGVtYShST09UX1NDSEVNQV9QUkVGSVgpO1xuICB9XG59XG4iXX0=