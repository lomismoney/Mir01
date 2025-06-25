"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider data-oid="-w:5.z_">
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} data-oid="o28gxfi">
            <div className="grid gap-1" data-oid="4c71woj">
              {title && <ToastTitle data-oid="m7km54h">{title}</ToastTitle>}
              {description && (
                <ToastDescription data-oid="0xa1tny">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose data-oid="o-st40i" />
          </Toast>
        );
      })}
      <ToastViewport data-oid="2eu6ja8" />
    </ToastProvider>
  );
}
