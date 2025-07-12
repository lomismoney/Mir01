import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useCreateCustomer } from "@/hooks";
import { Customer } from "@/types/api-helpers";
import { OrderFormValues } from "./useOrderForm";

interface UseCustomerManagerProps {
  form: UseFormReturn<OrderFormValues>;
}

export function useCustomerManager({ form }: UseCustomerManagerProps) {
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const createCustomerMutation = useCreateCustomer();

  const handleAddNewCustomer = () => {
    setIsCustomerDialogOpen(true);
  };

  const handleCustomerCreated = (newCustomer: Customer) => {
    if (newCustomer.id) {
      form.setValue("customer_id", newCustomer.id);
      form.setValue("shipping_address", newCustomer.contact_address || "");
    }
    setIsCustomerDialogOpen(false);
  };

  return {
    isCustomerDialogOpen,
    setIsCustomerDialogOpen,
    createCustomerMutation,
    handleAddNewCustomer,
    handleCustomerCreated,
  };
}