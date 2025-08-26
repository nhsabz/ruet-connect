
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppContext } from "@/hooks/useAppContext";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemCard } from "@/components/ItemCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Edit, Save, X, AlertTriangle, User as UserIcon } from "lucide-react";
import type { ClaimRequest, User } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
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
  const { user, items, requests, updateContactNumber, deleteAccount, updateRequestStatus, getUserById } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [newContactNumber, setNewContactNumber] = useState(user?.contactNumber || "");
  const [activeTab, setActiveTab] = useState("my-posts");
  const [selectedRequester, setSelectedRequester] = useState<User | null>(null);
  const [isContactInfoDialogOpen, setIsContactInfoDialogOpen] = useState(false);
  
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === 'requests') {
        setActiveTab('my-requests');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) {
      // router.replace("/login") is handled by the AppContext now
    } else {
        setNewContactNumber(user.contactNumber || "");
    }
  }, [user, router, toast]);

  const handleContactSave = async () => {
    if (user) {
        await updateContactNumber(newContactNumber);
        setIsEditingContact(false);
    }
  }

  const handleDeleteAccount = async () => {
    await deleteAccount();
  }

  const handleApproveRequest = (request: ClaimRequest) => {
    const requester = getUserById(request.requesterId);
    if(requester) {
        setSelectedRequester(requester);
        updateRequestStatus(request.id, 'Approved');
        setIsContactInfoDialogOpen(true);
    } else {
        toast({ title: "Error", description: "Could not find requester details. They may have deleted their account.", variant: "destructive"})
    }
  }

  const handleRejectRequest = (request: ClaimRequest) => {
    updateRequestStatus(request.id, 'Rejected');
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
            <AvatarFallback className="text-3xl">{user.name ? user.name.charAt(0) : 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-3xl font-headline">{user.name || 'My Profile'}</CardTitle>
            <CardDescription className="text-lg">Student ID: {user.studentId}</CardDescription>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
              myRequests.map((req) => {
                const requester = getUserById(req.requesterId);
                return (
                    <Card key={req.id}>
                    <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                        <p>
                            Request for{" "}
                            <span className="font-semibold">{req.itemTitle}</span> from Student ID{" "}
                            <span className="font-semibold">{requester?.studentId || 'Unknown'}</span>
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
                                <Button size="sm" onClick={() => handleApproveRequest(req)}>Approve</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleRejectRequest(req)}>Reject</Button>
                                </>
                            )}
                        </div>
                    </CardContent>
                    </Card>
                )
            })
            ) : (
              <p className="col-span-full text-center text-muted-foreground py-10">
                You have not received any requests.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isContactInfoDialogOpen} onOpenChange={setIsContactInfoDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Request Approved!</DialogTitle>
                  <DialogDescription>
                      You can now contact the requester to arrange the exchange.
                  </DialogDescription>
              </DialogHeader>
              {selectedRequester && (
                  <div className="py-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Name:</span>
                        <span>{selectedRequester.name}</span>
                      </div>
                       <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Contact:</span>
                        <span>{selectedRequester.contactNumber || "Not provided"}</span>
                      </div>
                  </div>
              )}
              <DialogClose asChild>
                <Button type="button" className="w-full">
                    Close
                </Button>
              </DialogClose>
          </DialogContent>
      </Dialog>
    </div>
  );
}

    