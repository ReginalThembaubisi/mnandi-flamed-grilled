"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { orderAPI } from "@/lib/javaAPI";
import { CartItem, CustomerInfo } from "@/types";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/IconMap";
import {
  formatPrice,
  calculateCartTotal,
  generateOrderNumber,
} from "@/lib/utils";
import { config } from "@/lib/config";
import { motion } from "framer-motion";
import {
  validateAndSanitizeName,
  validateAndSanitizePhone,
  validateAndSanitizeRoomNumber,
  validateAndSanitizeAddress,
  validateAndSanitizeInstructions,
  safeJsonParse,
  safeJsonStringify,
} from "@/lib/security";

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    roomNumber: "",
    phoneNumber: "",
    deliveryType: "pickup",
    deliveryAddress: "",
    instructions: "",
  });
  const [loading, setLoading] = useState(true);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    try {
      const cart = safeJsonParse<CartItem[]>(
        localStorage.getItem("cart") || "[]",
        [],
      );
      setCartItems(cart);

      // Load saved customer info if available
      const savedInfo = localStorage.getItem("customerInfo");
      if (savedInfo) {
        const parsed = safeJsonParse<CustomerInfo>(savedInfo, {
          name: "",
          roomNumber: "",
          phoneNumber: "",
          deliveryType: "pickup",
          deliveryAddress: "",
          instructions: "",
        });
        setCustomerInfo(parsed);
      }
    } catch (err) {
      console.error("Error loading cart:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    // Sanitize input based on field type
    let sanitizedValue = value;

    if (field === "name") {
      const validation = validateAndSanitizeName(value);
      sanitizedValue = validation.sanitized;
    } else if (field === "phoneNumber") {
      // Allow typing, validate on submit
      sanitizedValue = value.replace(/[^\d\s\+\-\(\)]/g, "");
    } else if (field === "roomNumber") {
      const validation = validateAndSanitizeRoomNumber(value);
      sanitizedValue = validation.sanitized;
    } else if (field === "deliveryAddress") {
      // Allow more characters for addresses
      sanitizedValue = value.substring(0, 200);
    } else if (field === "instructions") {
      sanitizedValue = value.substring(0, 500);
    }

    setCustomerInfo((prev) => ({
      ...prev,
      [field]: sanitizedValue,
    }));
  };

  const subtotal = calculateCartTotal(cartItems);
  const deliveryFee = 0;
  const totalPrice = subtotal + deliveryFee;

  const handleSubmitOrder = async () => {
    // Validate all inputs
    const nameValidation = validateAndSanitizeName(customerInfo.name);
    const phoneValidation = validateAndSanitizePhone(customerInfo.phoneNumber);
    const roomValidation = validateAndSanitizeRoomNumber(
      customerInfo.roomNumber,
    );

    // Address validation no longer needed for pickup only

    // Validate instructions
    const instructionsValidation = validateAndSanitizeInstructions(
      customerInfo.instructions || "",
    );

    // Check if all validations pass
    if (
      !nameValidation.valid ||
      !phoneValidation.valid ||
      !roomValidation.valid ||
      !instructionsValidation.valid
    ) {
      const errors = [
        nameValidation.error,
        phoneValidation.error,
        roomValidation.error,
        instructionsValidation.error,
      ].filter((error): error is string => Boolean(error));

      alert(`Please fix the following errors:\n${errors.join("\n")}`);
      return;
    }

    // Create sanitized customer info
    const sanitizedCustomerInfo: CustomerInfo = {
      name: nameValidation.sanitized,
      phoneNumber: phoneValidation.sanitized,
      roomNumber: roomValidation.sanitized,
      deliveryType: "pickup",
      deliveryAddress: undefined,
      instructions: instructionsValidation.sanitized || undefined,
    };

    // Save customer info for future orders
    localStorage.setItem(
      "customerInfo",
      safeJsonStringify(sanitizedCustomerInfo),
    );

    // Generate client-side reference while creating order
    const newOrderNumber = generateOrderNumber(config.order.confirmationPrefix);
    setOrderNumber(newOrderNumber);

    try {
      const orderData = {
        customerName: sanitizedCustomerInfo.name,
        customerPhone: sanitizedCustomerInfo.phoneNumber,
        customerRoom: sanitizedCustomerInfo.roomNumber,
        customerResidence: "Pickup",
        items: safeJsonStringify(cartItems),
        total: totalPrice,
        notes: sanitizedCustomerInfo.instructions || "",
      };

      const createdOrder = await orderAPI.create(orderData);
      setOrderNumber(createdOrder.confirmationNumber);

      // Online payment is temporarily disabled for production stability.
      // Keep order placement flow active and show confirmation immediately.
      localStorage.removeItem("cart");
      setOrderSubmitted(true);
    } catch (e) {
      console.error("Failed to create order in backend:", e);
      alert("We could not place your order right now. Please try again.");
    }
  };

  const isFormValid =
    customerInfo.name.trim() &&
    customerInfo.roomNumber.trim() &&
    customerInfo.phoneNumber.trim();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (cartItems.length === 0 && !orderSubmitted) {
    return (
      <div className="min-h-screen bg-orange-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-500 mb-6">
              Add some delicious items to your cart first!
            </p>
            <Link
              href="/menu"
              className="bg-orange-500 text-white px-8 py-3 rounded-full hover:bg-orange-600 transition-colors inline-flex items-center space-x-2 font-bold shadow-lg shadow-orange-200"
            >
              <span>🍽️</span>
              <span>Browse Menu</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (orderSubmitted) {
    return (
      <div className="min-h-screen bg-orange-50">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white border border-orange-100 rounded-2xl shadow-lg p-8 sm:p-12 text-center">
              <div className="w-24 h-24 bg-green-100 border-2 border-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="check" size={48} className="text-green-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Order Confirmed!
              </h1>
              <p className="text-gray-500 mb-8 text-lg">
                Thank you,{" "}
                <strong className="text-gray-900">{customerInfo.name}</strong>!
                Your order has been received.
              </p>

              <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Icon name="orders" size={20} className="text-orange-500" />
                  <h3 className="font-bold text-orange-700">
                    Order Confirmation Number
                  </h3>
                </div>
                <p className="text-3xl font-bold text-orange-600 mb-2">
                  {(safeJsonParse(
                    localStorage.getItem("orders") || "[]",
                    [],
                  ) as any[]).slice(-1)[0]?.confirmationNumber || "SHI-000000"}
                </p>
                <p className="text-sm text-orange-600/80">Save this number for reference!</p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6 text-left">
                <h3 className="font-bold text-gray-900 mb-4">Order Details</h3>
                <div className="space-y-2 text-gray-500">
                  <div className="flex justify-between">
                    <span>Room:</span>
                    <span className="text-gray-900 font-semibold">
                      {customerInfo.roomNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span className="text-gray-900 font-semibold">
                      {customerInfo.phoneNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="text-gray-900 font-semibold flex items-center gap-2">
                      <Icon name="location" size={16} />
                      Pickup
                    </span>
                  </div>
                  {customerInfo.instructions && (
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span>Instructions:</span>
                      <span className="text-gray-900 font-semibold text-right max-w-[60%]">
                        {customerInfo.instructions}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span>Total:</span>
                    <span className="text-orange-500 font-bold text-xl">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-500 mb-8">
                It will be ready soon! We'll contact you when it's ready for pickup.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-8 text-left">
                <div className="flex items-start gap-3">
                  <Icon
                    name="warning"
                    size={20}
                    className="text-red-500 mt-1 flex-shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-red-600 mb-1">
                      Need to Cancel?
                    </h4>
                    <p className="text-sm text-red-500/90">
                      You can cancel your order anytime before we start cooking.
                      Please call us with your confirmation number:{" "}
                      <strong>{orderNumber}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/menu"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2 hover:scale-105"
                >
                  <Icon name="menu" size={20} />
                  <span>Order More</span>
                </Link>
                <Link
                  href="/"
                  className="bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 px-8 py-4 rounded-full font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Icon name="home" size={20} />
                  <span>Home</span>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Hero Header */}
      <div className="relative bg-white border-b border-orange-100 shadow-sm">
        {/* Subtle warm pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(180 60 0) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        ></div>

        <div className="relative container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <Link
                href="/cart"
                className="text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-2 mb-4 font-medium"
              >
                <Icon name="arrow-left" size={20} />
                <span>Back to Cart</span>
              </Link>
              <h1 className="text-5xl sm:text-6xl font-bold text-orange-600 font-display tracking-tight">
                CHECKOUT
              </h1>
              <p className="text-gray-500 mt-3">Complete your order details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Customer Information Form */}
            <div className="bg-white border border-orange-100 rounded-2xl shadow-md p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <Icon name="user" size={24} className="text-orange-500" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Customer Information
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Themba Ubisi"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.roomNumber}
                    onChange={(e) =>
                      handleInputChange("roomNumber", e.target.value)
                    }
                    placeholder="e.g., F09-7"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phoneNumber}
                    onChange={(e) =>
                      handleInputChange("phoneNumber", e.target.value)
                    }
                    placeholder="e.g., 082 123 4567"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Order Instructions */}
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Icon name="edit" size={16} />
                  Special Instructions (Optional)
                </label>
                <textarea
                  value={customerInfo.instructions || ""}
                  onChange={(e) =>
                    handleInputChange("instructions", e.target.value)
                  }
                  placeholder="How do you want your meat? (e.g., 'Normal', 'Mild', 'Hot', 'Extra hot', 'Call when ready')"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 h-24 resize-none transition-all"
                />
                <p className="text-xs text-gray-400 mt-2">
                  We'll do our best to accommodate your requests!
                </p>
              </div>

              <div className="mt-8 space-y-4">
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Icon
                      name="notification"
                      size={20}
                      className="text-orange-500 mt-0.5 flex-shrink-0"
                    />
                    <p className="text-sm text-orange-700">
                      <strong>Note:</strong> This information will be saved for
                      future orders to make checkout faster!
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Icon
                      name="warning"
                      size={20}
                      className="text-yellow-600 mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-yellow-700 mb-2">
                        Cancellation Policy
                      </h4>
                      <ul className="text-sm text-yellow-700 space-y-1.5">
                        <li className="flex items-start gap-2">
                          <span>•</span>
                          <span>
                            You can cancel your order before we start cooking
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>•</span>
                          <span>
                            Call us to cancel anytime before cooking starts
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>•</span>
                          <span>
                            Once cooking starts, cancellation is not possible
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>•</span>
                          <span>We'll contact you if there are any issues</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 bg-white border border-orange-100 rounded-2xl shadow-md p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Icon name="orders" size={24} className="text-orange-500" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Order Summary
                  </h2>
                </div>

                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 bg-orange-50 border border-orange-100 rounded-xl"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Icon
                            name="menu"
                            size={24}
                            className="text-orange-300"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {item.name}
                        </h3>
                        {item.isCombo && item.selectedSide && (
                          <div className="flex items-center gap-1 text-sm text-orange-600">
                            <Icon name="check" size={14} />
                            <span>Side: {item.selectedSide}</span>
                          </div>
                        )}
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-orange-500">
                          {formatPrice(parseFloat(item.price) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-6 space-y-3">
                  <div className="flex justify-between items-center text-gray-500">
                    <span>Subtotal:</span>
                    <span className="text-gray-900 font-semibold">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xl font-bold border-t border-gray-100 pt-3">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-orange-500 text-2xl">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleSubmitOrder}
                  disabled={!isFormValid}
                  variant="primary"
                  size="lg"
                  className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-lg shadow-orange-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFormValid ? (
                    <span className="flex items-center justify-center gap-2">
                      <Icon name="check" size={20} />
                      Place Order
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Icon name="warning" size={20} />
                      Complete Form First
                    </span>
                  )}
                </Button>

                {!isFormValid && (
                  <p className="text-sm text-red-500 mt-3 text-center">
                    Please fill in all required fields
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
