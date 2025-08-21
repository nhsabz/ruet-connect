"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/hooks/useAppContext";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemCard } from "@/components/ItemCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { user, items, requests } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      toast({
        title: "Unauthorized",
        description: "You must be logged in to view your profile.",
        variant: "destructive",
      });
      router.replace("/login");
    }
  }, [user, router, toast]);

  if (!user) {
    return null; // Or a loading skeleton
  }

  const myItems = items.filter((item) => item.userId === user.id);
  const myRequests = requests.filter((req) => req.ownerId === user.id);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-3xl">{user.id.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-3xl font-headline">My Profile</CardTitle>
            <CardDescription className="text-lg">Student ID: {user.id}</CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="my-posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-posts">My Posts ({myItems.length})</TabsTrigger>
          <TabsTrigger value="my-requests">Requests Received ({myRequests.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="my-posts" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {myItems.length > 0 ? (
              myItems.map((item) => <ItemCard key={item.id} item={item} />)
            ) : (
              <p className="col-span-full text-center text-muted-foreground py-10">
                You haven't posted any items yet.
              </p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="my-requests" className="mt-6">
          <div className="space-y-4">
            {myRequests.length > 0 ? (
              myRequests.map((req) => (
                <Card key={req.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p>
                        Request for{" "}
                        <span className="font-semibold">{req.itemTitle}</span> from Student ID{" "}
                        <span className="font-semibold">{req.requesterId}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(req.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Badge variant={req.status === 'Pending' ? 'secondary' : req.status === 'Approved' ? 'default' : 'destructive'}>
                            {req.status}
                        </Badge>
                        {req.status === 'Pending' && (
                            <>
                               <Button size="sm">Approve</Button>
                               <Button size="sm" variant="destructive">Reject</Button>
                            </>
                        )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground py-10">
                You have not received any requests.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
