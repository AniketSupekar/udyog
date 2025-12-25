import { useState } from "react";
import { createOrder } from "../services/order.api";
import { useNavigate } from "react-router-dom";

export default function OrderForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    orderDate: "",
    deliveryDate: "",
    quantity: "",
    rate: "",
    advancePaid: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      customer: {
        name: form.name,
        phone: form.phone,
        address: form.address
      },
      orderDate: form.orderDate,
      deliveryDate: form.deliveryDate,
      quantity: Number(form.quantity),
      rate: Number(form.rate),
      advancePaid: Number(form.advancePaid || 0)
    };

    await createOrder(payload);
    navigate("/");
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm p-6 space-y-6"
      >
        <h2 className="text-xl font-semibold text-gray-800">
          Create Order
        </h2>

        {/* ================= CUSTOMER DETAILS ================= */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-600">
            Customer Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="name"
              placeholder="Customer Name"
              onChange={handleChange}
              required
              className="input"
            />

            <input
              name="phone"
              placeholder="Phone Number"
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <input
            name="address"
            placeholder="Address"
            onChange={handleChange}
            required
            className="input"
          />
        </div>

        {/* ================= ORDER DETAILS ================= */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-600">
            Order Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="date"
              name="orderDate"
              onChange={handleChange}
              required
              className="input"
            />

            <input
              type="date"
              name="deliveryDate"
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              name="quantity"
              placeholder="Quantity"
              onChange={handleChange}
              required
              className="input"
            />

            <input
              name="rate"
              placeholder="Rate"
              onChange={handleChange}
              required
              className="input"
            />

            <input
              name="advancePaid"
              placeholder="Advance Paid"
              onChange={handleChange}
              className="input"
            />
          </div>
        </div>

        {/* ================= ACTION BAR ================= */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-5 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            Save Order
          </button>
        </div>
      </form>
    </div>
  );
}