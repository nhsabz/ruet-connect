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
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  studentId: z.string().min(7, "Student ID must be 7 digits.").max(7, "Student ID must be 7 digits."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export default function LoginPage() {
  const { login } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: "2103141",
      password: "12345678",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const success = login(values.studentId, values.password);
    if (success) {
      toast({ title: "Login Successful", description: "Welcome back!" });
      router.push("/");
    } else {
      toast({ title: "Login Failed", description: "Invalid Student ID or password.", variant: "destructive" });
    }
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Login to RUET Connect</CardTitle>
          <CardDescription>Enter your student credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2103141" {...field} />
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
              <Button type="submit" className="w-full">
                Login
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
