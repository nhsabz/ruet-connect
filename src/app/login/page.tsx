"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useAppContext } from "@/hooks/useAppContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

const emailSchema = z.string().email("Invalid email address.").refine(email => {
    const regex = /^\d{7}@student\.ruet\.ac\.bd$/;
    return regex.test(email);
}, "Email must be a valid RUET student email (e.g., 2103141@student.ruet.ac.bd).");

const formSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export default function LoginPage() {
  const { login, firebaseUser } = useAppContext();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "2103141@student.ruet.ac.bd",
      password: "password123",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    await login(values.email, values.password);
    setIsSubmitting(false);
  }

  const showVerificationAlert = firebaseUser && !firebaseUser.emailVerified;

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Login to RUET Connect</CardTitle>
          <CardDescription>Enter your student credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {showVerificationAlert && (
            <Alert className="mb-4">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Verify Your Email</AlertTitle>
              <AlertDescription>
                A verification link has been sent to your email. Please check your inbox and verify your account to log in.
              </AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Email</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2103141@student.ruet.ac.bd" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
