import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Sign in — INFITRA",
};

export default function LoginPage() {
  // LoginForm reads URL search params (intent, returnTo) via
  // useSearchParams — that requires a Suspense boundary at the
  // nearest server-component ancestor, otherwise Next opts the
  // whole page out of static rendering.
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
