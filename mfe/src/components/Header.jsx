// src/components/Header.jsx
import React from "react";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";

export default function Header() {
  return (
    <header className="header card">
      <div>
        <h2>FinanceAI</h2>
        <div className="small">Dashboard financeiro — integrado com BFF</div>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">Entrar</SignInButton>
        </SignedOut>
      </div>
    </header>
  );
}
