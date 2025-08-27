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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useAppContext } from "@/hooks/useAppContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

const formSchema = z.object({
  email: z.string().min(1, "Student ID or Email is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export default function LoginPage() {
  const { login, sendPasswordReset } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setShowVerificationAlert(true);
    }
  }, [searchParams]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    await login(values.email, values.password);
    setIsSubmitting(false);
  }

  const handlePasswordReset = async () => {
    const email = form.getValues("email");
    if (!email.includes("@")) {
      form.setError("email", {
        type: "manual",
        message: "Please enter a valid email address to reset password.",
      });
      return;
    }
    const { success } = z.string().email().safeParse(email);
    if (!success) {
      form.trigger("email");
      return;
    }
    await sendPasswordReset(email);
  };

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">
            Login to RUET Connect
          </CardTitle>
          <CardDescription>
            Enter your RUET student email to access your account. Format:{" "}
            <strong>2103141@student.ruet.ac.bd</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showVerificationAlert && (
            <Alert className="mb-4 bg-green-100 border-green-200 text-green-800">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Email Verified!</AlertTitle>
              <AlertDescription>
                Your email has been successfully verified. You can now log in.
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
                    <FormLabel>Student ID / Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 2103141 or user@example.com"
                        {...field}
                      />
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
                    <div className="flex justify-between items-center">
                      <FormLabel>Password</FormLabel>
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-xs"
                        onClick={handlePasswordReset}
                      >
                        Forgot your password?
                      </Button>
                    </div>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Logging in..." : "Login"}
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
