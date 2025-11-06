import React, { forwardRef } from "react";
import { NumericFormat } from "react-number-format";
import { Input } from "@/components/ui/input";

export const MoneyInput = forwardRef(function MoneyInput(props, ref) {
  return (
    <NumericFormat
      {...props}
      thousandSeparator="."
      decimalSeparator=","
      prefix="R$ "
      allowNegative={false}
      customInput={Input}
      getInputRef={ref}
    />
  );
});