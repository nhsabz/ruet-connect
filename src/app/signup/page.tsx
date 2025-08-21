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

const studentIdSchema = z.string().length(7, "Student ID must be 7 digits.").refine(id => {
    try {
        const series = parseInt(id.substring(0, 2));
        const dept = parseInt(id.substring(2, 4));
        const roll = parseInt(id.substring(4, 7));
        return series >= 20 && series <= 30 && dept >= 0 && dept <= 13 && roll >= 1 && roll <= 183;
    } catch {
        return false;
    }
}, "Invalid Student ID format. (Series: 20-30, Dept: 00-13, Roll: 001-183)");


const formSchema = z.object({
  studentId: studentIdSchema,
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export default function SignupPage() {
    const { signup } = useAppContext();
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            studentId: "",
            password: "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        const success = signup(values.studentId);
        if (success) {
            toast({ title: "Account Created", description: "Welcome to RUET Connect!" });
            router.push("/");
        } else {
            toast({ title: "Signup Failed", description: "An account with this Student ID already exists.", variant: "destructive" });
        }
    }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
          <CardDescription>
            Use your official RUET Student ID to join.
          </CardDescription>
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
                Sign Up
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
