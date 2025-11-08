import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
// import Transactions from "./components/Transactions.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import TransactionsPage from "@/pages/Transactions";
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
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/subscription" element={<Subscription />} /> {/* trocado */}
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}