"use client";

import { ItemCard } from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppContext } from "@/hooks/useAppContext";
import type { Item } from "@/lib/types";
import {
  ArrowRight,
  Search,
  PackageCheck,
  ArrowRightLeft,
  Heart,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { items } = useAppContext();

  const getRecentItems = (category?: Item["category"]) => {
    let filtered = items;
    if (category) {
      filtered = items.filter((item) => item.category === category);
    }
    return filtered
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 4);
  };

  const categories: { name: string; icon?: React.ElementType }[] = [
    { name: "All" },
    { name: "Lost", icon: Search },
    { name: "Found", icon: PackageCheck },
    { name: "Lend", icon: ArrowRightLeft },
    { name: "Donate", icon: Heart },
  ];

  return (
    <div className="space-y-12">
      <section className="text-center bg-card p-8 rounded-xl shadow-md">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4 font-headline">
          Welcome to RUET Connect
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          The central hub for finding lost items, reporting found ones, lending
          essentials, and donating to fellow students at RUET.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/post">Post an Item</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/browse">Browse All Items</Link>
          </Button>
        </div>
      </section>

      <Tabs defaultValue="All" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
          {categories.map(({ name, icon: Icon }) => (
            <TabsTrigger key={name} value={name} className="py-2">
              {Icon ? <Icon className="mr-2 h-4 w-4" /> : null}
              {name}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* All Items Tab */}
        <TabsContent value="All" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold font-headline">
              All Recent Items
            </h2>
            <Button variant="ghost" asChild>
              <Link href="/browse">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {getRecentItems().length > 0 ? (
              getRecentItems().map((item) => (
                <ItemCard key={item.id} item={item} />
              ))
            ) : (
              <p className="text-muted-foreground col-span-full text-center py-8">
                No recent items posted.
              </p>
            )}
          </div>
        </TabsContent>

        {/* Category Tabs */}
        {categories
          .filter((c) => c.name !== "All")
          .map(({ name }) => (
            <TabsContent key={name} value={name} className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold font-headline">
                  Recent {name} Items
                </h2>
                <Button variant="ghost" asChild>
                  <Link href="/browse">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {getRecentItems(name as Item["category"]).length > 0 ? (
                  getRecentItems(name as Item["category"]).map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))
                ) : (
                  <p className="text-muted-foreground col-span-full text-center py-8">
                    No recent items in the {name} category.
                  </p>
                )}
              </div>
            </TabsContent>
          ))}
      </Tabs>
    </div>
  );
}
