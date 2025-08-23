
"use client";

import Image from "next/image";
import type { Item } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/hooks/useAppContext";
import { useRouter } from "next/navigation";
import { Phone, Trash2 } from "lucide-react";

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const { toast } = useToast();
  const { user, getUserById, isAdmin, deleteItem } = useAppContext();
  const router = useRouter();
  
  const itemOwner = getUserById(item.userId);

  const handleClaimRequest = () => {
    if (!user) {
        toast({
            title: "Authentication Required",
            description: "Please log in to claim or request an item.",
            variant: "destructive"
        })
        router.push("/login");
        return;
    }
    // Prevent owner from requesting their own item
    if (user.id === item.userId) {
        toast({
            title: "Action Not Allowed",
            description: "You cannot request your own item.",
            variant: "destructive"
        });
        return;
    }

    toast({
      title: "Request Sent!",
      description: `Your request for "${item.title}" has been sent to the owner.`,
    });
  };
  
  const handleDelete = () => {
    deleteItem(item.id);
  }

  const categoryVariants: { [key in Item["category"]]: "default" | "secondary" | "destructive" | "outline" } = {
    Lost: "destructive",
    Found: "default",
    Lend: "secondary",
    Donate: "outline",
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-shadow duration-300 hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="relative w-full h-48">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            data-ai-hint={item['data-ai-hint']}
          />
        </div>
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
      <CardFooter className="flex-col items-start p-4 pt-0 gap-4">
        {itemOwner?.contactNumber && (
            <div className="flex items-center text-sm text-muted-foreground gap-2">
                <Phone className="h-4 w-4" />
                <span>{itemOwner.contactNumber}</span>
            </div>
        )}
        <div className="w-full flex gap-2">
            <Button className="w-full" onClick={handleClaimRequest} disabled={user?.id === item.userId}>
            Claim / Request
            </Button>
            {isAdmin && (
                <Button variant="destructive" size="icon" onClick={handleDelete} title="Delete as Admin">
                    <Trash2 />
                </Button>
            )}
        </div>
      </CardFooter>
    </Card>
  );
}
