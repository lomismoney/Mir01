"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield, Store, Eye, Edit } from "lucide-react";

/**
 * 角色配置
 */
const roleConfig = {
  admin: {
    label: "管理員",
    description: "擁有系統的完整管理權限",
    icon: <Shield className="h-4 w-4" />,
  },
  staff: {
    label: "員工",
    description: "可以管理商品、庫存和訂單",
    icon: <Store className="h-4 w-4" />,
  },
  viewer: {
    label: "檢視者",
    description: "只能查看系統資料，不能修改",
    icon: <Eye className="h-4 w-4" />,
  },
  installer: {
    label: "安裝師傅",
    description: "負責安裝工作，可查看和管理安裝單",
    icon: <Edit className="h-4 w-4" />,
  },
};

/**
 * 多角色選擇器組件屬性
 */
interface RoleSelectorProps {
  /**
   * 已選擇的角色列表
   */
  selectedRoles: string[];
  /**
   * 角色選擇變更回調
   */
  onRolesChange: (roles: string[]) => void;
  /**
   * 是否禁用
   */
  disabled?: boolean;
}

/**
 * 多角色選擇器組件
 * 
 * 提供角色的多選功能，每個角色都有圖標和描述說明
 */
export function RoleSelector({
  selectedRoles,
  onRolesChange,
  disabled = false,
}: RoleSelectorProps) {
  // 處理角色選擇變更
  const handleRoleToggle = (role: string, checked: boolean) => {
    if (checked) {
      onRolesChange([...selectedRoles, role]);
    } else {
      onRolesChange(selectedRoles.filter((r) => r !== role));
    }
  };

  return (
    <div className="space-y-3">
      {Object.entries(roleConfig).map(([role, config]) => (
        <div key={role} className="flex items-start space-x-3">
          <Checkbox
            id={`role-${role}`}
            checked={selectedRoles.includes(role)}
            onCheckedChange={(checked) => 
              handleRoleToggle(role, checked as boolean)
            }
            disabled={disabled}
            className="mt-1"
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor={`role-${role}`}
              className="flex items-center gap-2 font-medium cursor-pointer"
            >
              {config.icon}
              {config.label}
            </Label>
            <p className="text-sm text-muted-foreground">
              {config.description}
            </p>
          </div>
        </div>
      ))}
      
      {selectedRoles.length === 0 && (
        <p className="text-sm text-destructive">
          請至少選擇一個角色
        </p>
      )}
    </div>
  );
} 