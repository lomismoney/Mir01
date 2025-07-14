"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useChangePassword } from "@/hooks/use-change-password";

const formSchema = z.object({
  current_password: z.string().min(1, "請輸入當前密碼"),
  password: z.string().min(8, "密碼至少需要8個字符"),
  password_confirmation: z.string().min(1, "請確認新密碼"),
}).refine((data) => data.password === data.password_confirmation, {
  message: "密碼確認不符",
  path: ["password_confirmation"],
});

type FormData = z.infer<typeof formSchema>;

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { mutate: changePassword, isPending } = useChangePassword();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      current_password: "",
      password: "",
      password_confirmation: "",
    },
  });

  const onSubmit = (data: FormData) => {
    changePassword(data, {
      onSuccess: () => {
        toast.success("密碼已成功更新");
        form.reset();
        onOpenChange(false);
      },
      onError: (error) => {
        if (error.message.includes("current_password")) {
          form.setError("current_password", {
            type: "manual",
            message: "當前密碼不正確",
          });
        } else {
          toast.error("更新失敗：" + error.message);
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>變更密碼</DialogTitle>
          <DialogDescription>
            為了您的帳戶安全，請定期更新密碼
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="current_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>當前密碼</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="請輸入當前密碼" 
                      type="password" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>新密碼</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="請輸入新密碼（至少8個字符）" 
                      type="password" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password_confirmation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>確認新密碼</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="請再次輸入新密碼" 
                      type="password" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "更新中..." : "變更密碼"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}