"use client";

import * as React from "react";
import Link from "next/link";
import { type Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavSecondary({
  items,
  ...props
}: {
  items: { title: string; url: string; icon: Icon }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props} data-oid="jqgp35-">
      <SidebarGroupContent data-oid="8i:3x7p">
        <SidebarMenu data-oid="r:baz3n">
          {items.map((item) => (
            <SidebarMenuItem key={item.title} data-oid="hb8rdy9">
              <SidebarMenuButton asChild data-oid="wij3ui0">
                <Link href={item.url} prefetch={true} data-oid=":0420ak">
                  <item.icon data-oid="cfp0ik0" />
                  <span data-oid="euv68d6">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
