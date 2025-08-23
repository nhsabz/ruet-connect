
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/hooks/useAppContext";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemCard } from "@/components/ItemCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Edit, Save, X, AlertTriangle } from "lucide-react";
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

export default function ProfilePage() {
  const { user, items, requests, updateContactNumber, deleteAccount } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [newContactNumber, setNewContactNumber] = useState(user?.contactNumber || "");

  useEffect(() => {
    if (!user) {
      toast({
        title: "Unauthorized",
        description: "You must be logged in to view your profile.",
        variant: "destructive",
      });
      router.replace("/login");
    } else {
        setNewContactNumber(user.contactNumber || "");
    }
  }, [user, router, toast]);

  const handleContactSave = async () => {
    if (user) {
        await updateContactNumber(newContactNumber);
        toast({
            title: "Contact Updated",
            description: "Your contact number has been successfully updated."
        });
        setIsEditingContact(false);
    }
  }

  const handleDeleteAccount = async () => {
    await deleteAccount();
  }

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
            <CardDescription className="text-md text-muted-foreground">{user.email}</CardDescription>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                {isEditingContact ? (
                    <div className="flex items-center gap-2">
                        <Input 
                            type="tel"
                            value={newContactNumber}
                            onChange={(e) => setNewContactNumber(e.target.value)}
                            className="h-8"
                            placeholder="Your contact number"
                        />
                        <Button size="icon" className="h-8 w-8" onClick={handleContactSave}>
                            <Save className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditingContact(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <>
                        <span>{user.contactNumber || "Not set"}</span>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditingContact(true)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                    </>
                )}
            </div>
          </div>
        </CardHeader>
        <CardFooter className="border-t pt-6 flex justify-end">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                        <AlertTriangle className="mr-2 h-4 w-4" /> Delete Account
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove all your data from our servers.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount}>
                        Yes, delete my account
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
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
