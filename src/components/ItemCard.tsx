
"use client";

import Image from "next/image";
import type { Item } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/hooks/useAppContext";
import { useRouter } from "next/navigation";

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const { toast } = useToast();
  const { user } = useAppContext();
  const router = useRouter();

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
    toast({
      title: "Request Sent!",
      description: `Your request for "${item.title}" has been sent to the owner.`,
    });
  };

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
        <div className="p-4">
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
      <CardFooter className="p-4 pt-0">
        <Button className="w-full" onClick={handleClaimRequest}>
          Claim / Request
        </Button>
      </CardFooter>
    </Card>
  );
}
