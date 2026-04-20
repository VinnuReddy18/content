"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@/hooks/queries";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegister();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: any) => {
    setServerError("");
    registerMutation.mutate(data, {
      onSuccess: () => router.push("/dashboard"),
      onError: (err: any) => setServerError(err.response?.data?.message || "Registration failed"),
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm p-8"
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
          <p className="text-sm text-[#888888] mt-2">Start synthesizing UI videos</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input placeholder="Email" {...register("email")} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message as string}</p>}
          </div>
          <div>
            <Input type="password" placeholder="Password" {...register("password")} />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message as string}</p>}
          </div>

          <AnimatePresence>
            {serverError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-red-500"
              >
                {serverError}
              </motion.p>
            )}
          </AnimatePresence>

          <Button type="submit" className="w-full" isLoading={registerMutation.isPending}>
            Sign Up
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-[#888888]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#EDEDED] hover:underline">
            Log in
          </Link>
        </div>
      </Card>
    </div>
  );
}
