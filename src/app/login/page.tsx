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
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { ADMIN_EMAILS } from "@/lib/config";

const emailSchema = z.string().email("Invalid email address.").refine(email => {
    if (ADMIN_EMAILS.includes(email)) {
        return true;
    }
    const regex = /^\d{7}@student\.ruet\.ac\.bd$/;
    return regex.test(email);
}, "Email must be a valid RUET student email or a registered admin email.");

const formSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export default function LoginPage() {
  const { login, sendPasswordReset } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
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
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      form.trigger("email");
      return;
    }
    await sendPasswordReset(email);
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Login to RUET Connect</CardTitle>
          <CardDescription>Enter your student credentials to access your account.</CardDescription>
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
