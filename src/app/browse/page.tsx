"use client";

import { useState } from "react";
import { ItemCard } from "@/components/ItemCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppContext } from "@/hooks/useAppContext";
import type { Item, Category } from "@/lib/types";
import { Search, PackageCheck, ArrowRightLeft, Heart, SearchIcon } from "lucide-react";

export default function BrowsePage() {
  const { items } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<Category>("Lost");

  const categories: { name: Category; icon: React.ElementType }[] = [
    { name: "Lost", icon: Search },
    { name: "Found", icon: PackageCheck },
    { name: "Lend", icon: ArrowRightLeft },
    { name: "Donate", icon: Heart },
  ];

  const filteredItems = items.filter(
    (item) =>
      item.category === activeTab &&
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline mb-2">Browse All Items</h1>
        <p className="text-muted-foreground">
          Find what you're looking for, or see what you can help with.
        </p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for items..."
          className="w-full pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs 
        defaultValue={activeTab} 
        onValueChange={(value) => setActiveTab(value as Category)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
            {categories.map(({ name, icon: Icon }) => (
                <TabsTrigger key={name} value={name} className="py-2">
                <Icon className="mr-2 h-4 w-4" />
                {name}
                </TabsTrigger>
            ))}
        </TabsList>

        {categories.map(({ name }) => (
          <TabsContent key={name} value={name} className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))
              ) : (
                <div className="col-span-full text-center py-16 bg-card rounded-lg">
                  <p className="text-muted-foreground">
                    No items found in the "{name}" category matching your search.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
