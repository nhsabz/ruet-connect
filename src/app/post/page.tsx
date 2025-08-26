
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
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";

// Cloudinary settings
const CLOUDINARY_CLOUD_NAME = "dnsnjef8h"; 
const CLOUDINARY_UPLOAD_PRESET = "ruet-connect";

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
  const [statusMessage, setStatusMessage] = useState('Post Item');
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        const MIME_TYPE = 'image/jpeg';
        const QUALITY = 0.8;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new window.Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round((width * MAX_HEIGHT) / height);
                        height = MAX_HEIGHT;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            return reject(new Error('Canvas toBlob failed'));
                        }
                        const newFile = new File([blob], file.name, {
                            type: MIME_TYPE,
                            lastModified: Date.now(),
                        });
                        resolve(newFile);
                    },
                    MIME_TYPE,
                    QUALITY
                );
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedFile = await compressImage(file);
        form.setValue("image", compressedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error("Image compression failed:", error);
        toast({
          title: "Image Error",
          description: "Could not process the image. Please try a different one.",
          variant: "destructive"
        })
      }
    }
  };

  const uploadToCloudinary = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        formData.append("public_id", `ruet-connect/${Date.now()}`);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, true);
        
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(progress);
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                resolve(response.secure_url);
            } else {
                const errorResponse = JSON.parse(xhr.responseText);
                reject(new Error(errorResponse.error.message || "Cloudinary upload failed"));
            }
        };
        
        xhr.onerror = () => {
            reject(new Error("An unknown error occurred during the upload."));
        };
        
        xhr.send(formData);
    });
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
        let imageUrl = 'https://placehold.co/600x400.png';

        if (values.image) {
            setStatusMessage('Uploading...');
            imageUrl = await uploadToCloudinary(values.image);
        }

        setStatusMessage('Saving...');
        await addItem({
            title: values.title,
            description: values.description,
            category: values.category as Category,
            imageUrl: imageUrl,
        });

        toast({
            title: "Item Posted!",
            description: "Your item has been successfully listed."
        });
        router.push("/browse");

    } catch (error: any) {
        console.error("Failed to post item:", error);
        toast({
            title: "Upload Failed",
            description: error.message || "There was a problem uploading your item. Please try again.",
            variant: "destructive"
        });
    } finally {
        setIsSubmitting(false);
        setUploadProgress(0);
        setStatusMessage('Post Item');
    }
  }
  
  if (!user) {
    return null;
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
                render={() => (
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
                              <p className="text-xs">PNG, JPG up to 10MB</p>
                            </div>
                          )}
                        </label>
                        <Input id="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg" disabled={isSubmitting} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isSubmitting && form.getValues("image") && (
                <div className="space-y-2">
                    <Label>Upload Progress</Label>
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-center text-muted-foreground">{uploadProgress}% complete</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? statusMessage : 'Post Item'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
