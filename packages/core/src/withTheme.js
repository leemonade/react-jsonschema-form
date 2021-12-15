import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import Form from "./";

function withTheme(themeProps) {
  return forwardRef(({ fields, widgets, ...directProps }, ref) => {
    fields = { ...themeProps.fields, ...fields };
    widgets = { ...themeProps.widgets, ...widgets };

    const formData = themeProps.formData ? themeProps.formData : directProps.formData;

    return (
      <Form
        {...themeProps}
        {...directProps}
        formData={formData}
        fields={fields}
        widgets={widgets}
        ref={ref}
      />
    );
  });
}

withTheme.propTypes = {
  widgets: PropTypes.object,
  fields: PropTypes.object,
};

export default withTheme;
