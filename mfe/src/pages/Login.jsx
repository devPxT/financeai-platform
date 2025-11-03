import React, { useEffect } from "react";
import { useAuth, SignInButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button.jsx";
import { LogIn } from "lucide-react";

export default function Login() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/home", { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="grid md:grid-cols-2 min-h-screen bg-[#0B0B0D]">
      {/* ESQUERDA */}
      <div className="mx-auto flex h-full w-full max-w-[550px] flex-col justify-center align-items-center p-8">
        <img
          src="/images/logo.svg"
          width={173}
          height={39}
          alt="Finance AI"
          className="mb-8"
        />
        <h1 className="mb-3 text-4xl font-bold text-white">Bem-vindo</h1>
        <p className="mb-8 text-white">
          A Finance AI é uma plataforma de gestão financeira que utiliza IA para
          monitorar suas movimentações e oferecer insights personalizados,
          facilitando o controle do seu orçamento.
        </p>
        <SignInButton mode="modal" redirectUrl="/home">
          <Button variant="outline">
            <LogIn className="mr-2 h-4 w-4" />
            Fazer login ou criar conta
          </Button>
        </SignInButton>
      </div>

      {/* DIREITA (imagem) */}
      <div className="relative hidden h-full w-full md:block">
        <img
          src="/images/login.png"
          alt="Faça login"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}