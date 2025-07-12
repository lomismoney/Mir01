import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings, Plus, X } from "lucide-react";
import { type Attribute } from "@/types/products";

interface SpecificationFormProps {
  isVariable: boolean;
  setIsVariable: (value: boolean) => void;
  selectedAttrs: Set<number>;
  optionsMap: Record<number, string[]>;
  inputValues: Record<number, string>;
  attributes: Attribute[];
  isLoading: boolean;
  handleAttributeToggle: (attributeId: number, checked: boolean) => void;
  handleValueInputChange: (attributeId: number, value: string) => void;
  handleAddAttributeValue: (attributeId: number) => void;
  handleRemoveAttributeValue: (attributeId: number, value: string) => void;
}

export function SpecificationForm({
  isVariable,
  setIsVariable,
  selectedAttrs,
  optionsMap,
  inputValues,
  attributes,
  isLoading,
  handleAttributeToggle,
  handleValueInputChange,
  handleAddAttributeValue,
  handleRemoveAttributeValue,
}: SpecificationFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          規格定義
        </CardTitle>
        <CardDescription>
          設定商品的規格屬性，支援單規格和多規格商品
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 多規格切換開關 */}
        <div className="flex items-center space-x-3">
          <Switch
            id="variable-switch"
            checked={isVariable}
            onCheckedChange={setIsVariable}
            disabled={isLoading}
          />
          <Label
            htmlFor="variable-switch"
            className="text-sm font-medium"
          >
            此商品擁有多種規格
          </Label>
        </div>

        {/* 多規格配置區 */}
        {isVariable && (
          <div className="space-y-6">
            <Separator />

            {/* 規格選擇區 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">選擇規格屬性</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {attributes.map((attribute: Attribute) => (
                  <div
                    key={attribute.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`attr-${attribute.id}`}
                      checked={selectedAttrs.has(attribute.id)}
                      onCheckedChange={(checked) =>
                        handleAttributeToggle(attribute.id, checked === true)
                      }
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor={`attr-${attribute.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {attribute.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* 規格值輸入區 */}
            {selectedAttrs.size > 0 && (
              <div className="space-y-4">
                <Separator />
                <h4 className="text-sm font-medium">配置規格值</h4>

                {Array.from(selectedAttrs).map((attributeId) => {
                  const attribute = attributes.find(
                    (attr: Attribute) => attr.id === attributeId,
                  );
                  if (!attribute) return null;

                  const currentValues = optionsMap[attributeId] || [];
                  const inputValue = inputValues[attributeId] || "";

                  return (
                    <Card
                      key={attributeId}
                      className="bg-muted/30"
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {attribute.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* 添加新值的輸入區 */}
                        <div className="flex space-x-2">
                          <Input
                            placeholder={`輸入${attribute.name}值，例如：紅色、藍色`}
                            value={inputValue}
                            onChange={(e) =>
                              handleValueInputChange(
                                attributeId,
                                e.target.value,
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddAttributeValue(attributeId);
                              }
                            }}
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleAddAttributeValue(attributeId)
                            }
                            disabled={isLoading || !inputValue.trim()}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* 已添加的值列表 */}
                        {currentValues.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                              已添加的{attribute.name}值：
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {currentValues.map((value) => (
                                <Badge
                                  key={value}
                                  variant="secondary"
                                  className="flex items-center gap-1"
                                >
                                  {value}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 ml-1 hover:bg-transparent"
                                    onClick={() =>
                                      handleRemoveAttributeValue(
                                        attributeId,
                                        value,
                                      )
                                    }
                                    disabled={isLoading}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}