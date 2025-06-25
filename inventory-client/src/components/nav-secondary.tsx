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
    <SidebarGroup {...props} data-oid="4s8sj5:">
      <SidebarGroupContent data-oid="biei_uo">
        <SidebarMenu data-oid="iz92_01">
          {items.map((item) => (
            <SidebarMenuItem key={item.title} data-oid="i89f.93">
              <SidebarMenuButton asChild data-oid="v93nv6a">
                <Link href={item.url} prefetch={true} data-oid=":2-tx1j">
                  <item.icon data-oid="502adwp" />
                  <span data-oid="1g.8j_r">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
