"use client";

import Image from "next/image";
import type { Item } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/hooks/useAppContext";
import { useRouter } from "next/navigation";
import { Phone, Trash2, User as UserIcon } from "lucide-react";
import { timeAgo } from "@/lib/timeAgo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const { toast } = useToast();
  const { user, getUserById, isAdmin, deleteItem, createRequest } =
    useAppContext();
  const router = useRouter();

  const itemOwner = getUserById(item.userId);
  const canDelete = isAdmin || user?.id === item.userId;

  const handleClaimRequest = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to claim or request an item.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }
    if (user.id === item.userId) {
      toast({
        title: "Action Not Allowed",
        description: "You cannot request your own item.",
        variant: "destructive",
      });
      return;
    }

    await createRequest(item);
  };

  const handleDelete = () => {
    deleteItem(item.id, item.userId);
  };

  const categoryVariants: {
    [key in Item["category"]]:
      | "default"
      | "secondary"
      | "destructive"
      | "outline";
  } = {
    Lost: "destructive",
    Found: "default",
    Lend: "secondary",
    Donate: "outline",
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-shadow duration-300 hover:shadow-lg">
      <CardHeader className="p-0">
        <Dialog>
          <DialogTrigger asChild>
            <div className="relative w-full h-48 cursor-pointer">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                data-ai-hint={item["data-ai-hint"]}
              />
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-3xl p-2">
            <DialogTitle className="sr-only">{item.title}</DialogTitle>
            <div className="relative w-full h-[80vh]">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
        <div className="p-4 pb-2">
          <Badge variant={categoryVariants[item.category]}>
            {item.category}
          </Badge>
          <CardTitle className="mt-2 text-lg font-semibold line-clamp-2">
            {item.title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {item.description}
        </p>
      </CardContent>
      <CardFooter className="flex-col items-start p-4 pt-0 gap-2">
        <div className="space-y-1 text-sm text-muted-foreground">
          {/* Show time posted */}
          {item.createdAt && (
            <div className="flex items-center gap-2">
              <span className="text-xs italic">{timeAgo(item.createdAt)}</span>
            </div>
          )}
          {/* Show poster name - try getUserById first, then fallback to denormalized data */}
          {(itemOwner?.name || item.ownerName) && (
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span>{itemOwner?.name || item.ownerName}</span>
            </div>
          )}
          {/* Show student ID if available */}
          {itemOwner?.studentId && (
            <div className="flex items-center gap-2">
              <span className="text-xs">ID: {itemOwner.studentId}</span>
            </div>
          )}
        </div>
        <div className="w-full flex gap-2 pt-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full" disabled={user?.id === item.userId}>
                Claim / Request
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Request</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to send a request for &quot;{item.title}
                  &quot;? The owner will be notified of your interest.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClaimRequest}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" title="Delete Item">
                  <Trash2 />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the post &quot;{item.title}&quot;.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
