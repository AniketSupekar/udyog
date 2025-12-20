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
    <form onSubmit={handleSubmit}>
      <h2>Create Order</h2>

      <input name="name" placeholder="Name" onChange={handleChange} required />
      <input name="phone" placeholder="Phone" onChange={handleChange} required />
      <input name="address" placeholder="Address" onChange={handleChange} required />

      <input type="date" name="orderDate" onChange={handleChange} required />
      <input type="date" name="deliveryDate" onChange={handleChange} required />

      <input name="quantity" placeholder="Quantity" onChange={handleChange} required />
      <input name="rate" placeholder="Rate" onChange={handleChange} required />
      <input name="advancePaid" placeholder="Advance" onChange={handleChange} />

      <button type="submit">Save Order</button>
    </form>
  );
}
