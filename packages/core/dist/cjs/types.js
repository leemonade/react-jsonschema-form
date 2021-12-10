"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fieldProps = exports.registry = void 0;

var _propTypes = _interopRequireDefault(require("prop-types"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var registry = _propTypes["default"].shape({
  ArrayFieldTemplate: _propTypes["default"].elementType,
  FieldTemplate: _propTypes["default"].elementType,
  ObjectFieldTemplate: _propTypes["default"].elementType,
  definitions: _propTypes["default"].object.isRequired,
  rootSchema: _propTypes["default"].object,
  fields: _propTypes["default"].objectOf(_propTypes["default"].elementType).isRequired,
  formContext: _propTypes["default"].object.isRequired,
  widgets: _propTypes["default"].objectOf(_propTypes["default"].oneOfType([_propTypes["default"].func, _propTypes["default"].object])).isRequired
});

exports.registry = registry;
var fieldProps = {
  autofocus: _propTypes["default"].bool,
  disabled: _propTypes["default"].bool,
  errorSchema: _propTypes["default"].object,
  formData: _propTypes["default"].any,
  idSchema: _propTypes["default"].object,
  onBlur: _propTypes["default"].func,
  onChange: _propTypes["default"].func.isRequired,
  onFocus: _propTypes["default"].func,
  rawErrors: _propTypes["default"].arrayOf(_propTypes["default"].string),
  readonly: _propTypes["default"].bool,
  registry: registry.isRequired,
  required: _propTypes["default"].bool,
  schema: _propTypes["default"].object.isRequired,
  uiSchema: _propTypes["default"].shape({
    "ui:options": _propTypes["default"].shape({
      addable: _propTypes["default"].bool,
      orderable: _propTypes["default"].bool,
      removable: _propTypes["default"].bool
    })
  })
};
exports.fieldProps = fieldProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90eXBlcy5qcyJdLCJuYW1lcyI6WyJyZWdpc3RyeSIsIlByb3BUeXBlcyIsInNoYXBlIiwiQXJyYXlGaWVsZFRlbXBsYXRlIiwiZWxlbWVudFR5cGUiLCJGaWVsZFRlbXBsYXRlIiwiT2JqZWN0RmllbGRUZW1wbGF0ZSIsImRlZmluaXRpb25zIiwib2JqZWN0IiwiaXNSZXF1aXJlZCIsInJvb3RTY2hlbWEiLCJmaWVsZHMiLCJvYmplY3RPZiIsImZvcm1Db250ZXh0Iiwid2lkZ2V0cyIsIm9uZU9mVHlwZSIsImZ1bmMiLCJmaWVsZFByb3BzIiwiYXV0b2ZvY3VzIiwiYm9vbCIsImRpc2FibGVkIiwiZXJyb3JTY2hlbWEiLCJmb3JtRGF0YSIsImFueSIsImlkU2NoZW1hIiwib25CbHVyIiwib25DaGFuZ2UiLCJvbkZvY3VzIiwicmF3RXJyb3JzIiwiYXJyYXlPZiIsInN0cmluZyIsInJlYWRvbmx5IiwicmVxdWlyZWQiLCJzY2hlbWEiLCJ1aVNjaGVtYSIsImFkZGFibGUiLCJvcmRlcmFibGUiLCJyZW1vdmFibGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7OztBQUVPLElBQU1BLFFBQVEsR0FBR0Msc0JBQVVDLEtBQVYsQ0FBZ0I7QUFDdENDLEVBQUFBLGtCQUFrQixFQUFFRixzQkFBVUcsV0FEUTtBQUV0Q0MsRUFBQUEsYUFBYSxFQUFFSixzQkFBVUcsV0FGYTtBQUd0Q0UsRUFBQUEsbUJBQW1CLEVBQUVMLHNCQUFVRyxXQUhPO0FBSXRDRyxFQUFBQSxXQUFXLEVBQUVOLHNCQUFVTyxNQUFWLENBQWlCQyxVQUpRO0FBS3RDQyxFQUFBQSxVQUFVLEVBQUVULHNCQUFVTyxNQUxnQjtBQU10Q0csRUFBQUEsTUFBTSxFQUFFVixzQkFBVVcsUUFBVixDQUFtQlgsc0JBQVVHLFdBQTdCLEVBQTBDSyxVQU5aO0FBT3RDSSxFQUFBQSxXQUFXLEVBQUVaLHNCQUFVTyxNQUFWLENBQWlCQyxVQVBRO0FBUXRDSyxFQUFBQSxPQUFPLEVBQUViLHNCQUFVVyxRQUFWLENBQ1BYLHNCQUFVYyxTQUFWLENBQW9CLENBQUNkLHNCQUFVZSxJQUFYLEVBQWlCZixzQkFBVU8sTUFBM0IsQ0FBcEIsQ0FETyxFQUVQQztBQVZvQyxDQUFoQixDQUFqQjs7O0FBYUEsSUFBTVEsVUFBVSxHQUFHO0FBQ3hCQyxFQUFBQSxTQUFTLEVBQUVqQixzQkFBVWtCLElBREc7QUFFeEJDLEVBQUFBLFFBQVEsRUFBRW5CLHNCQUFVa0IsSUFGSTtBQUd4QkUsRUFBQUEsV0FBVyxFQUFFcEIsc0JBQVVPLE1BSEM7QUFJeEJjLEVBQUFBLFFBQVEsRUFBRXJCLHNCQUFVc0IsR0FKSTtBQUt4QkMsRUFBQUEsUUFBUSxFQUFFdkIsc0JBQVVPLE1BTEk7QUFNeEJpQixFQUFBQSxNQUFNLEVBQUV4QixzQkFBVWUsSUFOTTtBQU94QlUsRUFBQUEsUUFBUSxFQUFFekIsc0JBQVVlLElBQVYsQ0FBZVAsVUFQRDtBQVF4QmtCLEVBQUFBLE9BQU8sRUFBRTFCLHNCQUFVZSxJQVJLO0FBU3hCWSxFQUFBQSxTQUFTLEVBQUUzQixzQkFBVTRCLE9BQVYsQ0FBa0I1QixzQkFBVTZCLE1BQTVCLENBVGE7QUFVeEJDLEVBQUFBLFFBQVEsRUFBRTlCLHNCQUFVa0IsSUFWSTtBQVd4Qm5CLEVBQUFBLFFBQVEsRUFBRUEsUUFBUSxDQUFDUyxVQVhLO0FBWXhCdUIsRUFBQUEsUUFBUSxFQUFFL0Isc0JBQVVrQixJQVpJO0FBYXhCYyxFQUFBQSxNQUFNLEVBQUVoQyxzQkFBVU8sTUFBVixDQUFpQkMsVUFiRDtBQWN4QnlCLEVBQUFBLFFBQVEsRUFBRWpDLHNCQUFVQyxLQUFWLENBQWdCO0FBQ3hCLGtCQUFjRCxzQkFBVUMsS0FBVixDQUFnQjtBQUM1QmlDLE1BQUFBLE9BQU8sRUFBRWxDLHNCQUFVa0IsSUFEUztBQUU1QmlCLE1BQUFBLFNBQVMsRUFBRW5DLHNCQUFVa0IsSUFGTztBQUc1QmtCLE1BQUFBLFNBQVMsRUFBRXBDLHNCQUFVa0I7QUFITyxLQUFoQjtBQURVLEdBQWhCO0FBZGMsQ0FBbkIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUHJvcFR5cGVzIGZyb20gXCJwcm9wLXR5cGVzXCI7XG5cbmV4cG9ydCBjb25zdCByZWdpc3RyeSA9IFByb3BUeXBlcy5zaGFwZSh7XG4gIEFycmF5RmllbGRUZW1wbGF0ZTogUHJvcFR5cGVzLmVsZW1lbnRUeXBlLFxuICBGaWVsZFRlbXBsYXRlOiBQcm9wVHlwZXMuZWxlbWVudFR5cGUsXG4gIE9iamVjdEZpZWxkVGVtcGxhdGU6IFByb3BUeXBlcy5lbGVtZW50VHlwZSxcbiAgZGVmaW5pdGlvbnM6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgcm9vdFNjaGVtYTogUHJvcFR5cGVzLm9iamVjdCxcbiAgZmllbGRzOiBQcm9wVHlwZXMub2JqZWN0T2YoUHJvcFR5cGVzLmVsZW1lbnRUeXBlKS5pc1JlcXVpcmVkLFxuICBmb3JtQ29udGV4dDogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICB3aWRnZXRzOiBQcm9wVHlwZXMub2JqZWN0T2YoXG4gICAgUHJvcFR5cGVzLm9uZU9mVHlwZShbUHJvcFR5cGVzLmZ1bmMsIFByb3BUeXBlcy5vYmplY3RdKVxuICApLmlzUmVxdWlyZWQsXG59KTtcblxuZXhwb3J0IGNvbnN0IGZpZWxkUHJvcHMgPSB7XG4gIGF1dG9mb2N1czogUHJvcFR5cGVzLmJvb2wsXG4gIGRpc2FibGVkOiBQcm9wVHlwZXMuYm9vbCxcbiAgZXJyb3JTY2hlbWE6IFByb3BUeXBlcy5vYmplY3QsXG4gIGZvcm1EYXRhOiBQcm9wVHlwZXMuYW55LFxuICBpZFNjaGVtYTogUHJvcFR5cGVzLm9iamVjdCxcbiAgb25CbHVyOiBQcm9wVHlwZXMuZnVuYyxcbiAgb25DaGFuZ2U6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gIG9uRm9jdXM6IFByb3BUeXBlcy5mdW5jLFxuICByYXdFcnJvcnM6IFByb3BUeXBlcy5hcnJheU9mKFByb3BUeXBlcy5zdHJpbmcpLFxuICByZWFkb25seTogUHJvcFR5cGVzLmJvb2wsXG4gIHJlZ2lzdHJ5OiByZWdpc3RyeS5pc1JlcXVpcmVkLFxuICByZXF1aXJlZDogUHJvcFR5cGVzLmJvb2wsXG4gIHNjaGVtYTogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICB1aVNjaGVtYTogUHJvcFR5cGVzLnNoYXBlKHtcbiAgICBcInVpOm9wdGlvbnNcIjogUHJvcFR5cGVzLnNoYXBlKHtcbiAgICAgIGFkZGFibGU6IFByb3BUeXBlcy5ib29sLFxuICAgICAgb3JkZXJhYmxlOiBQcm9wVHlwZXMuYm9vbCxcbiAgICAgIHJlbW92YWJsZTogUHJvcFR5cGVzLmJvb2wsXG4gICAgfSksXG4gIH0pLFxufTtcbiJdfQ==