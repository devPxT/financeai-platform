import React from "react";
import { useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();

  if (!isLoaded) return null; // ou um spinner

  if (!isSignedIn) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}