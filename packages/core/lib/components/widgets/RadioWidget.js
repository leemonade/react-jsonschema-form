import React from "react";
import PropTypes from "prop-types";

function RadioWidget(props) {
  var options = props.options,
      value = props.value,
      required = props.required,
      disabled = props.disabled,
      readonly = props.readonly,
      autofocus = props.autofocus,
      onBlur = props.onBlur,
      onFocus = props.onFocus,
      _onChange = props.onChange,
      id = props.id; // Generating a unique field name to identify this set of radio buttons

  var name = Math.random().toString();
  var enumOptions = options.enumOptions,
      enumDisabled = options.enumDisabled,
      inline = options.inline; // checked={checked} has been moved above name={name}, As mentioned in #349;
  // this is a temporary fix for radio button rendering bug in React, facebook/react#7630.

  return React.createElement("div", {
    className: "field-radio-group",
    id: id
  }, enumOptions.map(function (option, i) {
    var checked = option.value === value;
    var itemDisabled = enumDisabled && enumDisabled.indexOf(option.value) != -1;
    var disabledCls = disabled || itemDisabled || readonly ? "disabled" : "";
    var radio = React.createElement("span", null, React.createElement("input", {
      type: "radio",
      checked: checked,
      name: name,
      required: required,
      value: option.value,
      disabled: disabled || itemDisabled || readonly,
      autoFocus: autofocus && i === 0,
      onChange: function onChange(_) {
        return _onChange(option.value);
      },
      onBlur: onBlur && function (event) {
        return onBlur(id, event.target.value);
      },
      onFocus: onFocus && function (event) {
        return onFocus(id, event.target.value);
      }
    }), React.createElement("span", null, option.label));
    return inline ? React.createElement("label", {
      key: i,
      className: "radio-inline ".concat(disabledCls)
    }, radio) : React.createElement("div", {
      key: i,
      className: "radio ".concat(disabledCls)
    }, React.createElement("label", null, radio));
  }));
}

RadioWidget.defaultProps = {
  autofocus: false
};

if (process.env.NODE_ENV !== "production") {
  RadioWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    options: PropTypes.shape({
      enumOptions: PropTypes.array,
      inline: PropTypes.bool
    }).isRequired,
    value: PropTypes.any,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    autofocus: PropTypes.bool,
    onChange: PropTypes.func
  };
}

