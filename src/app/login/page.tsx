"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Flower2 } from "lucide-react";

const loginSchema = z.object({
  login: z.string().min(1, "Введите логин"),
  password: z.string().min(1, "Введите пароль"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      login: data.login,
      password: data.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Неверный логин или пароль");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <div className="glass-card p-8">
          {/* Логотип/заголовок */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Flower2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Maket Decor
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              CRM-система
            </p>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="login"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Логин
              </label>
              <input
                id="login"
                type="text"
                autoComplete="username"
                {...register("login")}
                className="w-full px-3 py-2 border border-white/30 dark:border-white/10 rounded-lg bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none transition backdrop-blur-sm"
                placeholder="Введите логин"
              />
              {errors.login && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.login.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Пароль
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
                className="w-full px-3 py-2 border border-white/30 dark:border-white/10 rounded-lg bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none transition backdrop-blur-sm"
                placeholder="Введите пароль"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50/80 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-medium rounded-lg transition duration-200 focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 outline-none"
            >
              {loading ? "Входим..." : "Войти"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
