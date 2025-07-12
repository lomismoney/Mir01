import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package } from "lucide-react";

interface ProductFormData {
  name: string;
  description?: string;
  category_id?: number | null;
}

interface BasicInfoFormProps {
  formData: ProductFormData;
  handleFieldChange: (field: keyof ProductFormData, value: string | number | null) => void;
  isLoading: boolean;
  title: string;
  description: string;
}

export function BasicInfoForm({
  formData,
  handleFieldChange,
  isLoading,
  title,
  description,
}: BasicInfoFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 商品名稱 */}
        <div className="space-y-2">
          <Label htmlFor="name">商品名稱 *</Label>
          <Input
            id="name"
            placeholder="請輸入商品名稱"
            value={formData.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        {/* 商品描述 */}
        <div className="space-y-2">
          <Label htmlFor="description">商品描述</Label>
          <Textarea
            id="description"
            placeholder="請輸入商品詳細描述"
            value={formData.description || ""}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            disabled={isLoading}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}