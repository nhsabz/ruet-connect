
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/hooks/useAppContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@/lib/types";
import Image from "next/image";
import { UploadCloud } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  description: z.string().min(10, "Description must be at least 10 characters long."),
  category: z.enum(["Lost", "Found", "Lend", "Donate"], {
    required_error: "You need to select a category.",
  }),
  image: z.instanceof(File).optional(),
});

const categories: Category[] = ["Lost", "Found", "Lend", "Donate"];

export default function PostPage() {
  const { user, addItem } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      toast({
        title: "Unauthorized",
        description: "You must be logged in to post an item.",
        variant: "destructive",
      });
      router.replace("/login");
    }
  }, [user, router, toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("image", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await addItem(values);
      toast({
          title: "Item Posted!",
          description: "Your item has been successfully listed."
      });
      router.push("/browse");
    } catch (error) {
        console.error("Failed to post item:", error);
        toast({
            title: "Upload Failed",
            description: "There was a problem uploading your item. Please try again.",
            variant: "destructive"
        })
    } finally {
        setIsSubmitting(false);
    }
  }
  
  if (!user) {
    return null; // or a loading skeleton
  }

  return (
    <div className="flex justify-center py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Post a New Item</CardTitle>
          <CardDescription>
            Fill in the details below to list your item. Image is optional but recommended.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Lost Scientific Calculator" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Provide details about the item..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                      >
                        {categories.map((category) => (
                           <FormItem key={category}>
                             <FormControl>
                               <RadioGroupItem value={category} id={category} className="sr-only peer" />
                             </FormControl>
                             <FormLabel htmlFor={category} className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                               {category}
                             </FormLabel>
                           </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Image</FormLabel>
                    <FormControl>
                      <div className="w-full">
                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-lg border-2 border-dashed border-muted-foreground/50 w-full h-64 flex flex-col items-center justify-center text-center p-4 hover:border-primary transition-colors">
                          {preview ? (
                            <Image src={preview} alt="Image preview" fill className="object-contain rounded-md" />
                          ) : (
                            <div className="space-y-2 text-muted-foreground">
                              <UploadCloud className="mx-auto h-12 w-12" />
                              <p className="font-semibold">Click to upload an image</p>
                              <p className="text-xs">PNG, JPG, GIF up to 10MB</p>
                            </div>
                          )}
                        </label>
                        <Input id="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Post Item'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
