"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _ = _interopRequireDefault(require("./"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function withTheme(themeProps) {
  return (0, _react.forwardRef)(function (_ref, ref) {
    var fields = _ref.fields,
        widgets = _ref.widgets,
        directProps = _objectWithoutProperties(_ref, ["fields", "widgets"]);

    fields = _objectSpread({}, themeProps.fields, fields);
    widgets = _objectSpread({}, themeProps.widgets, widgets);
    var formData = themeProps.formData ? themeProps.formData : directProps.formData;
    return _react["default"].createElement(_["default"], _extends({}, themeProps, directProps, {
      formData: formData,
      fields: fields,
      widgets: widgets,
      ref: ref
    }));
  });
}

withTheme.propTypes = {
  widgets: _propTypes["default"].object,
  fields: _propTypes["default"].object
};
var _default = withTheme;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93aXRoVGhlbWUuanMiXSwibmFtZXMiOlsid2l0aFRoZW1lIiwidGhlbWVQcm9wcyIsInJlZiIsImZpZWxkcyIsIndpZGdldHMiLCJkaXJlY3RQcm9wcyIsImZvcm1EYXRhIiwicHJvcFR5cGVzIiwiUHJvcFR5cGVzIiwib2JqZWN0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxTQUFTQSxTQUFULENBQW1CQyxVQUFuQixFQUErQjtBQUM3QixTQUFPLHVCQUFXLGdCQUFzQ0MsR0FBdEMsRUFBOEM7QUFBQSxRQUEzQ0MsTUFBMkMsUUFBM0NBLE1BQTJDO0FBQUEsUUFBbkNDLE9BQW1DLFFBQW5DQSxPQUFtQztBQUFBLFFBQXZCQyxXQUF1Qjs7QUFDOURGLElBQUFBLE1BQU0scUJBQVFGLFVBQVUsQ0FBQ0UsTUFBbkIsRUFBOEJBLE1BQTlCLENBQU47QUFDQUMsSUFBQUEsT0FBTyxxQkFBUUgsVUFBVSxDQUFDRyxPQUFuQixFQUErQkEsT0FBL0IsQ0FBUDtBQUVBLFFBQU1FLFFBQVEsR0FBR0wsVUFBVSxDQUFDSyxRQUFYLEdBQXNCTCxVQUFVLENBQUNLLFFBQWpDLEdBQTRDRCxXQUFXLENBQUNDLFFBQXpFO0FBRUEsV0FDRSxnQ0FBQyxZQUFELGVBQ01MLFVBRE4sRUFFTUksV0FGTjtBQUdFLE1BQUEsUUFBUSxFQUFFQyxRQUhaO0FBSUUsTUFBQSxNQUFNLEVBQUVILE1BSlY7QUFLRSxNQUFBLE9BQU8sRUFBRUMsT0FMWDtBQU1FLE1BQUEsR0FBRyxFQUFFRjtBQU5QLE9BREY7QUFVRCxHQWhCTSxDQUFQO0FBaUJEOztBQUVERixTQUFTLENBQUNPLFNBQVYsR0FBc0I7QUFDcEJILEVBQUFBLE9BQU8sRUFBRUksc0JBQVVDLE1BREM7QUFFcEJOLEVBQUFBLE1BQU0sRUFBRUssc0JBQVVDO0FBRkUsQ0FBdEI7ZUFLZVQsUyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyBmb3J3YXJkUmVmIH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgUHJvcFR5cGVzIGZyb20gXCJwcm9wLXR5cGVzXCI7XG5pbXBvcnQgRm9ybSBmcm9tIFwiLi9cIjtcblxuZnVuY3Rpb24gd2l0aFRoZW1lKHRoZW1lUHJvcHMpIHtcbiAgcmV0dXJuIGZvcndhcmRSZWYoKHsgZmllbGRzLCB3aWRnZXRzLCAuLi5kaXJlY3RQcm9wcyB9LCByZWYpID0+IHtcbiAgICBmaWVsZHMgPSB7IC4uLnRoZW1lUHJvcHMuZmllbGRzLCAuLi5maWVsZHMgfTtcbiAgICB3aWRnZXRzID0geyAuLi50aGVtZVByb3BzLndpZGdldHMsIC4uLndpZGdldHMgfTtcblxuICAgIGNvbnN0IGZvcm1EYXRhID0gdGhlbWVQcm9wcy5mb3JtRGF0YSA/IHRoZW1lUHJvcHMuZm9ybURhdGEgOiBkaXJlY3RQcm9wcy5mb3JtRGF0YTtcblxuICAgIHJldHVybiAoXG4gICAgICA8Rm9ybVxuICAgICAgICB7Li4udGhlbWVQcm9wc31cbiAgICAgICAgey4uLmRpcmVjdFByb3BzfVxuICAgICAgICBmb3JtRGF0YT17Zm9ybURhdGF9XG4gICAgICAgIGZpZWxkcz17ZmllbGRzfVxuICAgICAgICB3aWRnZXRzPXt3aWRnZXRzfVxuICAgICAgICByZWY9e3JlZn1cbiAgICAgIC8+XG4gICAgKTtcbiAgfSk7XG59XG5cbndpdGhUaGVtZS5wcm9wVHlwZXMgPSB7XG4gIHdpZGdldHM6IFByb3BUeXBlcy5vYmplY3QsXG4gIGZpZWxkczogUHJvcFR5cGVzLm9iamVjdCxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHdpdGhUaGVtZTtcbiJdfQ==