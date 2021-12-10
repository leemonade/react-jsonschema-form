"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _pick2 = _interopRequireDefault(require("lodash/pick"));

var _get2 = _interopRequireDefault(require("lodash/get"));

var _isEmpty2 = _interopRequireDefault(require("lodash/isEmpty"));

var _ErrorList = _interopRequireDefault(require("./ErrorList"));

var _utils = require("../utils");

var _validate = _interopRequireWildcard(require("../validate"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Form =
/*#__PURE__*/
function (_Component) {
  _inherits(Form, _Component);

  function Form(props) {
    var _this;

    _classCallCheck(this, Form);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Form).call(this, props));

    _defineProperty(_assertThisInitialized(_this), "getUsedFormData", function (formData, fields) {
      //for the case of a single input form
      if (fields.length === 0 && _typeof(formData) !== "object") {
        return formData;
      }

      var data = (0, _pick2["default"])(formData, fields);

      if (Array.isArray(formData)) {
        return Object.keys(data).map(function (key) {
          return data[key];
        });
      }

      return data;
    });

    _defineProperty(_assertThisInitialized(_this), "getFieldNames", function (pathSchema, formData) {
      var getAllPaths = function getAllPaths(_obj) {
        var acc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
        var paths = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [""];
        Object.keys(_obj).forEach(function (key) {
          if (_typeof(_obj[key]) === "object") {
            var newPaths = paths.map(function (path) {
              return "".concat(path, ".").concat(key);
            }); // If an object is marked with additionalProperties, all its keys are valid

            if (_obj[key].__rjsf_additionalProperties && _obj[key].$name !== "") {
              acc.push(_obj[key].$name);
            } else {
              getAllPaths(_obj[key], acc, newPaths);
            }
          } else if (key === "$name" && _obj[key] !== "") {
            paths.forEach(function (path) {
              path = path.replace(/^\./, "");
              var formValue = (0, _get2["default"])(formData, path); // adds path to fieldNames if it points to a value
              // or an empty object/array

              if (_typeof(formValue) !== "object" || (0, _isEmpty2["default"])(formValue)) {
                acc.push(path);
              }
            });
          }
        });
        return acc;
      };

      return getAllPaths(pathSchema);
    });

    _defineProperty(_assertThisInitialized(_this), "onChange", function (formData, newErrorSchema) {
      if ((0, _utils.isObject)(formData) || Array.isArray(formData)) {
        var newState = _this.getStateFromProps(_this.props, formData);

        formData = newState.formData;
      }

      var mustValidate = !_this.props.noValidate && _this.props.liveValidate;
      var state = {
        formData: formData
      };
      var newFormData = formData;

      if (_this.props.omitExtraData === true && _this.props.liveOmit === true) {
        var retrievedSchema = (0, _utils.retrieveSchema)(_this.state.schema, _this.state.schema, formData);
        var pathSchema = (0, _utils.toPathSchema)(retrievedSchema, "", _this.state.schema, formData);

        var fieldNames = _this.getFieldNames(pathSchema, formData);

        newFormData = _this.getUsedFormData(formData, fieldNames);
        state = {
          formData: newFormData
        };
      }

      if (mustValidate) {
        var schemaValidation = _this.validate(newFormData);

        var errors = schemaValidation.errors;
        var errorSchema = schemaValidation.errorSchema;
        var schemaValidationErrors = errors;
        var schemaValidationErrorSchema = errorSchema;

        if (_this.props.extraErrors) {
          errorSchema = (0, _utils.mergeObjects)(errorSchema, _this.props.extraErrors, !!"concat arrays");
          errors = (0, _validate.toErrorList)(errorSchema);
        }

        state = {
          formData: newFormData,
          errors: errors,
          errorSchema: errorSchema,
          schemaValidationErrors: schemaValidationErrors,
          schemaValidationErrorSchema: schemaValidationErrorSchema
        };
      } else if (!_this.props.noValidate && newErrorSchema) {
        var _errorSchema = _this.props.extraErrors ? (0, _utils.mergeObjects)(newErrorSchema, _this.props.extraErrors, !!"concat arrays") : newErrorSchema;

        state = {
          formData: newFormData,
          errorSchema: _errorSchema,
          errors: (0, _validate.toErrorList)(_errorSchema)
        };
      }

      _this.setState(state, function () {
        return _this.props.onChange && _this.props.onChange(_this.state);
      });
    });

    _defineProperty(_assertThisInitialized(_this), "onBlur", function () {
      if (_this.props.onBlur) {
        var _this$props;

        (_this$props = _this.props).onBlur.apply(_this$props, arguments);
      }
    });

    _defineProperty(_assertThisInitialized(_this), "onFocus", function () {
      if (_this.props.onFocus) {
        var _this$props2;

        (_this$props2 = _this.props).onFocus.apply(_this$props2, arguments);
      }
    });

    _defineProperty(_assertThisInitialized(_this), "onSubmit", function (event) {
      event.preventDefault();

      if (event.target !== event.currentTarget) {
        return;
      }

      event.persist();
      var newFormData = _this.state.formData;

      if (_this.props.omitExtraData === true) {
        var retrievedSchema = (0, _utils.retrieveSchema)(_this.state.schema, _this.state.schema, newFormData);
        var pathSchema = (0, _utils.toPathSchema)(retrievedSchema, "", _this.state.schema, newFormData);

        var fieldNames = _this.getFieldNames(pathSchema, newFormData);

        newFormData = _this.getUsedFormData(newFormData, fieldNames);
      }

      if (!_this.props.noValidate) {
        var schemaValidation = _this.validate(newFormData);

        var _errors = schemaValidation.errors;
        var _errorSchema2 = schemaValidation.errorSchema;
        var schemaValidationErrors = _errors;
        var schemaValidationErrorSchema = _errorSchema2;

        if (Object.keys(_errors).length > 0) {
          if (_this.props.extraErrors) {
            _errorSchema2 = (0, _utils.mergeObjects)(_errorSchema2, _this.props.extraErrors, !!"concat arrays");
            _errors = (0, _validate.toErrorList)(_errorSchema2);
          }

          _this.setState({
            errors: _errors,
            errorSchema: _errorSchema2,
            schemaValidationErrors: schemaValidationErrors,
            schemaValidationErrorSchema: schemaValidationErrorSchema
          }, function () {
            if (_this.props.onError) {
              _this.props.onError(_errors);
            } else {
              console.error("Form validation failed", _errors);
            }
          });

          return;
        }
      } // There are no errors generated through schema validation.
      // Check for user provided errors and update state accordingly.


      var errorSchema;
      var errors;

      if (_this.props.extraErrors) {
        errorSchema = _this.props.extraErrors;
        errors = (0, _validate.toErrorList)(errorSchema);
      } else {
        errorSchema = {};
        errors = [];
      }

      _this.setState({
        formData: newFormData,
        errors: errors,
        errorSchema: errorSchema,
        schemaValidationErrors: [],
        schemaValidationErrorSchema: {}
      }, function () {
        if (_this.props.onSubmit) {
          _this.props.onSubmit(_objectSpread({}, _this.state, {
            formData: newFormData,
            status: "submitted"
          }), event);
        }
      });
    });

    _this.state = _this.getStateFromProps(props, props.formData);

    if (_this.props.onChange && !(0, _utils.deepEquals)(_this.state.formData, _this.props.formData)) {
      _this.props.onChange(_this.state);
    }

    _this.formElement = null;
    return _this;
  }

  _createClass(Form, [{
    key: "UNSAFE_componentWillReceiveProps",
    value: function UNSAFE_componentWillReceiveProps(nextProps) {
      var nextState = this.getStateFromProps(nextProps, nextProps.formData);

      if (!(0, _utils.deepEquals)(nextState.formData, nextProps.formData) && !(0, _utils.deepEquals)(nextState.formData, this.state.formData) && this.props.onChange) {
        this.props.onChange(nextState);
      }

      this.setState(nextState);
    }
  }, {
    key: "getStateFromProps",
    value: function getStateFromProps(props, inputFormData) {
      var state = this.state || {};
      var schema = "schema" in props ? props.schema : this.props.schema;
      var validateSchema = "validateSchema" in props ? props.validateSchema : this.props.validateSchema;
      var uiSchema = "uiSchema" in props ? props.uiSchema : this.props.uiSchema;
      var edit = typeof inputFormData !== "undefined";
      var liveValidate = "liveValidate" in props ? props.liveValidate : this.props.liveValidate;
      var mustValidate = edit && !props.noValidate && liveValidate;
      var rootSchema = schema;
      var formData = (0, _utils.getDefaultFormState)(schema, inputFormData, rootSchema);
      var retrievedSchema = (0, _utils.retrieveSchema)(schema, rootSchema, formData);
      var customFormats = props.customFormats;
      var additionalMetaSchemas = props.additionalMetaSchemas;

      var getCurrentErrors = function getCurrentErrors() {
        if (props.noValidate) {
          return {
            errors: [],
            errorSchema: {}
          };
        } else if (!props.liveValidate) {
          return {
            errors: state.schemaValidationErrors || [],
            errorSchema: state.schemaValidationErrorSchema || {}
          };
        }

        return {
          errors: state.errors || [],
          errorSchema: state.errorSchema || {}
        };
      };

      var errors, errorSchema, schemaValidationErrors, schemaValidationErrorSchema;

      if (mustValidate) {
        var schemaValidation = this.validate(formData, schema, additionalMetaSchemas, customFormats, validateSchema);
        errors = schemaValidation.errors;
        errorSchema = schemaValidation.errorSchema;
        schemaValidationErrors = errors;
        schemaValidationErrorSchema = errorSchema;
      } else {
        var currentErrors = getCurrentErrors();
        errors = currentErrors.errors;
        errorSchema = currentErrors.errorSchema;
        schemaValidationErrors = state.schemaValidationErrors;
        schemaValidationErrorSchema = state.schemaValidationErrorSchema;
      }

      if (props.extraErrors) {
        errorSchema = (0, _utils.mergeObjects)(errorSchema, props.extraErrors, !!"concat arrays");
        errors = (0, _validate.toErrorList)(errorSchema);
      }

      var idSchema = (0, _utils.toIdSchema)(retrievedSchema, uiSchema["ui:rootFieldId"], rootSchema, formData, props.idPrefix);
      var nextState = {
        schema: schema,
        uiSchema: uiSchema,
        idSchema: idSchema,
        formData: formData,
        edit: edit,
        errors: errors,
        errorSchema: errorSchema,
        additionalMetaSchemas: additionalMetaSchemas
      };

      if (schemaValidationErrors) {
        nextState.schemaValidationErrors = schemaValidationErrors;
        nextState.schemaValidationErrorSchema = schemaValidationErrorSchema;
      }

      return nextState;
    }
  }, {
    key: "shouldComponentUpdate",
    value: function shouldComponentUpdate(nextProps, nextState) {
      return (0, _utils.shouldRender)(this, nextProps, nextState);
    }
  }, {
    key: "validate",
    value: function validate(formData) {
      var schema = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.props.schema;
      var additionalMetaSchemas = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.props.additionalMetaSchemas;
      var customFormats = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : this.props.customFormats;
      var validateSchema = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : this.props.validateSchema;
      console.log('validate prop', this.props);
      var _this$props3 = this.props,
          validate = _this$props3.validate,
          transformErrors = _this$props3.transformErrors;

      var _this$getRegistry = this.getRegistry(),
          rootSchema = _this$getRegistry.rootSchema;

      var resolvedSchema = (0, _utils.retrieveSchema)(schema, rootSchema, formData);
      var resolvedValidateSchema = (0, _utils.retrieveSchema)(validateSchema, rootSchema, formData);
      console.log('resolvedValidateSchema', resolvedValidateSchema);
      return (0, _validate["default"])(formData, resolvedSchema, validate, transformErrors, additionalMetaSchemas, customFormats, resolvedValidateSchema);
    }
  }, {
    key: "renderErrors",
    value: function renderErrors() {
      var _this$state = this.state,
          errors = _this$state.errors,
          errorSchema = _this$state.errorSchema,
          schema = _this$state.schema,
          uiSchema = _this$state.uiSchema;
      var _this$props4 = this.props,
          ErrorList = _this$props4.ErrorList,
          showErrorList = _this$props4.showErrorList,
          formContext = _this$props4.formContext;

      if (errors.length && showErrorList != false) {
        return _react["default"].createElement(ErrorList, {
          errors: errors,
          errorSchema: errorSchema,
          schema: schema,
          uiSchema: uiSchema,
          formContext: formContext
        });
      }

      return null;
    }
  }, {
    key: "getRegistry",
    value: function getRegistry() {
      // For BC, accept passed SchemaField and TitleField props and pass them to
      // the "fields" registry one.
      var _getDefaultRegistry = (0, _utils.getDefaultRegistry)(),
          fields = _getDefaultRegistry.fields,
          widgets = _getDefaultRegistry.widgets;

      return {
        fields: _objectSpread({}, fields, this.props.fields),
        widgets: _objectSpread({}, widgets, this.props.widgets),
        ArrayFieldTemplate: this.props.ArrayFieldTemplate,
        ObjectFieldTemplate: this.props.ObjectFieldTemplate,
        FieldTemplate: this.props.FieldTemplate,
        definitions: this.props.schema.definitions || {},
        rootSchema: this.props.schema,
        formContext: this.props.formContext || {}
      };
    }
  }, {
    key: "submit",
    value: function submit() {
      if (this.formElement) {
        this.formElement.dispatchEvent(new CustomEvent("submit", {
          cancelable: true
        }));
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var _this$props5 = this.props,
          children = _this$props5.children,
          id = _this$props5.id,
          idPrefix = _this$props5.idPrefix,
          className = _this$props5.className,
          tagName = _this$props5.tagName,
          name = _this$props5.name,
          method = _this$props5.method,
          target = _this$props5.target,
          action = _this$props5.action,
          deprecatedAutocomplete = _this$props5.autocomplete,
          currentAutoComplete = _this$props5.autoComplete,
          enctype = _this$props5.enctype,
          acceptcharset = _this$props5.acceptcharset,
          noHtml5Validate = _this$props5.noHtml5Validate,
          disabled = _this$props5.disabled,
          readonly = _this$props5.readonly,
          formContext = _this$props5.formContext;
      var _this$state2 = this.state,
          schema = _this$state2.schema,
          uiSchema = _this$state2.uiSchema,
          formData = _this$state2.formData,
          errorSchema = _this$state2.errorSchema,
          idSchema = _this$state2.idSchema;
      var registry = this.getRegistry();
      var _SchemaField = registry.fields.SchemaField;
      var FormTag = tagName ? tagName : "form";

      if (deprecatedAutocomplete) {
        console.warn("Using autocomplete property of Form is deprecated, use autoComplete instead.");
      }

      var autoComplete = currentAutoComplete ? currentAutoComplete : deprecatedAutocomplete;
      return _react["default"].createElement(FormTag, {
        className: className ? className : "rjsf",
        id: id,
        name: name,
        method: method,
        target: target,
        action: action,
        autoComplete: autoComplete,
        encType: enctype,
        acceptCharset: acceptcharset,
        noValidate: noHtml5Validate,
        onSubmit: this.onSubmit,
        ref: function ref(form) {
          _this2.formElement = form;
        }
      }, this.renderErrors(), _react["default"].createElement(_SchemaField, {
        schema: schema,
        uiSchema: uiSchema,
        errorSchema: errorSchema,
        idSchema: idSchema,
        idPrefix: idPrefix,
        formContext: formContext,
        formData: formData,
        onChange: this.onChange,
        onBlur: this.onBlur,
        onFocus: this.onFocus,
        registry: registry,
        disabled: disabled,
        readonly: readonly
      }), children ? children : _react["default"].createElement("div", null, _react["default"].createElement("button", {
        type: "submit",
        className: "btn btn-info"
      }, "Submit")));
    }
  }]);

  return Form;
}(_react.Component);

exports["default"] = Form;

_defineProperty(Form, "defaultProps", {
  uiSchema: {},
  noValidate: false,
  liveValidate: false,
  disabled: false,
  readonly: false,
  noHtml5Validate: false,
  ErrorList: _ErrorList["default"],
  omitExtraData: false
});

if (process.env.NODE_ENV !== "production") {
  Form.propTypes = {
    schema: _propTypes["default"].object.isRequired,
    uiSchema: _propTypes["default"].object,
    formData: _propTypes["default"].any,
    disabled: _propTypes["default"].bool,
    readonly: _propTypes["default"].bool,
    widgets: _propTypes["default"].objectOf(_propTypes["default"].oneOfType([_propTypes["default"].func, _propTypes["default"].object])),
    fields: _propTypes["default"].objectOf(_propTypes["default"].elementType),
    ArrayFieldTemplate: _propTypes["default"].elementType,
    ObjectFieldTemplate: _propTypes["default"].elementType,
    FieldTemplate: _propTypes["default"].elementType,
    ErrorList: _propTypes["default"].func,
    onChange: _propTypes["default"].func,
    onError: _propTypes["default"].func,
    showErrorList: _propTypes["default"].bool,
    onSubmit: _propTypes["default"].func,
    id: _propTypes["default"].string,
    className: _propTypes["default"].string,
    tagName: _propTypes["default"].elementType,
    name: _propTypes["default"].string,
    method: _propTypes["default"].string,
    target: _propTypes["default"].string,
    action: _propTypes["default"].string,
    autocomplete: _propTypes["default"].string,
    autoComplete: _propTypes["default"].string,
    enctype: _propTypes["default"].string,
    acceptcharset: _propTypes["default"].string,
    noValidate: _propTypes["default"].bool,
    noHtml5Validate: _propTypes["default"].bool,
    liveValidate: _propTypes["default"].bool,
    validate: _propTypes["default"].func,
    transformErrors: _propTypes["default"].func,
    formContext: _propTypes["default"].object,
    customFormats: _propTypes["default"].object,
    additionalMetaSchemas: _propTypes["default"].arrayOf(_propTypes["default"].object),
    omitExtraData: _propTypes["default"].bool,
    extraErrors: _propTypes["default"].object
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL0Zvcm0uanMiXSwibmFtZXMiOlsiRm9ybSIsInByb3BzIiwiZm9ybURhdGEiLCJmaWVsZHMiLCJsZW5ndGgiLCJkYXRhIiwiQXJyYXkiLCJpc0FycmF5IiwiT2JqZWN0Iiwia2V5cyIsIm1hcCIsImtleSIsInBhdGhTY2hlbWEiLCJnZXRBbGxQYXRocyIsIl9vYmoiLCJhY2MiLCJwYXRocyIsImZvckVhY2giLCJuZXdQYXRocyIsInBhdGgiLCJfX3Jqc2ZfYWRkaXRpb25hbFByb3BlcnRpZXMiLCIkbmFtZSIsInB1c2giLCJyZXBsYWNlIiwiZm9ybVZhbHVlIiwibmV3RXJyb3JTY2hlbWEiLCJuZXdTdGF0ZSIsImdldFN0YXRlRnJvbVByb3BzIiwibXVzdFZhbGlkYXRlIiwibm9WYWxpZGF0ZSIsImxpdmVWYWxpZGF0ZSIsInN0YXRlIiwibmV3Rm9ybURhdGEiLCJvbWl0RXh0cmFEYXRhIiwibGl2ZU9taXQiLCJyZXRyaWV2ZWRTY2hlbWEiLCJzY2hlbWEiLCJmaWVsZE5hbWVzIiwiZ2V0RmllbGROYW1lcyIsImdldFVzZWRGb3JtRGF0YSIsInNjaGVtYVZhbGlkYXRpb24iLCJ2YWxpZGF0ZSIsImVycm9ycyIsImVycm9yU2NoZW1hIiwic2NoZW1hVmFsaWRhdGlvbkVycm9ycyIsInNjaGVtYVZhbGlkYXRpb25FcnJvclNjaGVtYSIsImV4dHJhRXJyb3JzIiwic2V0U3RhdGUiLCJvbkNoYW5nZSIsIm9uQmx1ciIsIm9uRm9jdXMiLCJldmVudCIsInByZXZlbnREZWZhdWx0IiwidGFyZ2V0IiwiY3VycmVudFRhcmdldCIsInBlcnNpc3QiLCJvbkVycm9yIiwiY29uc29sZSIsImVycm9yIiwib25TdWJtaXQiLCJzdGF0dXMiLCJmb3JtRWxlbWVudCIsIm5leHRQcm9wcyIsIm5leHRTdGF0ZSIsImlucHV0Rm9ybURhdGEiLCJ2YWxpZGF0ZVNjaGVtYSIsInVpU2NoZW1hIiwiZWRpdCIsInJvb3RTY2hlbWEiLCJjdXN0b21Gb3JtYXRzIiwiYWRkaXRpb25hbE1ldGFTY2hlbWFzIiwiZ2V0Q3VycmVudEVycm9ycyIsImN1cnJlbnRFcnJvcnMiLCJpZFNjaGVtYSIsImlkUHJlZml4IiwibG9nIiwidHJhbnNmb3JtRXJyb3JzIiwiZ2V0UmVnaXN0cnkiLCJyZXNvbHZlZFNjaGVtYSIsInJlc29sdmVkVmFsaWRhdGVTY2hlbWEiLCJFcnJvckxpc3QiLCJzaG93RXJyb3JMaXN0IiwiZm9ybUNvbnRleHQiLCJ3aWRnZXRzIiwiQXJyYXlGaWVsZFRlbXBsYXRlIiwiT2JqZWN0RmllbGRUZW1wbGF0ZSIsIkZpZWxkVGVtcGxhdGUiLCJkZWZpbml0aW9ucyIsImRpc3BhdGNoRXZlbnQiLCJDdXN0b21FdmVudCIsImNhbmNlbGFibGUiLCJjaGlsZHJlbiIsImlkIiwiY2xhc3NOYW1lIiwidGFnTmFtZSIsIm5hbWUiLCJtZXRob2QiLCJhY3Rpb24iLCJkZXByZWNhdGVkQXV0b2NvbXBsZXRlIiwiYXV0b2NvbXBsZXRlIiwiY3VycmVudEF1dG9Db21wbGV0ZSIsImF1dG9Db21wbGV0ZSIsImVuY3R5cGUiLCJhY2NlcHRjaGFyc2V0Iiwibm9IdG1sNVZhbGlkYXRlIiwiZGlzYWJsZWQiLCJyZWFkb25seSIsInJlZ2lzdHJ5IiwiX1NjaGVtYUZpZWxkIiwiU2NoZW1hRmllbGQiLCJGb3JtVGFnIiwid2FybiIsImZvcm0iLCJyZW5kZXJFcnJvcnMiLCJDb21wb25lbnQiLCJEZWZhdWx0RXJyb3JMaXN0IiwicHJvY2VzcyIsImVudiIsIk5PREVfRU5WIiwicHJvcFR5cGVzIiwiUHJvcFR5cGVzIiwib2JqZWN0IiwiaXNSZXF1aXJlZCIsImFueSIsImJvb2wiLCJvYmplY3RPZiIsIm9uZU9mVHlwZSIsImZ1bmMiLCJlbGVtZW50VHlwZSIsInN0cmluZyIsImFycmF5T2YiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFVQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJ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SUFBQUEsYUFBYSxFQUFFaUIsc0JBQVVTLE1BNUJWO0FBNkJmcEcsSUFBQUEsVUFBVSxFQUFFMkYsc0JBQVVJLElBN0JQO0FBOEJmcEIsSUFBQUEsZUFBZSxFQUFFZ0Isc0JBQVVJLElBOUJaO0FBK0JmOUYsSUFBQUEsWUFBWSxFQUFFMEYsc0JBQVVJLElBL0JUO0FBZ0NmbkYsSUFBQUEsUUFBUSxFQUFFK0Usc0JBQVVPLElBaENMO0FBaUNmbkQsSUFBQUEsZUFBZSxFQUFFNEMsc0JBQVVPLElBakNaO0FBa0NmN0MsSUFBQUEsV0FBVyxFQUFFc0Msc0JBQVVDLE1BbENSO0FBbUNmcEQsSUFBQUEsYUFBYSxFQUFFbUQsc0JBQVVDLE1BbkNWO0FBb0NmbkQsSUFBQUEscUJBQXFCLEVBQUVrRCxzQkFBVVUsT0FBVixDQUFrQlYsc0JBQVVDLE1BQTVCLENBcENSO0FBcUNmeEYsSUFBQUEsYUFBYSxFQUFFdUYsc0JBQVVJLElBckNWO0FBc0NmOUUsSUFBQUEsV0FBVyxFQUFFMEUsc0JBQVVDO0FBdENSLEdBQWpCO0FBd0NEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IENvbXBvbmVudCB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tIFwicHJvcC10eXBlc1wiO1xuaW1wb3J0IF9waWNrIGZyb20gXCJsb2Rhc2gvcGlja1wiO1xuaW1wb3J0IF9nZXQgZnJvbSBcImxvZGFzaC9nZXRcIjtcbmltcG9ydCBfaXNFbXB0eSBmcm9tIFwibG9kYXNoL2lzRW1wdHlcIjtcblxuaW1wb3J0IHsgZGVmYXVsdCBhcyBEZWZhdWx0RXJyb3JMaXN0IH0gZnJvbSBcIi4vRXJyb3JMaXN0XCI7XG5pbXBvcnQge1xuICBnZXREZWZhdWx0Rm9ybVN0YXRlLFxuICByZXRyaWV2ZVNjaGVtYSxcbiAgc2hvdWxkUmVuZGVyLFxuICB0b0lkU2NoZW1hLFxuICBnZXREZWZhdWx0UmVnaXN0cnksXG4gIGRlZXBFcXVhbHMsXG4gIHRvUGF0aFNjaGVtYSxcbiAgaXNPYmplY3QsXG59IGZyb20gXCIuLi91dGlsc1wiO1xuaW1wb3J0IHZhbGlkYXRlRm9ybURhdGEsIHsgdG9FcnJvckxpc3QgfSBmcm9tIFwiLi4vdmFsaWRhdGVcIjtcbmltcG9ydCB7IG1lcmdlT2JqZWN0cyB9IGZyb20gXCIuLi91dGlsc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGb3JtIGV4dGVuZHMgQ29tcG9uZW50IHtcbiAgc3RhdGljIGRlZmF1bHRQcm9wcyA9IHtcbiAgICB1aVNjaGVtYToge30sXG4gICAgbm9WYWxpZGF0ZTogZmFsc2UsXG4gICAgbGl2ZVZhbGlkYXRlOiBmYWxzZSxcbiAgICBkaXNhYmxlZDogZmFsc2UsXG4gICAgcmVhZG9ubHk6IGZhbHNlLFxuICAgIG5vSHRtbDVWYWxpZGF0ZTogZmFsc2UsXG4gICAgRXJyb3JMaXN0OiBEZWZhdWx0RXJyb3JMaXN0LFxuICAgIG9taXRFeHRyYURhdGE6IGZhbHNlLFxuICB9O1xuXG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpO1xuICAgIHRoaXMuc3RhdGUgPSB0aGlzLmdldFN0YXRlRnJvbVByb3BzKHByb3BzLCBwcm9wcy5mb3JtRGF0YSk7XG4gICAgaWYgKFxuICAgICAgdGhpcy5wcm9wcy5vbkNoYW5nZSAmJlxuICAgICAgIWRlZXBFcXVhbHModGhpcy5zdGF0ZS5mb3JtRGF0YSwgdGhpcy5wcm9wcy5mb3JtRGF0YSlcbiAgICApIHtcbiAgICAgIHRoaXMucHJvcHMub25DaGFuZ2UodGhpcy5zdGF0ZSk7XG4gICAgfVxuICAgIHRoaXMuZm9ybUVsZW1lbnQgPSBudWxsO1xuICB9XG5cbiAgVU5TQUZFX2NvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMobmV4dFByb3BzKSB7XG4gICAgY29uc3QgbmV4dFN0YXRlID0gdGhpcy5nZXRTdGF0ZUZyb21Qcm9wcyhuZXh0UHJvcHMsIG5leHRQcm9wcy5mb3JtRGF0YSk7XG4gICAgaWYgKFxuICAgICAgIWRlZXBFcXVhbHMobmV4dFN0YXRlLmZvcm1EYXRhLCBuZXh0UHJvcHMuZm9ybURhdGEpICYmXG4gICAgICAhZGVlcEVxdWFscyhuZXh0U3RhdGUuZm9ybURhdGEsIHRoaXMuc3RhdGUuZm9ybURhdGEpICYmXG4gICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlXG4gICAgKSB7XG4gICAgICB0aGlzLnByb3BzLm9uQ2hhbmdlKG5leHRTdGF0ZSk7XG4gICAgfVxuICAgIHRoaXMuc2V0U3RhdGUobmV4dFN0YXRlKTtcbiAgfVxuXG4gIGdldFN0YXRlRnJvbVByb3BzKHByb3BzLCBpbnB1dEZvcm1EYXRhKSB7XG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLnN0YXRlIHx8IHt9O1xuICAgIGNvbnN0IHNjaGVtYSA9IFwic2NoZW1hXCIgaW4gcHJvcHMgPyBwcm9wcy5zY2hlbWEgOiB0aGlzLnByb3BzLnNjaGVtYTtcbiAgICBjb25zdCB2YWxpZGF0ZVNjaGVtYSA9IFwidmFsaWRhdGVTY2hlbWFcIiBpbiBwcm9wcyA/IHByb3BzLnZhbGlkYXRlU2NoZW1hIDogdGhpcy5wcm9wcy52YWxpZGF0ZVNjaGVtYTtcbiAgICBjb25zdCB1aVNjaGVtYSA9IFwidWlTY2hlbWFcIiBpbiBwcm9wcyA/IHByb3BzLnVpU2NoZW1hIDogdGhpcy5wcm9wcy51aVNjaGVtYTtcbiAgICBjb25zdCBlZGl0ID0gdHlwZW9mIGlucHV0Rm9ybURhdGEgIT09IFwidW5kZWZpbmVkXCI7XG4gICAgY29uc3QgbGl2ZVZhbGlkYXRlID1cbiAgICAgIFwibGl2ZVZhbGlkYXRlXCIgaW4gcHJvcHMgPyBwcm9wcy5saXZlVmFsaWRhdGUgOiB0aGlzLnByb3BzLmxpdmVWYWxpZGF0ZTtcbiAgICBjb25zdCBtdXN0VmFsaWRhdGUgPSBlZGl0ICYmICFwcm9wcy5ub1ZhbGlkYXRlICYmIGxpdmVWYWxpZGF0ZTtcbiAgICBjb25zdCByb290U2NoZW1hID0gc2NoZW1hO1xuICAgIGNvbnN0IGZvcm1EYXRhID0gZ2V0RGVmYXVsdEZvcm1TdGF0ZShzY2hlbWEsIGlucHV0Rm9ybURhdGEsIHJvb3RTY2hlbWEpO1xuICAgIGNvbnN0IHJldHJpZXZlZFNjaGVtYSA9IHJldHJpZXZlU2NoZW1hKHNjaGVtYSwgcm9vdFNjaGVtYSwgZm9ybURhdGEpO1xuICAgIGNvbnN0IGN1c3RvbUZvcm1hdHMgPSBwcm9wcy5jdXN0b21Gb3JtYXRzO1xuICAgIGNvbnN0IGFkZGl0aW9uYWxNZXRhU2NoZW1hcyA9IHByb3BzLmFkZGl0aW9uYWxNZXRhU2NoZW1hcztcblxuICAgIGNvbnN0IGdldEN1cnJlbnRFcnJvcnMgPSAoKSA9PiB7XG4gICAgICBpZiAocHJvcHMubm9WYWxpZGF0ZSkge1xuICAgICAgICByZXR1cm4geyBlcnJvcnM6IFtdLCBlcnJvclNjaGVtYToge30gfTtcbiAgICAgIH0gZWxzZSBpZiAoIXByb3BzLmxpdmVWYWxpZGF0ZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGVycm9yczogc3RhdGUuc2NoZW1hVmFsaWRhdGlvbkVycm9ycyB8fCBbXSxcbiAgICAgICAgICBlcnJvclNjaGVtYTogc3RhdGUuc2NoZW1hVmFsaWRhdGlvbkVycm9yU2NoZW1hIHx8IHt9LFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZXJyb3JzOiBzdGF0ZS5lcnJvcnMgfHwgW10sXG4gICAgICAgIGVycm9yU2NoZW1hOiBzdGF0ZS5lcnJvclNjaGVtYSB8fCB7fSxcbiAgICAgIH07XG4gICAgfTtcblxuICAgIGxldCBlcnJvcnMsXG4gICAgICBlcnJvclNjaGVtYSxcbiAgICAgIHNjaGVtYVZhbGlkYXRpb25FcnJvcnMsXG4gICAgICBzY2hlbWFWYWxpZGF0aW9uRXJyb3JTY2hlbWE7XG4gICAgaWYgKG11c3RWYWxpZGF0ZSkge1xuICAgICAgY29uc3Qgc2NoZW1hVmFsaWRhdGlvbiA9IHRoaXMudmFsaWRhdGUoXG4gICAgICAgIGZvcm1EYXRhLFxuICAgICAgICBzY2hlbWEsXG4gICAgICAgIGFkZGl0aW9uYWxNZXRhU2NoZW1hcyxcbiAgICAgICAgY3VzdG9tRm9ybWF0cyxcbiAgICAgICAgdmFsaWRhdGVTY2hlbWFcbiAgICAgICk7XG4gICAgICBlcnJvcnMgPSBzY2hlbWFWYWxpZGF0aW9uLmVycm9ycztcbiAgICAgIGVycm9yU2NoZW1hID0gc2NoZW1hVmFsaWRhdGlvbi5lcnJvclNjaGVtYTtcbiAgICAgIHNjaGVtYVZhbGlkYXRpb25FcnJvcnMgPSBlcnJvcnM7XG4gICAgICBzY2hlbWFWYWxpZGF0aW9uRXJyb3JTY2hlbWEgPSBlcnJvclNjaGVtYTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgY3VycmVudEVycm9ycyA9IGdldEN1cnJlbnRFcnJvcnMoKTtcbiAgICAgIGVycm9ycyA9IGN1cnJlbnRFcnJvcnMuZXJyb3JzO1xuICAgICAgZXJyb3JTY2hlbWEgPSBjdXJyZW50RXJyb3JzLmVycm9yU2NoZW1hO1xuICAgICAgc2NoZW1hVmFsaWRhdGlvbkVycm9ycyA9IHN0YXRlLnNjaGVtYVZhbGlkYXRpb25FcnJvcnM7XG4gICAgICBzY2hlbWFWYWxpZGF0aW9uRXJyb3JTY2hlbWEgPSBzdGF0ZS5zY2hlbWFWYWxpZGF0aW9uRXJyb3JTY2hlbWE7XG4gICAgfVxuICAgIGlmIChwcm9wcy5leHRyYUVycm9ycykge1xuICAgICAgZXJyb3JTY2hlbWEgPSBtZXJnZU9iamVjdHMoXG4gICAgICAgIGVycm9yU2NoZW1hLFxuICAgICAgICBwcm9wcy5leHRyYUVycm9ycyxcbiAgICAgICAgISFcImNvbmNhdCBhcnJheXNcIlxuICAgICAgKTtcbiAgICAgIGVycm9ycyA9IHRvRXJyb3JMaXN0KGVycm9yU2NoZW1hKTtcbiAgICB9XG4gICAgY29uc3QgaWRTY2hlbWEgPSB0b0lkU2NoZW1hKFxuICAgICAgcmV0cmlldmVkU2NoZW1hLFxuICAgICAgdWlTY2hlbWFbXCJ1aTpyb290RmllbGRJZFwiXSxcbiAgICAgIHJvb3RTY2hlbWEsXG4gICAgICBmb3JtRGF0YSxcbiAgICAgIHByb3BzLmlkUHJlZml4XG4gICAgKTtcbiAgICBjb25zdCBuZXh0U3RhdGUgPSB7XG4gICAgICBzY2hlbWEsXG4gICAgICB1aVNjaGVtYSxcbiAgICAgIGlkU2NoZW1hLFxuICAgICAgZm9ybURhdGEsXG4gICAgICBlZGl0LFxuICAgICAgZXJyb3JzLFxuICAgICAgZXJyb3JTY2hlbWEsXG4gICAgICBhZGRpdGlvbmFsTWV0YVNjaGVtYXMsXG4gICAgfTtcbiAgICBpZiAoc2NoZW1hVmFsaWRhdGlvbkVycm9ycykge1xuICAgICAgbmV4dFN0YXRlLnNjaGVtYVZhbGlkYXRpb25FcnJvcnMgPSBzY2hlbWFWYWxpZGF0aW9uRXJyb3JzO1xuICAgICAgbmV4dFN0YXRlLnNjaGVtYVZhbGlkYXRpb25FcnJvclNjaGVtYSA9IHNjaGVtYVZhbGlkYXRpb25FcnJvclNjaGVtYTtcbiAgICB9XG4gICAgcmV0dXJuIG5leHRTdGF0ZTtcbiAgfVxuXG4gIHNob3VsZENvbXBvbmVudFVwZGF0ZShuZXh0UHJvcHMsIG5leHRTdGF0ZSkge1xuICAgIHJldHVybiBzaG91bGRSZW5kZXIodGhpcywgbmV4dFByb3BzLCBuZXh0U3RhdGUpO1xuICB9XG5cbiAgdmFsaWRhdGUoXG4gICAgZm9ybURhdGEsXG4gICAgc2NoZW1hID0gdGhpcy5wcm9wcy5zY2hlbWEsXG4gICAgYWRkaXRpb25hbE1ldGFTY2hlbWFzID0gdGhpcy5wcm9wcy5hZGRpdGlvbmFsTWV0YVNjaGVtYXMsXG4gICAgY3VzdG9tRm9ybWF0cyA9IHRoaXMucHJvcHMuY3VzdG9tRm9ybWF0cyxcbiAgICB2YWxpZGF0ZVNjaGVtYSA9IHRoaXMucHJvcHMudmFsaWRhdGVTY2hlbWFcbiAgKSB7XG4gICAgY29uc29sZS5sb2coJ3ZhbGlkYXRlIHByb3AnLCB0aGlzLnByb3BzKTtcbiAgICBjb25zdCB7IHZhbGlkYXRlLCB0cmFuc2Zvcm1FcnJvcnMgfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3QgeyByb290U2NoZW1hIH0gPSB0aGlzLmdldFJlZ2lzdHJ5KCk7XG4gICAgY29uc3QgcmVzb2x2ZWRTY2hlbWEgPSByZXRyaWV2ZVNjaGVtYShzY2hlbWEsIHJvb3RTY2hlbWEsIGZvcm1EYXRhKTtcbiAgICBjb25zdCByZXNvbHZlZFZhbGlkYXRlU2NoZW1hID0gcmV0cmlldmVTY2hlbWEodmFsaWRhdGVTY2hlbWEsIHJvb3RTY2hlbWEsIGZvcm1EYXRhKTtcbiAgICBjb25zb2xlLmxvZygncmVzb2x2ZWRWYWxpZGF0ZVNjaGVtYScsIHJlc29sdmVkVmFsaWRhdGVTY2hlbWEpO1xuICAgIHJldHVybiB2YWxpZGF0ZUZvcm1EYXRhKFxuICAgICAgZm9ybURhdGEsXG4gICAgICByZXNvbHZlZFNjaGVtYSxcbiAgICAgIHZhbGlkYXRlLFxuICAgICAgdHJhbnNmb3JtRXJyb3JzLFxuICAgICAgYWRkaXRpb25hbE1ldGFTY2hlbWFzLFxuICAgICAgY3VzdG9tRm9ybWF0cyxcbiAgICAgIHJlc29sdmVkVmFsaWRhdGVTY2hlbWFcbiAgICApO1xuICB9XG5cbiAgcmVuZGVyRXJyb3JzKCkge1xuICAgIGNvbnN0IHsgZXJyb3JzLCBlcnJvclNjaGVtYSwgc2NoZW1hLCB1aVNjaGVtYSB9ID0gdGhpcy5zdGF0ZTtcbiAgICBjb25zdCB7IEVycm9yTGlzdCwgc2hvd0Vycm9yTGlzdCwgZm9ybUNvbnRleHQgfSA9IHRoaXMucHJvcHM7XG5cbiAgICBpZiAoZXJyb3JzLmxlbmd0aCAmJiBzaG93RXJyb3JMaXN0ICE9IGZhbHNlKSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8RXJyb3JMaXN0XG4gICAgICAgICAgZXJyb3JzPXtlcnJvcnN9XG4gICAgICAgICAgZXJyb3JTY2hlbWE9e2Vycm9yU2NoZW1hfVxuICAgICAgICAgIHNjaGVtYT17c2NoZW1hfVxuICAgICAgICAgIHVpU2NoZW1hPXt1aVNjaGVtYX1cbiAgICAgICAgICBmb3JtQ29udGV4dD17Zm9ybUNvbnRleHR9XG4gICAgICAgIC8+XG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGdldFVzZWRGb3JtRGF0YSA9IChmb3JtRGF0YSwgZmllbGRzKSA9PiB7XG4gICAgLy9mb3IgdGhlIGNhc2Ugb2YgYSBzaW5nbGUgaW5wdXQgZm9ybVxuICAgIGlmIChmaWVsZHMubGVuZ3RoID09PSAwICYmIHR5cGVvZiBmb3JtRGF0YSAhPT0gXCJvYmplY3RcIikge1xuICAgICAgcmV0dXJuIGZvcm1EYXRhO1xuICAgIH1cblxuICAgIGxldCBkYXRhID0gX3BpY2soZm9ybURhdGEsIGZpZWxkcyk7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZm9ybURhdGEpKSB7XG4gICAgICByZXR1cm4gT2JqZWN0LmtleXMoZGF0YSkubWFwKGtleSA9PiBkYXRhW2tleV0pO1xuICAgIH1cblxuICAgIHJldHVybiBkYXRhO1xuICB9O1xuXG4gIGdldEZpZWxkTmFtZXMgPSAocGF0aFNjaGVtYSwgZm9ybURhdGEpID0+IHtcbiAgICBjb25zdCBnZXRBbGxQYXRocyA9IChfb2JqLCBhY2MgPSBbXSwgcGF0aHMgPSBbXCJcIl0pID0+IHtcbiAgICAgIE9iamVjdC5rZXlzKF9vYmopLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBfb2JqW2tleV0gPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICBsZXQgbmV3UGF0aHMgPSBwYXRocy5tYXAocGF0aCA9PiBgJHtwYXRofS4ke2tleX1gKTtcbiAgICAgICAgICAvLyBJZiBhbiBvYmplY3QgaXMgbWFya2VkIHdpdGggYWRkaXRpb25hbFByb3BlcnRpZXMsIGFsbCBpdHMga2V5cyBhcmUgdmFsaWRcbiAgICAgICAgICBpZiAoX29ialtrZXldLl9fcmpzZl9hZGRpdGlvbmFsUHJvcGVydGllcyAmJiBfb2JqW2tleV0uJG5hbWUgIT09IFwiXCIpIHtcbiAgICAgICAgICAgIGFjYy5wdXNoKF9vYmpba2V5XS4kbmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdldEFsbFBhdGhzKF9vYmpba2V5XSwgYWNjLCBuZXdQYXRocyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGtleSA9PT0gXCIkbmFtZVwiICYmIF9vYmpba2V5XSAhPT0gXCJcIikge1xuICAgICAgICAgIHBhdGhzLmZvckVhY2gocGF0aCA9PiB7XG4gICAgICAgICAgICBwYXRoID0gcGF0aC5yZXBsYWNlKC9eXFwuLywgXCJcIik7XG4gICAgICAgICAgICBjb25zdCBmb3JtVmFsdWUgPSBfZ2V0KGZvcm1EYXRhLCBwYXRoKTtcbiAgICAgICAgICAgIC8vIGFkZHMgcGF0aCB0byBmaWVsZE5hbWVzIGlmIGl0IHBvaW50cyB0byBhIHZhbHVlXG4gICAgICAgICAgICAvLyBvciBhbiBlbXB0eSBvYmplY3QvYXJyYXlcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZm9ybVZhbHVlICE9PSBcIm9iamVjdFwiIHx8IF9pc0VtcHR5KGZvcm1WYWx1ZSkpIHtcbiAgICAgICAgICAgICAgYWNjLnB1c2gocGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGFjYztcbiAgICB9O1xuXG4gICAgcmV0dXJuIGdldEFsbFBhdGhzKHBhdGhTY2hlbWEpO1xuICB9O1xuXG4gIG9uQ2hhbmdlID0gKGZvcm1EYXRhLCBuZXdFcnJvclNjaGVtYSkgPT4ge1xuICAgIGlmIChpc09iamVjdChmb3JtRGF0YSkgfHwgQXJyYXkuaXNBcnJheShmb3JtRGF0YSkpIHtcbiAgICAgIGNvbnN0IG5ld1N0YXRlID0gdGhpcy5nZXRTdGF0ZUZyb21Qcm9wcyh0aGlzLnByb3BzLCBmb3JtRGF0YSk7XG4gICAgICBmb3JtRGF0YSA9IG5ld1N0YXRlLmZvcm1EYXRhO1xuICAgIH1cbiAgICBjb25zdCBtdXN0VmFsaWRhdGUgPSAhdGhpcy5wcm9wcy5ub1ZhbGlkYXRlICYmIHRoaXMucHJvcHMubGl2ZVZhbGlkYXRlO1xuICAgIGxldCBzdGF0ZSA9IHsgZm9ybURhdGEgfTtcbiAgICBsZXQgbmV3Rm9ybURhdGEgPSBmb3JtRGF0YTtcblxuICAgIGlmICh0aGlzLnByb3BzLm9taXRFeHRyYURhdGEgPT09IHRydWUgJiYgdGhpcy5wcm9wcy5saXZlT21pdCA9PT0gdHJ1ZSkge1xuICAgICAgY29uc3QgcmV0cmlldmVkU2NoZW1hID0gcmV0cmlldmVTY2hlbWEoXG4gICAgICAgIHRoaXMuc3RhdGUuc2NoZW1hLFxuICAgICAgICB0aGlzLnN0YXRlLnNjaGVtYSxcbiAgICAgICAgZm9ybURhdGFcbiAgICAgICk7XG4gICAgICBjb25zdCBwYXRoU2NoZW1hID0gdG9QYXRoU2NoZW1hKFxuICAgICAgICByZXRyaWV2ZWRTY2hlbWEsXG4gICAgICAgIFwiXCIsXG4gICAgICAgIHRoaXMuc3RhdGUuc2NoZW1hLFxuICAgICAgICBmb3JtRGF0YVxuICAgICAgKTtcblxuICAgICAgY29uc3QgZmllbGROYW1lcyA9IHRoaXMuZ2V0RmllbGROYW1lcyhwYXRoU2NoZW1hLCBmb3JtRGF0YSk7XG5cbiAgICAgIG5ld0Zvcm1EYXRhID0gdGhpcy5nZXRVc2VkRm9ybURhdGEoZm9ybURhdGEsIGZpZWxkTmFtZXMpO1xuICAgICAgc3RhdGUgPSB7XG4gICAgICAgIGZvcm1EYXRhOiBuZXdGb3JtRGF0YSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKG11c3RWYWxpZGF0ZSkge1xuICAgICAgbGV0IHNjaGVtYVZhbGlkYXRpb24gPSB0aGlzLnZhbGlkYXRlKG5ld0Zvcm1EYXRhKTtcbiAgICAgIGxldCBlcnJvcnMgPSBzY2hlbWFWYWxpZGF0aW9uLmVycm9ycztcbiAgICAgIGxldCBlcnJvclNjaGVtYSA9IHNjaGVtYVZhbGlkYXRpb24uZXJyb3JTY2hlbWE7XG4gICAgICBjb25zdCBzY2hlbWFWYWxpZGF0aW9uRXJyb3JzID0gZXJyb3JzO1xuICAgICAgY29uc3Qgc2NoZW1hVmFsaWRhdGlvbkVycm9yU2NoZW1hID0gZXJyb3JTY2hlbWE7XG4gICAgICBpZiAodGhpcy5wcm9wcy5leHRyYUVycm9ycykge1xuICAgICAgICBlcnJvclNjaGVtYSA9IG1lcmdlT2JqZWN0cyhcbiAgICAgICAgICBlcnJvclNjaGVtYSxcbiAgICAgICAgICB0aGlzLnByb3BzLmV4dHJhRXJyb3JzLFxuICAgICAgICAgICEhXCJjb25jYXQgYXJyYXlzXCJcbiAgICAgICAgKTtcbiAgICAgICAgZXJyb3JzID0gdG9FcnJvckxpc3QoZXJyb3JTY2hlbWEpO1xuICAgICAgfVxuICAgICAgc3RhdGUgPSB7XG4gICAgICAgIGZvcm1EYXRhOiBuZXdGb3JtRGF0YSxcbiAgICAgICAgZXJyb3JzLFxuICAgICAgICBlcnJvclNjaGVtYSxcbiAgICAgICAgc2NoZW1hVmFsaWRhdGlvbkVycm9ycyxcbiAgICAgICAgc2NoZW1hVmFsaWRhdGlvbkVycm9yU2NoZW1hLFxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKCF0aGlzLnByb3BzLm5vVmFsaWRhdGUgJiYgbmV3RXJyb3JTY2hlbWEpIHtcbiAgICAgIGNvbnN0IGVycm9yU2NoZW1hID0gdGhpcy5wcm9wcy5leHRyYUVycm9yc1xuICAgICAgICA/IG1lcmdlT2JqZWN0cyhcbiAgICAgICAgICAgIG5ld0Vycm9yU2NoZW1hLFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5leHRyYUVycm9ycyxcbiAgICAgICAgICAgICEhXCJjb25jYXQgYXJyYXlzXCJcbiAgICAgICAgICApXG4gICAgICAgIDogbmV3RXJyb3JTY2hlbWE7XG4gICAgICBzdGF0ZSA9IHtcbiAgICAgICAgZm9ybURhdGE6IG5ld0Zvcm1EYXRhLFxuICAgICAgICBlcnJvclNjaGVtYTogZXJyb3JTY2hlbWEsXG4gICAgICAgIGVycm9yczogdG9FcnJvckxpc3QoZXJyb3JTY2hlbWEpLFxuICAgICAgfTtcbiAgICB9XG4gICAgdGhpcy5zZXRTdGF0ZShcbiAgICAgIHN0YXRlLFxuICAgICAgKCkgPT4gdGhpcy5wcm9wcy5vbkNoYW5nZSAmJiB0aGlzLnByb3BzLm9uQ2hhbmdlKHRoaXMuc3RhdGUpXG4gICAgKTtcbiAgfTtcblxuICBvbkJsdXIgPSAoLi4uYXJncykgPT4ge1xuICAgIGlmICh0aGlzLnByb3BzLm9uQmx1cikge1xuICAgICAgdGhpcy5wcm9wcy5vbkJsdXIoLi4uYXJncyk7XG4gICAgfVxuICB9O1xuXG4gIG9uRm9jdXMgPSAoLi4uYXJncykgPT4ge1xuICAgIGlmICh0aGlzLnByb3BzLm9uRm9jdXMpIHtcbiAgICAgIHRoaXMucHJvcHMub25Gb2N1cyguLi5hcmdzKTtcbiAgICB9XG4gIH07XG5cbiAgb25TdWJtaXQgPSBldmVudCA9PiB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBpZiAoZXZlbnQudGFyZ2V0ICE9PSBldmVudC5jdXJyZW50VGFyZ2V0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZXZlbnQucGVyc2lzdCgpO1xuICAgIGxldCBuZXdGb3JtRGF0YSA9IHRoaXMuc3RhdGUuZm9ybURhdGE7XG5cbiAgICBpZiAodGhpcy5wcm9wcy5vbWl0RXh0cmFEYXRhID09PSB0cnVlKSB7XG4gICAgICBjb25zdCByZXRyaWV2ZWRTY2hlbWEgPSByZXRyaWV2ZVNjaGVtYShcbiAgICAgICAgdGhpcy5zdGF0ZS5zY2hlbWEsXG4gICAgICAgIHRoaXMuc3RhdGUuc2NoZW1hLFxuICAgICAgICBuZXdGb3JtRGF0YVxuICAgICAgKTtcbiAgICAgIGNvbnN0IHBhdGhTY2hlbWEgPSB0b1BhdGhTY2hlbWEoXG4gICAgICAgIHJldHJpZXZlZFNjaGVtYSxcbiAgICAgICAgXCJcIixcbiAgICAgICAgdGhpcy5zdGF0ZS5zY2hlbWEsXG4gICAgICAgIG5ld0Zvcm1EYXRhXG4gICAgICApO1xuXG4gICAgICBjb25zdCBmaWVsZE5hbWVzID0gdGhpcy5nZXRGaWVsZE5hbWVzKHBhdGhTY2hlbWEsIG5ld0Zvcm1EYXRhKTtcblxuICAgICAgbmV3Rm9ybURhdGEgPSB0aGlzLmdldFVzZWRGb3JtRGF0YShuZXdGb3JtRGF0YSwgZmllbGROYW1lcyk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLnByb3BzLm5vVmFsaWRhdGUpIHtcbiAgICAgIGxldCBzY2hlbWFWYWxpZGF0aW9uID0gdGhpcy52YWxpZGF0ZShuZXdGb3JtRGF0YSk7XG4gICAgICBsZXQgZXJyb3JzID0gc2NoZW1hVmFsaWRhdGlvbi5lcnJvcnM7XG4gICAgICBsZXQgZXJyb3JTY2hlbWEgPSBzY2hlbWFWYWxpZGF0aW9uLmVycm9yU2NoZW1hO1xuICAgICAgY29uc3Qgc2NoZW1hVmFsaWRhdGlvbkVycm9ycyA9IGVycm9ycztcbiAgICAgIGNvbnN0IHNjaGVtYVZhbGlkYXRpb25FcnJvclNjaGVtYSA9IGVycm9yU2NoZW1hO1xuICAgICAgaWYgKE9iamVjdC5rZXlzKGVycm9ycykubGVuZ3RoID4gMCkge1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5leHRyYUVycm9ycykge1xuICAgICAgICAgIGVycm9yU2NoZW1hID0gbWVyZ2VPYmplY3RzKFxuICAgICAgICAgICAgZXJyb3JTY2hlbWEsXG4gICAgICAgICAgICB0aGlzLnByb3BzLmV4dHJhRXJyb3JzLFxuICAgICAgICAgICAgISFcImNvbmNhdCBhcnJheXNcIlxuICAgICAgICAgICk7XG4gICAgICAgICAgZXJyb3JzID0gdG9FcnJvckxpc3QoZXJyb3JTY2hlbWEpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoXG4gICAgICAgICAge1xuICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgZXJyb3JTY2hlbWEsXG4gICAgICAgICAgICBzY2hlbWFWYWxpZGF0aW9uRXJyb3JzLFxuICAgICAgICAgICAgc2NoZW1hVmFsaWRhdGlvbkVycm9yU2NoZW1hLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMucHJvcHMub25FcnJvcikge1xuICAgICAgICAgICAgICB0aGlzLnByb3BzLm9uRXJyb3IoZXJyb3JzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGb3JtIHZhbGlkYXRpb24gZmFpbGVkXCIsIGVycm9ycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVGhlcmUgYXJlIG5vIGVycm9ycyBnZW5lcmF0ZWQgdGhyb3VnaCBzY2hlbWEgdmFsaWRhdGlvbi5cbiAgICAvLyBDaGVjayBmb3IgdXNlciBwcm92aWRlZCBlcnJvcnMgYW5kIHVwZGF0ZSBzdGF0ZSBhY2NvcmRpbmdseS5cbiAgICBsZXQgZXJyb3JTY2hlbWE7XG4gICAgbGV0IGVycm9ycztcbiAgICBpZiAodGhpcy5wcm9wcy5leHRyYUVycm9ycykge1xuICAgICAgZXJyb3JTY2hlbWEgPSB0aGlzLnByb3BzLmV4dHJhRXJyb3JzO1xuICAgICAgZXJyb3JzID0gdG9FcnJvckxpc3QoZXJyb3JTY2hlbWEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlcnJvclNjaGVtYSA9IHt9O1xuICAgICAgZXJyb3JzID0gW107XG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZShcbiAgICAgIHtcbiAgICAgICAgZm9ybURhdGE6IG5ld0Zvcm1EYXRhLFxuICAgICAgICBlcnJvcnM6IGVycm9ycyxcbiAgICAgICAgZXJyb3JTY2hlbWE6IGVycm9yU2NoZW1hLFxuICAgICAgICBzY2hlbWFWYWxpZGF0aW9uRXJyb3JzOiBbXSxcbiAgICAgICAgc2NoZW1hVmFsaWRhdGlvbkVycm9yU2NoZW1hOiB7fSxcbiAgICAgIH0sXG4gICAgICAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLm9uU3VibWl0KSB7XG4gICAgICAgICAgdGhpcy5wcm9wcy5vblN1Ym1pdChcbiAgICAgICAgICAgIHsgLi4udGhpcy5zdGF0ZSwgZm9ybURhdGE6IG5ld0Zvcm1EYXRhLCBzdGF0dXM6IFwic3VibWl0dGVkXCIgfSxcbiAgICAgICAgICAgIGV2ZW50XG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gIH07XG5cbiAgZ2V0UmVnaXN0cnkoKSB7XG4gICAgLy8gRm9yIEJDLCBhY2NlcHQgcGFzc2VkIFNjaGVtYUZpZWxkIGFuZCBUaXRsZUZpZWxkIHByb3BzIGFuZCBwYXNzIHRoZW0gdG9cbiAgICAvLyB0aGUgXCJmaWVsZHNcIiByZWdpc3RyeSBvbmUuXG4gICAgY29uc3QgeyBmaWVsZHMsIHdpZGdldHMgfSA9IGdldERlZmF1bHRSZWdpc3RyeSgpO1xuICAgIHJldHVybiB7XG4gICAgICBmaWVsZHM6IHsgLi4uZmllbGRzLCAuLi50aGlzLnByb3BzLmZpZWxkcyB9LFxuICAgICAgd2lkZ2V0czogeyAuLi53aWRnZXRzLCAuLi50aGlzLnByb3BzLndpZGdldHMgfSxcbiAgICAgIEFycmF5RmllbGRUZW1wbGF0ZTogdGhpcy5wcm9wcy5BcnJheUZpZWxkVGVtcGxhdGUsXG4gICAgICBPYmplY3RGaWVsZFRlbXBsYXRlOiB0aGlzLnByb3BzLk9iamVjdEZpZWxkVGVtcGxhdGUsXG4gICAgICBGaWVsZFRlbXBsYXRlOiB0aGlzLnByb3BzLkZpZWxkVGVtcGxhdGUsXG4gICAgICBkZWZpbml0aW9uczogdGhpcy5wcm9wcy5zY2hlbWEuZGVmaW5pdGlvbnMgfHwge30sXG4gICAgICByb290U2NoZW1hOiB0aGlzLnByb3BzLnNjaGVtYSxcbiAgICAgIGZvcm1Db250ZXh0OiB0aGlzLnByb3BzLmZvcm1Db250ZXh0IHx8IHt9LFxuICAgIH07XG4gIH1cblxuICBzdWJtaXQoKSB7XG4gICAgaWYgKHRoaXMuZm9ybUVsZW1lbnQpIHtcbiAgICAgIHRoaXMuZm9ybUVsZW1lbnQuZGlzcGF0Y2hFdmVudChcbiAgICAgICAgbmV3IEN1c3RvbUV2ZW50KFwic3VibWl0XCIsIHtcbiAgICAgICAgICBjYW5jZWxhYmxlOiB0cnVlLFxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgY29uc3Qge1xuICAgICAgY2hpbGRyZW4sXG4gICAgICBpZCxcbiAgICAgIGlkUHJlZml4LFxuICAgICAgY2xhc3NOYW1lLFxuICAgICAgdGFnTmFtZSxcbiAgICAgIG5hbWUsXG4gICAgICBtZXRob2QsXG4gICAgICB0YXJnZXQsXG4gICAgICBhY3Rpb24sXG4gICAgICBhdXRvY29tcGxldGU6IGRlcHJlY2F0ZWRBdXRvY29tcGxldGUsXG4gICAgICBhdXRvQ29tcGxldGU6IGN1cnJlbnRBdXRvQ29tcGxldGUsXG4gICAgICBlbmN0eXBlLFxuICAgICAgYWNjZXB0Y2hhcnNldCxcbiAgICAgIG5vSHRtbDVWYWxpZGF0ZSxcbiAgICAgIGRpc2FibGVkLFxuICAgICAgcmVhZG9ubHksXG4gICAgICBmb3JtQ29udGV4dCxcbiAgICB9ID0gdGhpcy5wcm9wcztcblxuICAgIGNvbnN0IHsgc2NoZW1hLCB1aVNjaGVtYSwgZm9ybURhdGEsIGVycm9yU2NoZW1hLCBpZFNjaGVtYSB9ID0gdGhpcy5zdGF0ZTtcbiAgICBjb25zdCByZWdpc3RyeSA9IHRoaXMuZ2V0UmVnaXN0cnkoKTtcbiAgICBjb25zdCBfU2NoZW1hRmllbGQgPSByZWdpc3RyeS5maWVsZHMuU2NoZW1hRmllbGQ7XG4gICAgY29uc3QgRm9ybVRhZyA9IHRhZ05hbWUgPyB0YWdOYW1lIDogXCJmb3JtXCI7XG4gICAgaWYgKGRlcHJlY2F0ZWRBdXRvY29tcGxldGUpIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgXCJVc2luZyBhdXRvY29tcGxldGUgcHJvcGVydHkgb2YgRm9ybSBpcyBkZXByZWNhdGVkLCB1c2UgYXV0b0NvbXBsZXRlIGluc3RlYWQuXCJcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IGF1dG9Db21wbGV0ZSA9IGN1cnJlbnRBdXRvQ29tcGxldGVcbiAgICAgID8gY3VycmVudEF1dG9Db21wbGV0ZVxuICAgICAgOiBkZXByZWNhdGVkQXV0b2NvbXBsZXRlO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxGb3JtVGFnXG4gICAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lID8gY2xhc3NOYW1lIDogXCJyanNmXCJ9XG4gICAgICAgIGlkPXtpZH1cbiAgICAgICAgbmFtZT17bmFtZX1cbiAgICAgICAgbWV0aG9kPXttZXRob2R9XG4gICAgICAgIHRhcmdldD17dGFyZ2V0fVxuICAgICAgICBhY3Rpb249e2FjdGlvbn1cbiAgICAgICAgYXV0b0NvbXBsZXRlPXthdXRvQ29tcGxldGV9XG4gICAgICAgIGVuY1R5cGU9e2VuY3R5cGV9XG4gICAgICAgIGFjY2VwdENoYXJzZXQ9e2FjY2VwdGNoYXJzZXR9XG4gICAgICAgIG5vVmFsaWRhdGU9e25vSHRtbDVWYWxpZGF0ZX1cbiAgICAgICAgb25TdWJtaXQ9e3RoaXMub25TdWJtaXR9XG4gICAgICAgIHJlZj17Zm9ybSA9PiB7XG4gICAgICAgICAgdGhpcy5mb3JtRWxlbWVudCA9IGZvcm07XG4gICAgICAgIH19PlxuICAgICAgICB7dGhpcy5yZW5kZXJFcnJvcnMoKX1cbiAgICAgICAgPF9TY2hlbWFGaWVsZFxuICAgICAgICAgIHNjaGVtYT17c2NoZW1hfVxuICAgICAgICAgIHVpU2NoZW1hPXt1aVNjaGVtYX1cbiAgICAgICAgICBlcnJvclNjaGVtYT17ZXJyb3JTY2hlbWF9XG4gICAgICAgICAgaWRTY2hlbWE9e2lkU2NoZW1hfVxuICAgICAgICAgIGlkUHJlZml4PXtpZFByZWZpeH1cbiAgICAgICAgICBmb3JtQ29udGV4dD17Zm9ybUNvbnRleHR9XG4gICAgICAgICAgZm9ybURhdGE9e2Zvcm1EYXRhfVxuICAgICAgICAgIG9uQ2hhbmdlPXt0aGlzLm9uQ2hhbmdlfVxuICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJ9XG4gICAgICAgICAgb25Gb2N1cz17dGhpcy5vbkZvY3VzfVxuICAgICAgICAgIHJlZ2lzdHJ5PXtyZWdpc3RyeX1cbiAgICAgICAgICBkaXNhYmxlZD17ZGlzYWJsZWR9XG4gICAgICAgICAgcmVhZG9ubHk9e3JlYWRvbmx5fVxuICAgICAgICAvPlxuICAgICAgICB7Y2hpbGRyZW4gPyAoXG4gICAgICAgICAgY2hpbGRyZW5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi1pbmZvXCI+XG4gICAgICAgICAgICAgIFN1Ym1pdFxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG4gICAgICA8L0Zvcm1UYWc+XG4gICAgKTtcbiAgfVxufVxuXG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB7XG4gIEZvcm0ucHJvcFR5cGVzID0ge1xuICAgIHNjaGVtYTogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgIHVpU2NoZW1hOiBQcm9wVHlwZXMub2JqZWN0LFxuICAgIGZvcm1EYXRhOiBQcm9wVHlwZXMuYW55LFxuICAgIGRpc2FibGVkOiBQcm9wVHlwZXMuYm9vbCxcbiAgICByZWFkb25seTogUHJvcFR5cGVzLmJvb2wsXG4gICAgd2lkZ2V0czogUHJvcFR5cGVzLm9iamVjdE9mKFxuICAgICAgUHJvcFR5cGVzLm9uZU9mVHlwZShbUHJvcFR5cGVzLmZ1bmMsIFByb3BUeXBlcy5vYmplY3RdKVxuICAgICksXG4gICAgZmllbGRzOiBQcm9wVHlwZXMub2JqZWN0T2YoUHJvcFR5cGVzLmVsZW1lbnRUeXBlKSxcbiAgICBBcnJheUZpZWxkVGVtcGxhdGU6IFByb3BUeXBlcy5lbGVtZW50VHlwZSxcbiAgICBPYmplY3RGaWVsZFRlbXBsYXRlOiBQcm9wVHlwZXMuZWxlbWVudFR5cGUsXG4gICAgRmllbGRUZW1wbGF0ZTogUHJvcFR5cGVzLmVsZW1lbnRUeXBlLFxuICAgIEVycm9yTGlzdDogUHJvcFR5cGVzLmZ1bmMsXG4gICAgb25DaGFuZ2U6IFByb3BUeXBlcy5mdW5jLFxuICAgIG9uRXJyb3I6IFByb3BUeXBlcy5mdW5jLFxuICAgIHNob3dFcnJvckxpc3Q6IFByb3BUeXBlcy5ib29sLFxuICAgIG9uU3VibWl0OiBQcm9wVHlwZXMuZnVuYyxcbiAgICBpZDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICBjbGFzc05hbWU6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgdGFnTmFtZTogUHJvcFR5cGVzLmVsZW1lbnRUeXBlLFxuICAgIG5hbWU6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgbWV0aG9kOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgIHRhcmdldDogUHJvcFR5cGVzLnN0cmluZyxcbiAgICBhY3Rpb246IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgYXV0b2NvbXBsZXRlOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgIGF1dG9Db21wbGV0ZTogUHJvcFR5cGVzLnN0cmluZyxcbiAgICBlbmN0eXBlOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgIGFjY2VwdGNoYXJzZXQ6IFByb3BUeXBlcy5zdHJpbmcsXG4gICAgbm9WYWxpZGF0ZTogUHJvcFR5cGVzLmJvb2wsXG4gICAgbm9IdG1sNVZhbGlkYXRlOiBQcm9wVHlwZXMuYm9vbCxcbiAgICBsaXZlVmFsaWRhdGU6IFByb3BUeXBlcy5ib29sLFxuICAgIHZhbGlkYXRlOiBQcm9wVHlwZXMuZnVuYyxcbiAgICB0cmFuc2Zvcm1FcnJvcnM6IFByb3BUeXBlcy5mdW5jLFxuICAgIGZvcm1Db250ZXh0OiBQcm9wVHlwZXMub2JqZWN0LFxuICAgIGN1c3RvbUZvcm1hdHM6IFByb3BUeXBlcy5vYmplY3QsXG4gICAgYWRkaXRpb25hbE1ldGFTY2hlbWFzOiBQcm9wVHlwZXMuYXJyYXlPZihQcm9wVHlwZXMub2JqZWN0KSxcbiAgICBvbWl0RXh0cmFEYXRhOiBQcm9wVHlwZXMuYm9vbCxcbiAgICBleHRyYUVycm9yczogUHJvcFR5cGVzLm9iamVjdCxcbiAgfTtcbn1cbiJdfQ==