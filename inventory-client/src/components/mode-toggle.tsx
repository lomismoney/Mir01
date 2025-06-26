"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

/**
 * 主題模式切換組件
 * 簡單的淺色/深色模式切換按鈕
 * 點擊即可在 Light 和 Dark 模式之間切換
 */
export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  /**
   * 切換主題模式
   * 在淺色和深色模式之間切換
   */
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      data-oid="a2di2u3"
    >
      <Sun
        className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
        data-oid="-iol0c7"
      />

      <Moon
        className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
        data-oid="t6kfgna"
      />

      <span className="sr-only" data-oid="9ztxxg8">
        切換主題
      </span>
    </Button>
  );
}
