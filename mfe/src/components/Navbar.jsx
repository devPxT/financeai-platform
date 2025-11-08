import React from "react";
import { Link, useLocation } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";

export default function Navbar() {
  const location = useLocation();
  const pathname = location.pathname;

  const linkClass = (path) =>
    pathname === path ? "font-bold text-white" : "text-gray-500";

  return (
    <nav className="flex justify-between border-b border-b-gray-800 px-8 py-4">
      {/* ESQUERDA */}
      <div className="flex items-center gap-10">
        <Link to="/home" className="flex items-center">
          <img src="/images/logo.svg" width={173} height={39} alt="Finance AI" />
        </Link>
        <Link to="/dashboard" className={linkClass("/dashboard")}>
          Dashboard
        </Link>
        <Link to="/transactions" className={linkClass("/transactions")}>
          Transações
        </Link>
        <Link to="/subscription" className={linkClass("/subscription")}>
          Assinatura
        </Link>
      </div>
      {/* DIREITA */}
      <UserButton showName />
    </nav>
  );
}