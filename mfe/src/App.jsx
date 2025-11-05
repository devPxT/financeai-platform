import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Transactions from "./components/Transactions.jsx";
import MyPlan from "./components/MyPlan.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import Subscription from "./pages/Subscription.jsx"; // NOVO

export default function App() {
  return (
    <Routes>
      {/* "/" é a página de Login */}
      <Route path="/" element={<Login />} />

      {/* Rotas autenticadas com Navbar */}
      <Route
        element={
          <ProtectedRoute>
            <AuthLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<Home />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/subscription" element={<Subscription />} /> {/* trocado */}
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}