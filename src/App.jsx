import { BrowserRouter, Routes, Route } from "react-router-dom";
import OrdersList from "./pages/OrdersList";
import CreateOrder from "./pages/CreateOrder";
import OrderDetails from "./pages/OrderDetails";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OrdersList />} />
        <Route path="/create" element={<CreateOrder />} />
        <Route path="/order/:id" element={<OrderDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
