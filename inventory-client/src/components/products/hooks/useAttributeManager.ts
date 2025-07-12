import { useErrorHandler } from "@/hooks";

interface UseAttributeManagerProps {
  selectedAttrs: Set<number>;
  setSelectedAttrs: (attrs: Set<number>) => void;
  optionsMap: Record<number, string[]>;
  setOptionsMap: (map: Record<number, string[]> | ((prev: Record<number, string[]>) => Record<number, string[]>)) => void;
  inputValues: Record<number, string>;
  setInputValues: (values: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void;
}

export function useAttributeManager({
  selectedAttrs,
  setSelectedAttrs,
  optionsMap,
  setOptionsMap,
  inputValues,
  setInputValues,
}: UseAttributeManagerProps) {
  const { handleError, handleSuccess } = useErrorHandler();
  /**
   * 處理屬性選擇切換
   */
  const handleAttributeToggle = (attributeId: number, checked: boolean) => {
    const newSelectedAttrs = new Set(selectedAttrs);

    if (checked) {
      newSelectedAttrs.add(attributeId);
    } else {
      newSelectedAttrs.delete(attributeId);
      // 移除該屬性的所有值
      const newOptionsMap = { ...optionsMap };
      delete newOptionsMap[attributeId];
      setOptionsMap(newOptionsMap);

      // 清空該屬性的輸入值
      const newInputValues = { ...inputValues };
      delete newInputValues[attributeId];
      setInputValues(newInputValues);
    }

    setSelectedAttrs(newSelectedAttrs);
  };

  /**
   * 處理屬性值輸入變更
   */
  const handleValueInputChange = (attributeId: number, value: string) => {
    setInputValues((prev) => ({
      ...prev,
      [attributeId]: value,
    }));
  };

  /**
   * 添加屬性值
   */
  const handleAddAttributeValue = (attributeId: number) => {
    const inputValue = inputValues[attributeId]?.trim();

    if (!inputValue) {
      handleError(new Error("請輸入屬性值"));
      return;
    }

    const currentValues = optionsMap[attributeId] || [];

    // 檢查是否重複
    if (currentValues.includes(inputValue)) {
      handleError(new Error("該屬性值已存在"));
      return;
    }

    // 添加新值
    setOptionsMap((prev) => ({
      ...prev,
      [attributeId]: [...currentValues, inputValue],
    }));

    // 清空輸入框
    setInputValues((prev) => ({
      ...prev,
      [attributeId]: "",
    }));

    handleSuccess(`已添加屬性值：${inputValue}`);
  };

  /**
   * 移除屬性值
   */
  const handleRemoveAttributeValue = (
    attributeId: number,
    valueToRemove: string,
  ) => {
    setOptionsMap((prev) => ({
      ...prev,
      [attributeId]: (prev[attributeId] || []).filter(
        (value) => value !== valueToRemove,
      ),
    }));

    handleSuccess(`已移除屬性值：${valueToRemove}`);
  };

  return {
    handleAttributeToggle,
    handleValueInputChange,
    handleAddAttributeValue,
    handleRemoveAttributeValue,
  };
}