export default RadioWidget;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21wb25lbnRzL3dpZGdldHMvUmFkaW9XaWRnZXQuanMiXSwibmFtZXMiOlsiUmVhY3QiLCJQcm9wVHlwZXMiLCJSYWRpb1dpZGdldCIsInByb3BzIiwib3B0aW9ucyIsInZhbHVlIiwicmVxdWlyZWQiLCJkaXNhYmxlZCIsInJlYWRvbmx5IiwiYXV0b2ZvY3VzIiwib25CbHVyIiwib25Gb2N1cyIsIm9uQ2hhbmdlIiwiaWQiLCJuYW1lIiwiTWF0aCIsInJhbmRvbSIsInRvU3RyaW5nIiwiZW51bU9wdGlvbnMiLCJlbnVtRGlzYWJsZWQiLCJpbmxpbmUiLCJtYXAiLCJvcHRpb24iLCJpIiwiY2hlY2tlZCIsIml0ZW1EaXNhYmxlZCIsImluZGV4T2YiLCJkaXNhYmxlZENscyIsInJhZGlvIiwiXyIsImV2ZW50IiwidGFyZ2V0IiwibGFiZWwiLCJkZWZhdWx0UHJvcHMiLCJwcm9jZXNzIiwiZW52IiwiTk9ERV9FTlYiLCJwcm9wVHlwZXMiLCJzY2hlbWEiLCJvYmplY3QiLCJpc1JlcXVpcmVkIiwic3RyaW5nIiwic2hhcGUiLCJhcnJheSIsImJvb2wiLCJhbnkiLCJmdW5jIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPQSxLQUFQLE1BQWtCLE9BQWxCO0FBQ0EsT0FBT0MsU0FBUCxNQUFzQixZQUF0Qjs7QUFFQSxTQUFTQyxXQUFULENBQXFCQyxLQUFyQixFQUE0QjtBQUFBLE1BRXhCQyxPQUZ3QixHQVl0QkQsS0Fac0IsQ0FFeEJDLE9BRndCO0FBQUEsTUFHeEJDLEtBSHdCLEdBWXRCRixLQVpzQixDQUd4QkUsS0FId0I7QUFBQSxNQUl4QkMsUUFKd0IsR0FZdEJILEtBWnNCLENBSXhCRyxRQUp3QjtBQUFBLE1BS3hCQyxRQUx3QixHQVl0QkosS0Fac0IsQ0FLeEJJLFFBTHdCO0FBQUEsTUFNeEJDLFFBTndCLEdBWXRCTCxLQVpzQixDQU14QkssUUFOd0I7QUFBQSxNQU94QkMsU0FQd0IsR0FZdEJOLEtBWnNCLENBT3hCTSxTQVB3QjtB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QUFFdEIzQixJQUFBQSxFQUFFLEVBQUVaLFNBQVMsQ0FBQ3dDLE1BQVYsQ0FBaUJELFVBRkM7QUFHdEJwQyxJQUFBQSxPQUFPLEVBQUVILFNBQVMsQ0FBQ3lDLEtBQVYsQ0FBZ0I7QUFDdkJ4QixNQUFBQSxXQUFXLEVBQUVqQixTQUFTLENBQUMwQyxLQURBO0FBRXZCdkIsTUFBQUEsTUFBTSxFQUFFbkIsU0FBUyxDQUFDMkM7QUFGSyxLQUFoQixFQUdOSixVQU5tQjtBQU90Qm5DLElBQUFBLEtBQUssRUFBRUosU0FBUyxDQUFDNEMsR0FQSztBQVF0QnZDLElBQUFBLFFBQVEsRUFBRUwsU0FBUyxDQUFDMkMsSUFSRTtBQVN0QnJDLElBQUFBLFFBQVEsRUFBRU4sU0FBUyxDQUFDMkMsSUFURTtBQVV0QnBDLElBQUFBLFFBQVEsRUFBRVAsU0FBUyxDQUFDMkMsSUFWRTtBQVd0Qm5DLElBQUFBLFNBQVMsRUFBRVIsU0FBUyxDQUFDMkMsSUFYQztBQVl0QmhDLElBQUFBLFFBQVEsRUFBRVgsU0FBUyxDQUFDNkM7QUFaRSxHQUF4QjtBQWNEOztBQUNELGVBQWU1QyxXQUFmIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tIFwicHJvcC10eXBlc1wiO1xuXG5mdW5jdGlvbiBSYWRpb1dpZGdldChwcm9wcykge1xuICBjb25zdCB7XG4gICAgb3B0aW9ucyxcbiAgICB2YWx1ZSxcbiAgICByZXF1aXJlZCxcbiAgICBkaXNhYmxlZCxcbiAgICByZWFkb25seSxcbiAgICBhdXRvZm9jdXMsXG4gICAgb25CbHVyLFxuICAgIG9uRm9jdXMsXG4gICAgb25DaGFuZ2UsXG4gICAgaWQsXG4gIH0gPSBwcm9wcztcbiAgLy8gR2VuZXJhdGluZyBhIHVuaXF1ZSBmaWVsZCBuYW1lIHRvIGlkZW50aWZ5IHRoaXMgc2V0IG9mIHJhZGlvIGJ1dHRvbnNcbiAgY29uc3QgbmFtZSA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoKTtcbiAgY29uc3QgeyBlbnVtT3B0aW9ucywgZW51bURpc2FibGVkLCBpbmxpbmUgfSA9IG9wdGlvbnM7XG4gIC8vIGNoZWNrZWQ9e2NoZWNrZWR9IGhhcyBiZWVuIG1vdmVkIGFib3ZlIG5hbWU9e25hbWV9LCBBcyBtZW50aW9uZWQgaW4gIzM0OTtcbiAgLy8gdGhpcyBpcyBhIHRlbXBvcmFyeSBmaXggZm9yIHJhZGlvIGJ1dHRvbiByZW5kZXJpbmcgYnVnIGluIFJlYWN0LCBmYWNlYm9vay9yZWFjdCM3NjMwLlxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiZmllbGQtcmFkaW8tZ3JvdXBcIiBpZD17aWR9PlxuICAgICAge2VudW1PcHRpb25zLm1hcCgob3B0aW9uLCBpKSA9PiB7XG4gICAgICAgIGNvbnN0IGNoZWNrZWQgPSBvcHRpb24udmFsdWUgPT09IHZhbHVlO1xuICAgICAgICBjb25zdCBpdGVtRGlzYWJsZWQgPVxuICAgICAgICAgIGVudW1EaXNhYmxlZCAmJiBlbnVtRGlzYWJsZWQuaW5kZXhPZihvcHRpb24udmFsdWUpICE9IC0xO1xuICAgICAgICBjb25zdCBkaXNhYmxlZENscyA9XG4gICAgICAgICAgZGlzYWJsZWQgfHwgaXRlbURpc2FibGVkIHx8IHJlYWRvbmx5ID8gXCJkaXNhYmxlZFwiIDogXCJcIjtcbiAgICAgICAgY29uc3QgcmFkaW8gPSAoXG4gICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgdHlwZT1cInJhZGlvXCJcbiAgICAgICAgICAgICAgY2hlY2tlZD17Y2hlY2tlZH1cbiAgICAgICAgICAgICAgbmFtZT17bmFtZX1cbiAgICAgICAgICAgICAgcmVxdWlyZWQ9e3JlcXVpcmVkfVxuICAgICAgICAgICAgICB2YWx1ZT17b3B0aW9uLnZhbHVlfVxuICAgICAgICAgICAgICBkaXNhYmxlZD17ZGlzYWJsZWQgfHwgaXRlbURpc2FibGVkIHx8IHJlYWRvbmx5fVxuICAgICAgICAgICAgICBhdXRvRm9jdXM9e2F1dG9mb2N1cyAmJiBpID09PSAwfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17XyA9PiBvbkNoYW5nZShvcHRpb24udmFsdWUpfVxuICAgICAgICAgICAgICBvbkJsdXI9e29uQmx1ciAmJiAoZXZlbnQgPT4gb25CbHVyKGlkLCBldmVudC50YXJnZXQudmFsdWUpKX1cbiAgICAgICAgICAgICAgb25Gb2N1cz17b25Gb2N1cyAmJiAoZXZlbnQgPT4gb25Gb2N1cyhpZCwgZXZlbnQudGFyZ2V0LnZhbHVlKSl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPHNwYW4+e29wdGlvbi5sYWJlbH08L3NwYW4+XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiBpbmxpbmUgPyAoXG4gICAgICAgICAgPGxhYmVsIGtleT17aX0gY2xhc3NOYW1lPXtgcmFkaW8taW5saW5lICR7ZGlzYWJsZWRDbHN9YH0+XG4gICAgICAgICAgICB7cmFkaW99XG4gICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8ZGl2IGtleT17aX0gY2xhc3NOYW1lPXtgcmFkaW8gJHtkaXNhYmxlZENsc31gfT5cbiAgICAgICAgICAgIDxsYWJlbD57cmFkaW99PC9sYWJlbD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcbiAgICAgIH0pfVxuICAgIDwvZGl2PlxuICApO1xufVxuXG5SYWRpb1dpZGdldC5kZWZhdWx0UHJvcHMgPSB7XG4gIGF1dG9mb2N1czogZmFsc2UsXG59O1xuXG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB7XG4gIFJhZGlvV2lkZ2V0LnByb3BUeXBlcyA9IHtcbiAgICBzY2hlbWE6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICBpZDogUHJvcFR5cGVzLnN0cmluZy5pc1JlcXVpcmVkLFxuICAgIG9wdGlvbnM6IFByb3BUeXBlcy5zaGFwZSh7XG4gICAgICBlbnVtT3B0aW9uczogUHJvcFR5cGVzLmFycmF5LFxuICAgICAgaW5saW5lOiBQcm9wVHlwZXMuYm9vbCxcbiAgICB9KS5pc1JlcXVpcmVkLFxuICAgIHZhbHVlOiBQcm9wVHlwZXMuYW55LFxuICAgIHJlcXVpcmVkOiBQcm9wVHlwZXMuYm9vbCxcbiAgICBkaXNhYmxlZDogUHJvcFR5cGVzLmJvb2wsXG4gICAgcmVhZG9ubHk6IFByb3BUeXBlcy5ib29sLFxuICAgIGF1dG9mb2N1czogUHJvcFR5cGVzLmJvb2wsXG4gICAgb25DaGFuZ2U6IFByb3BUeXBlcy5mdW5jLFxuICB9O1xufVxuZXhwb3J0IGRlZmF1bHQgUmFkaW9XaWRnZXQ7XG4iXX0=