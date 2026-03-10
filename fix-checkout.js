const fs = require('fs');
let code = fs.readFileSync('tmp_old_checkout.tsx', 'utf8');

// 1. replace subtotal and deliveryFee logic
code = code.replace(
    "const subtotal = calculateCartTotal(cartItems)\n  const deliveryFee = customerInfo.deliveryType === 'delivery' ? config.business.defaultDeliveryFee : 0\n  const totalPrice = subtotal + deliveryFee",
    "const subtotal = calculateCartTotal(cartItems)\n  const deliveryFee = 0\n  const totalPrice = subtotal + deliveryFee"
);

// 2. address validation logic inside handleSubmitOrder
code = code.replace(
    "// Validate address if delivery\n    let addressValidation: { valid: boolean; sanitized: string; error?: string } = { valid: true, sanitized: customerInfo.deliveryAddress || '' }\n    if (customerInfo.deliveryType === 'delivery') {\n      addressValidation = validateAndSanitizeAddress(customerInfo.deliveryAddress || '', true)\n    }",
    "// Address validation no longer needed for pickup only"
);

// 3. Check if all validations pass
code = code.replace(
    "if (!nameValidation.valid || !phoneValidation.valid || !roomValidation.valid || !addressValidation.valid || !instructionsValidation.valid) {\n      const errors = [\n        nameValidation.error,\n        phoneValidation.error,\n        roomValidation.error,\n        addressValidation.error,\n        instructionsValidation.error\n      ].filter((error): error is string => Boolean(error))",
    "if (!nameValidation.valid || !phoneValidation.valid || !roomValidation.valid || !instructionsValidation.valid) {\n      const errors = [\n        nameValidation.error,\n        phoneValidation.error,\n        roomValidation.error,\n        instructionsValidation.error\n      ].filter((error): error is string => Boolean(error))"
);

// 4. Create sanitized customer info
code = code.replace(
    "phoneNumber: phoneValidation.sanitized,\n      roomNumber: roomValidation.sanitized,\n      deliveryType: customerInfo.deliveryType,\n      deliveryAddress: addressValidation.sanitized || undefined,\n      instructions: instructionsValidation.sanitized || undefined",
    "phoneNumber: phoneValidation.sanitized,\n      roomNumber: roomValidation.sanitized,\n      deliveryType: 'pickup',\n      deliveryAddress: undefined,\n      instructions: instructionsValidation.sanitized || undefined"
);

// 5. Java Spring Boot backend payload
code = code.replace(
    "customerRoom: sanitizedCustomerInfo.roomNumber,\n            customerResidence: sanitizedCustomerInfo.deliveryAddress || 'Pickup',\n            items: safeJsonStringify(cartItems),",
    "customerRoom: sanitizedCustomerInfo.roomNumber,\n            customerResidence: 'Pickup',\n            items: safeJsonStringify(cartItems),"
);

// 6. isFormValid
code = code.replace(
    "const isFormValid = customerInfo.name.trim() &&\n    customerInfo.roomNumber.trim() &&\n    customerInfo.phoneNumber.trim() &&\n    (customerInfo.deliveryType === 'pickup' || (customerInfo.deliveryAddress && customerInfo.deliveryAddress.trim()))",
    "const isFormValid = customerInfo.name.trim() &&\n    customerInfo.roomNumber.trim() &&\n    customerInfo.phoneNumber.trim()"
);

// 7. Order Details UI - Type Location
code = code.replace(
    "<Icon name={customerInfo.deliveryType === 'delivery' ? 'package' : 'location'} size={16} />\n                      {customerInfo.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}",
    "<Icon name=\"location\" size={16} />\n                      Pickup"
);

// 8. Order Details UI - Contact
code = code.replace(
    "It will be ready soon! We'll contact you when it's ready for {customerInfo.deliveryType === 'delivery' ? 'delivery' : 'pickup'}.",
    "It will be ready soon! We'll contact you when it's ready for pickup."
);

// 9. Customer Information Form - UI removal
// We want to remove the Delivery Options radio buttons and Delivery Address input.
const deliveryUiStart = "{/* Delivery Options */}";
const deliveryUiEnd = "{/* Order Instructions */}";
const startIndex = code.indexOf(deliveryUiStart);
const endIndex = code.indexOf(deliveryUiEnd);
if (startIndex !== -1 && endIndex !== -1) {
    code = code.substring(0, startIndex) + code.substring(endIndex);
}

// 10. Order Summary - Delivery Fee
const feeStartIndex = code.indexOf("{deliveryFee > 0 && (");
const feeEndIndex = code.indexOf(")}\n                  <div className=\"flex justify-between items-center text-xl font-bold border-t border-gray-100 pt-3\">");
if (feeStartIndex !== -1 && feeEndIndex !== -1) {
    // we add back the <div> line so we don't accidentally remove it
    code = code.substring(0, feeStartIndex) + "                  <div className=\"flex justify-between items-center text-xl font-bold border-t border-gray-100 pt-3\">" + code.substring(feeEndIndex + 120);
}

fs.writeFileSync('src/app/checkout/page.tsx', code);
console.log("Successfully rebuilt src/app/checkout/page.tsx");
