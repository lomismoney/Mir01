"use client";

import React from "react";
import { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormValues } from "./CategoryForm";

interface NameFieldProps {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
}

export function NameField({ register, errors }: NameFieldProps) {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="name" className="text-right">
        名稱
      </Label>
      <div className="col-span-3">
        <Input
          id="name"
          placeholder="請輸入分類名稱"
          {...register("name", { required: "分類名稱為必填項目" })}
         
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">
            {errors.name.message}
          </p>
        )}
      </div>
    </div>
  );
}

interface DescriptionFieldProps {
  register: UseFormRegister<FormValues>;
}

export function DescriptionField({ register }: DescriptionFieldProps) {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="description" className="text-right">
        描述
      </Label>
      <Input
        id="description"
        placeholder="請輸入分類描述（可選）"
        {...register("description")}
        className="col-span-3"
       
      />
    </div>
  );
}