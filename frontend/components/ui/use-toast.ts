// Adapted from shadcn/ui toast component
import { Toast, ToastActionElement, ToastProps } from "@/components/ui/toast";
import { toast as toastOriginal, dismiss as dismissOriginal } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export type ToastActionProps = React.ComponentPropsWithoutRef<typeof Toast> & {
  altText?: string;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
  title?: React.ReactNode;
  description?: React.ReactNode;
};

export function useToast() {
  // Get the toasts from the hook
  const hookResult = require("@/hooks/use-toast").useToast();
  
  return {
    toasts: hookResult.toasts || [], // Pass through the toasts
    toast: (props: ToastActionProps) => {
      toastOriginal(props);
    },
    dismiss: (toastId?: string) => dismissOriginal(toastId),
  };
} 