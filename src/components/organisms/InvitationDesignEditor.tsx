"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { InvitationPreview } from "./InvitationPreview";
import { ShapesLibrary } from "./ShapesLibrary";
import { EditableShape } from "./EditableShape";
import { EditableTextBox } from "./EditableTextBox";

interface InvitationDesignEditorProps {
  eventId: string;
  templateId?: string;
  designId?: string;
  onSave: () => void;
  onCancel: () => void;
  onChangeTemplate?: () => void;
}

interface TemplateConfig {
  textFields: Array<{
    id: string;
    label: string;
    placeholder: string;
    default: string;
    required?: boolean;
  }>;
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
    background: string;
    text: string;
    heading?: string;
    body?: string;
  };
  graphics: Array<{
    id: string;
    type: string;
    url: string;
  }>;
}

interface CustomTextField {
  id: string;
  label: string;
  value: string;
  placeholder: string;
}

interface CustomGraphic {
  id: string;
  url: string;
  type: "image" | "icon";
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

interface DesignShape {
  id: string;
  name: string;
  svgPath: string;
  color: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
}

interface TextBox {
  id: string;
  text: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  fontSize: number;
  color: string;
  backgroundColor?: string;
  hasFill: boolean;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
}

export function InvitationDesignEditor({
  eventId,
  templateId,
  designId,
  onSave,
  onCancel,
  onChangeTemplate,
}: InvitationDesignEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<{
    id: string;
    name: string;
    config: TemplateConfig;
  } | null>(null);
  const [existingDesign, setExistingDesign] = useState<{
    id: string;
    templateId?: string | null;
    customImage?: string | null;
    name?: string | null;
    designData?: unknown;
  } | null>(null);
  const [designData, setDesignData] = useState<{
    text: Record<string, string>;
    colors: Record<string, string>;
    graphics: Record<string, string>;
    styles: {
      fontSize: { heading: number; subheading: number; body: number };
      spacing: { padding: number; margin: { top: number; bottom: number } };
    };
    shapes?: DesignShape[];
    textBoxes?: TextBox[];
    customFields?: CustomTextField[];
    customGraphics?: CustomGraphic[];
  }>({
    text: {},
    colors: {},
    graphics: {},
    styles: {
      fontSize: {
        heading: 32,
        subheading: 24,
        body: 16,
      },
      spacing: {
        padding: 40,
        margin: {
          top: 20,
          bottom: 20,
        },
      },
    },
  });
  const [customFields, setCustomFields] = useState<CustomTextField[]>([]);
  const [customGraphics, setCustomGraphics] = useState<CustomGraphic[]>([]);
  const [shapes, setShapes] = useState<DesignShape[]>([]);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(
    null
  );
  const [showAddField, setShowAddField] = useState(false);
  const [showGraphicsManager, setShowGraphicsManager] = useState(false);
  const [showShapesLibrary, setShowShapesLibrary] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState("");
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const fetchDesign = useCallback(async () => {
    try {
      setLoading(true);

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`/api/invitations/designs/${designId}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch design: ${response.statusText}`);
      }

      const data = await response.json();
      setExistingDesign(data);

      // Parse saved design data - ensure it's an object
      let savedData: {
        text?: Record<string, string>;
        colors?: Record<string, string>;
        graphics?: Record<string, string>;
        styles?: {
          fontSize?: { heading?: number; subheading?: number; body?: number };
          spacing?: {
            padding?: number;
            margin?: { top?: number; bottom?: number };
          };
        };
        shapes?: DesignShape[];
        textBoxes?: TextBox[];
        customFields?: CustomTextField[];
        customGraphics?: CustomGraphic[];
      } = {};
      try {
        if (typeof data.designData === "string") {
          savedData = JSON.parse(data.designData);
        } else if (data.designData && typeof data.designData === "object") {
          savedData = data.designData;
        }
      } catch (e) {
        console.error("Error parsing designData:", e);
        savedData = {};
      }

      // Ensure all required fields exist - preserve all saved data
      const savedStyles = savedData.styles;
      const completeDesignData = {
        text: savedData.text || {},
        colors: savedData.colors || {},
        graphics: savedData.graphics || {},
        styles: {
          fontSize: {
            heading: savedStyles?.fontSize?.heading ?? 32,
            subheading: savedStyles?.fontSize?.subheading ?? 24,
            body: savedStyles?.fontSize?.body ?? 16,
          },
          spacing: {
            padding: savedStyles?.spacing?.padding ?? 40,
            margin: {
              top: savedStyles?.spacing?.margin?.top ?? 20,
              bottom: savedStyles?.spacing?.margin?.bottom ?? 20,
            },
          },
        },
        // Preserve any other fields that might be in savedData
        ...(savedData.customFields && { customFields: savedData.customFields }),
        ...(savedData.customGraphics && {
          customGraphics: savedData.customGraphics,
        }),
        ...(savedData.shapes && { shapes: savedData.shapes }),
      };

      console.log("Loading saved design data:", completeDesignData); // Debug log
      setDesignData(completeDesignData);

      // Load custom fields - ensure they're properly restored
      if (savedData.customFields && Array.isArray(savedData.customFields)) {
        setCustomFields(savedData.customFields);
      } else if (
        completeDesignData.customFields &&
        Array.isArray(completeDesignData.customFields)
      ) {
        setCustomFields(completeDesignData.customFields);
      } else {
        setCustomFields([]);
      }

      // Load custom graphics - ensure they're properly restored
      if (savedData.customGraphics && Array.isArray(savedData.customGraphics)) {
        setCustomGraphics(savedData.customGraphics);
      } else if (
        completeDesignData.customGraphics &&
        Array.isArray(completeDesignData.customGraphics)
      ) {
        setCustomGraphics(completeDesignData.customGraphics);
      } else {
        setCustomGraphics([]);
      }

      // Load shapes - ensure they're properly restored
      if (savedData.shapes && Array.isArray(savedData.shapes)) {
        setShapes(savedData.shapes);
      } else {
        setShapes([]);
      }

      // Load text boxes - ensure they're properly restored
      if (savedData.textBoxes && Array.isArray(savedData.textBoxes)) {
        setTextBoxes(savedData.textBoxes);
      } else {
        setTextBoxes([]);
      }

      // Fetch template if design has one (but don't overwrite saved data)
      if (data.templateId) {
        // Fetch template inline to avoid circular dependency
        try {
          const templateResponse = await fetch(
            `/api/invitations/templates/${data.templateId}`
          );
          if (templateResponse.ok) {
            const templateData = await templateResponse.json();
            setTemplate(templateData);
          }
        } catch (err) {
          console.error("Error fetching template:", err);
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (error: unknown) {
      console.error("Error fetching design:", error);
      if (error instanceof Error && error.name === "AbortError") {
        alert("Request timed out. Please try again.");
      } else {
        alert("Failed to load design. Please try again.");
      }
      setLoading(false);
    }
  }, [designId]);

  const fetchTemplate = useCallback(
    async (id?: string, preserveSavedData: boolean = false) => {
      const templateIdToFetch = id || templateId;
      if (!templateIdToFetch) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(
          `/api/invitations/templates/${templateIdToFetch}`,
          {
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Failed to fetch template: ${response.statusText}`);
        }

        const data = await response.json();
        setTemplate(data);

        // If preserving saved data (loading existing design), don't overwrite it
        if (preserveSavedData) {
          // Just set the template, keep existing designData
          setLoading(false);
          return;
        }

        // Initialize design data with template defaults if not editing existing design
        // OR if we're changing template for existing design (templateId prop is set but different from existing)
        const isChangingTemplate =
          existingDesign &&
          templateId &&
          existingDesign.templateId !== templateId;

        if ((!existingDesign || isChangingTemplate) && data.config) {
          const config = data.config as TemplateConfig;
          // If changing template, merge existing data with new template defaults
          const newDesignData = {
            text:
              config.textFields?.reduce((acc, field) => {
                // Keep existing text if changing template, otherwise use default
                acc[field.id] =
                  isChangingTemplate && designData.text?.[field.id]
                    ? designData.text[field.id]
                    : field.default || "";
                return acc;
              }, {} as Record<string, string>) || {},
            colors: isChangingTemplate
              ? { ...config.colors, ...designData.colors } // Merge colors
              : config.colors || {},
            graphics:
              config.graphics?.reduce((acc, graphic) => {
                acc[graphic.id] = graphic.url;
                return acc;
              }, {} as Record<string, string>) || {},
            styles:
              isChangingTemplate && designData.styles
                ? designData.styles // Keep existing styles when changing template
                : {
                    fontSize: { heading: 32, subheading: 24, body: 16 },
                    spacing: { padding: 40, margin: { top: 20, bottom: 20 } },
                  },
          };
          setDesignData(newDesignData);
        }
      } catch (error: unknown) {
        console.error("Error fetching template:", error);
        if (error instanceof Error && error.name === "AbortError") {
          alert("Request timed out. Please try again.");
        } else {
          alert("Failed to load template. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [templateId, existingDesign, designData]
  );

  useEffect(() => {
    if (designId) {
      fetchDesign();
    } else if (templateId) {
      fetchTemplate();
    } else {
      // Blank template - no template, start from scratch
      setLoading(false);
      // Initialize with empty design data
      setDesignData({
        text: {},
        colors: {
          primary: "#9333ea",
          secondary: "#ec4899",
          background: "#ffffff",
          text: "#111827",
        },
        graphics: {},
        styles: {
          fontSize: { heading: 32, subheading: 24, body: 16 },
          spacing: { padding: 40, margin: { top: 20, bottom: 20 } },
        },
      });
    }
  }, [templateId, designId, fetchDesign, fetchTemplate]);

  const handleTextChange = (fieldId: string, value: string) => {
    setDesignData({
      ...designData,
      text: {
        ...designData.text,
        [fieldId]: value,
      },
    });
  };

  const handleColorChange = (colorKey: string, value: string) => {
    setDesignData({
      ...designData,
      colors: {
        ...designData.colors,
        [colorKey]: value,
      },
    });
  };

  const handleStyleChange = (stylePath: string, value: number) => {
    const [category, key, subKey] = stylePath.split(".");
    const currentStyles = designData.styles || {
      fontSize: { heading: 32, subheading: 24, body: 16 },
      spacing: { padding: 40, margin: { top: 20, bottom: 20 } },
    };

    if (category === "fontSize" && key && subKey) {
      setDesignData({
        ...designData,
        styles: {
          ...currentStyles,
          fontSize: {
            ...currentStyles.fontSize,
            [subKey]: value,
          },
        },
      });
    } else if (category === "spacing" && key) {
      if (subKey) {
        setDesignData({
          ...designData,
          styles: {
            ...currentStyles,
            spacing: {
              ...currentStyles.spacing,
              margin: {
                ...currentStyles.spacing.margin,
                [subKey]: value,
              },
            },
          },
        });
      } else {
        setDesignData({
          ...designData,
          styles: {
            ...currentStyles,
            spacing: {
              ...currentStyles.spacing,
              [key]: value,
            },
          },
        });
      }
    }
  };

  const addCustomTextField = () => {
    if (!newFieldLabel.trim()) {
      alert("Please enter a field label");
      return;
    }

    const newField: CustomTextField = {
      id: `custom_${Date.now()}`,
      label: newFieldLabel,
      value: "",
      placeholder: newFieldPlaceholder || "Enter text...",
    };

    setCustomFields([...customFields, newField]);
    setDesignData({
      ...designData,
      text: {
        ...designData.text,
        [newField.id]: "",
      },
    });

    // Reset form
    setNewFieldLabel("");
    setNewFieldPlaceholder("");
    setShowAddField(false);
  };

  const removeCustomTextField = (fieldId: string) => {
    setCustomFields(customFields.filter((f) => f.id !== fieldId));
    const newText = { ...designData.text };
    delete newText[fieldId];
    setDesignData({
      ...designData,
      text: newText,
    });
  };

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setCustomFields(
      customFields.map((f) => (f.id === fieldId ? { ...f, value } : f))
    );
    handleTextChange(fieldId, value);
  };

  const handleGraphicUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("eventId", eventId);
      formData.append("type", "invitation");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload graphic");
      }

      const { url } = await response.json();

      const newGraphic: CustomGraphic = {
        id: `graphic_${Date.now()}`,
        url,
        type: file.type.startsWith("image/") ? "image" : "icon",
      };

      setCustomGraphics([...customGraphics, newGraphic]);
      setDesignData({
        ...designData,
        graphics: {
          ...designData.graphics,
          [newGraphic.id]: url,
        },
      });
    } catch (error) {
      console.error("Error uploading graphic:", error);
      alert("Failed to upload graphic. Please try again.");
    }
  };

  const removeCustomGraphic = (graphicId: string) => {
    setCustomGraphics(customGraphics.filter((g) => g.id !== graphicId));
    const newGraphics = { ...designData.graphics };
    delete newGraphics[graphicId];
    setDesignData({
      ...designData,
      graphics: newGraphics,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = designId
        ? `/api/invitations/designs/${designId}`
        : `/api/invitations/designs`;
      const method = designId ? "PATCH" : "POST";

      // Include custom fields, graphics, and shapes in design data
      const saveData = {
        ...designData,
        customFields,
        customGraphics,
        shapes,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          templateId: existingDesign?.templateId || templateId || null,
          designData: saveData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save design");
      }

      onSave();
    } catch (error) {
      console.error("Error saving design:", error);
      alert("Failed to save design. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const config = template?.config;
  const allColors = (config?.colors || {}) as TemplateConfig["colors"];

  // Enhanced color categories
  const themeColors = {
    primary: allColors?.primary || "#9333ea",
    secondary: allColors?.secondary || "#ec4899",
    accent: allColors?.accent || allColors?.secondary || "#ec4899",
  };

  const textColors = {
    heading: allColors?.heading || allColors?.text || "#111827",
    body: allColors?.body || allColors?.text || "#111827",
    text: allColors?.text || "#111827",
  };

  const backgroundColors = {
    background: allColors?.background || "#ffffff",
  };

  // Merge with user's custom colors
  const currentThemeColors = {
    primary: designData.colors?.primary || themeColors.primary,
    secondary: designData.colors?.secondary || themeColors.secondary,
    accent: designData.colors?.accent || themeColors.accent,
  };

  const currentTextColors = {
    heading: designData.colors?.heading || textColors.heading,
    body: designData.colors?.body || textColors.body,
    text: designData.colors?.text || textColors.text,
  };

  const currentBackgroundColors = {
    background: designData.colors?.background || backgroundColors.background,
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
      {/* Editor Panel */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Customize Your Invitation
          </h2>
          {existingDesign && template && onChangeTemplate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onChangeTemplate}
              title="Change template for this design"
            >
              Change Template
            </Button>
          )}
        </div>

        {/* Text Fields - Template Fields */}
        {config?.textFields && config.textFields.length > 0 && (
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Text Content</h3>
            </div>
            {config.textFields.map((field) => (
              <div key={field.id}>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                </div>
                <Input
                  type="text"
                  value={designData.text[field.id] || ""}
                  onChange={(e) => handleTextChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>
        )}

        {/* Custom Text Fields */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">
              Additional Text Fields
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddField(!showAddField)}
            >
              {showAddField ? "Cancel" : "+ Add Field"}
            </Button>
          </div>

          {showAddField && (
            <Card className="p-4 bg-gray-50 border-2 border-dashed border-gray-300">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Label
                  </label>
                  <Input
                    type="text"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    placeholder="e.g., Special Instructions"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Placeholder Text (optional)
                  </label>
                  <Input
                    type="text"
                    value={newFieldPlaceholder}
                    onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                    placeholder="Enter text..."
                  />
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={addCustomTextField}
                  className="w-full"
                >
                  Add Field
                </Button>
              </div>
            </Card>
          )}

          {customFields.map((field) => (
            <div key={field.id} className="relative">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                </label>
                <button
                  onClick={() => removeCustomTextField(field.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                  type="button"
                >
                  Remove
                </button>
              </div>
              <Input
                type="text"
                value={field.value}
                onChange={(e) =>
                  handleCustomFieldChange(field.id, e.target.value)
                }
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>

        {/* Colors Section - Reorganized with clear labels */}
        <div className="space-y-6 mb-6 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Colors & Styling
          </h3>

          {/* Background Color */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Background Color
            </label>
            <p className="text-xs text-gray-500 mb-2">
              The background color of the entire invitation card
            </p>
            <div className="flex gap-2">
              <input
                type="color"
                value={currentBackgroundColors.background}
                onChange={(e) =>
                  handleColorChange("background", e.target.value)
                }
                className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <Input
                type="text"
                value={currentBackgroundColors.background}
                onChange={(e) =>
                  handleColorChange("background", e.target.value)
                }
                className="flex-1"
                placeholder="#ffffff"
              />
            </div>
          </div>

          {/* Text Colors - Clear labels with font sizes */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-800 mt-4">
              Text Colors & Sizes
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Couple Names (Primary)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Color and size for the main heading (e.g., &quot;Bride &amp;
                  Groom&quot;)
                </p>
                <div className="flex gap-2 items-end">
                  <input
                    type="color"
                    value={currentThemeColors.primary}
                    onChange={(e) =>
                      handleColorChange("primary", e.target.value)
                    }
                    className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={currentThemeColors.primary}
                    onChange={(e) =>
                      handleColorChange("primary", e.target.value)
                    }
                    className="flex-1"
                    placeholder="#9333ea"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 whitespace-nowrap">
                      Size:
                    </label>
                    <Input
                      type="number"
                      min="12"
                      max="72"
                      value={designData.styles?.fontSize?.heading || 32}
                      onChange={(e) =>
                        handleStyleChange(
                          "fontSize.heading",
                          parseInt(e.target.value) || 32
                        )
                      }
                      className="w-20"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Subheading
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Color and size for date, venue, and subheadings
                </p>
                <div className="flex gap-2 items-end">
                  <input
                    type="color"
                    value={currentTextColors.heading}
                    onChange={(e) =>
                      handleColorChange("heading", e.target.value)
                    }
                    className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={currentTextColors.heading}
                    onChange={(e) =>
                      handleColorChange("heading", e.target.value)
                    }
                    className="flex-1"
                    placeholder="#111827"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 whitespace-nowrap">
                      Size:
                    </label>
                    <Input
                      type="number"
                      min="12"
                      max="48"
                      value={designData.styles?.fontSize?.subheading || 24}
                      onChange={(e) =>
                        handleStyleChange(
                          "fontSize.subheading",
                          parseInt(e.target.value) || 24
                        )
                      }
                      className="w-20"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Body Text
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Color and size for description and message text
                </p>
                <div className="flex gap-2 items-end">
                  <input
                    type="color"
                    value={currentTextColors.body}
                    onChange={(e) => handleColorChange("body", e.target.value)}
                    className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={currentTextColors.body}
                    onChange={(e) => handleColorChange("body", e.target.value)}
                    className="flex-1"
                    placeholder="#4b5563"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 whitespace-nowrap">
                      Size:
                    </label>
                    <Input
                      type="number"
                      min="10"
                      max="24"
                      value={designData.styles?.fontSize?.body || 16}
                      onChange={(e) =>
                        handleStyleChange(
                          "fontSize.body",
                          parseInt(e.target.value) || 16
                        )
                      }
                      className="w-20"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Accent Color
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Color for decorative elements and dividers
                </p>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={currentThemeColors.secondary}
                    onChange={(e) =>
                      handleColorChange("secondary", e.target.value)
                    }
                    className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={currentThemeColors.secondary}
                    onChange={(e) =>
                      handleColorChange("secondary", e.target.value)
                    }
                    className="flex-1"
                    placeholder="#ec4899"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spacing Settings - Clear labels */}
        <div className="space-y-6 mb-6 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spacing</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Padding
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Space around the edges of the invitation card
              </p>
              <Input
                type="number"
                min="0"
                max="100"
                value={designData.styles?.spacing?.padding || 40}
                onChange={(e) =>
                  handleStyleChange(
                    "spacing.padding",
                    parseInt(e.target.value) || 40
                  )
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Top Spacing
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Space above headings and main elements
              </p>
              <Input
                type="number"
                min="0"
                max="100"
                value={designData.styles?.spacing?.margin?.top || 20}
                onChange={(e) =>
                  handleStyleChange(
                    "spacing.margin.top",
                    parseInt(e.target.value) || 20
                  )
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bottom Spacing
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Space below headings and main elements
              </p>
              <Input
                type="number"
                min="0"
                max="100"
                value={designData.styles?.spacing?.margin?.bottom || 20}
                onChange={(e) =>
                  handleStyleChange(
                    "spacing.margin.bottom",
                    parseInt(e.target.value) || 20
                  )
                }
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Text Boxes - Only for blank template */}
        {!template && (
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Text Boxes</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newTextBox: TextBox = {
                    id: `textbox_${Date.now()}`,
                    text: "Double-click to edit",
                    position: { x: 50, y: 50 },
                    size: { width: 200, height: 60 },
                    fontSize: 16,
                    color: "#111827",
                    hasFill: false,
                    textAlign: "left",
                  };
                  setTextBoxes([...textBoxes, newTextBox]);
                  setSelectedTextBoxId(newTextBox.id);
                }}
              >
                Add Text Box
              </Button>
            </div>

            {textBoxes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Added Text Boxes:
                </p>
                <div className="flex flex-wrap gap-2">
                  {textBoxes.map((textBox) => (
                    <div
                      key={textBox.id}
                      className={`p-2 border rounded-lg cursor-pointer ${
                        selectedTextBoxId === textBox.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200"
                      }`}
                      onClick={() => setSelectedTextBoxId(textBox.id)}
                    >
                      <div className="w-16 h-12 flex items-center justify-center bg-gray-50 rounded text-xs text-gray-600 overflow-hidden">
                        {textBox.text.substring(0, 20) || "Empty"}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate w-20">
                        Text Box
                      </p>
                    </div>
                  ))}
                </div>
                {selectedTextBoxId && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    {(() => {
                      const selectedTextBox = textBoxes.find(
                        (tb) => tb.id === selectedTextBoxId
                      );
                      if (!selectedTextBox) return null;
                      return (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Text Color
                            </label>
                            <input
                              type="color"
                              value={selectedTextBox.color}
                              onChange={(e) => {
                                const updated = textBoxes.map((tb) =>
                                  tb.id === selectedTextBoxId
                                    ? { ...tb, color: e.target.value }
                                    : tb
                                );
                                setTextBoxes(updated);
                              }}
                              className="w-full h-8 rounded border border-gray-300"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Font Size
                            </label>
                            <input
                              type="number"
                              value={selectedTextBox.fontSize}
                              onChange={(e) => {
                                const updated = textBoxes.map((tb) =>
                                  tb.id === selectedTextBoxId
                                    ? {
                                        ...tb,
                                        fontSize:
                                          parseInt(e.target.value) || 16,
                                      }
                                    : tb
                                );
                                setTextBoxes(updated);
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              min="8"
                              max="72"
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                              <input
                                type="checkbox"
                                checked={selectedTextBox.hasFill}
                                onChange={(e) => {
                                  const updated = textBoxes.map((tb) =>
                                    tb.id === selectedTextBoxId
                                      ? { ...tb, hasFill: e.target.checked }
                                      : tb
                                  );
                                  setTextBoxes(updated);
                                }}
                              />
                              Fill Background
                            </label>
                          </div>
                          {selectedTextBox.hasFill && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Background Color
                              </label>
                              <input
                                type="color"
                                value={
                                  selectedTextBox.backgroundColor || "#ffffff"
                                }
                                onChange={(e) => {
                                  const updated = textBoxes.map((tb) =>
                                    tb.id === selectedTextBoxId
                                      ? {
                                          ...tb,
                                          backgroundColor: e.target.value,
                                        }
                                      : tb
                                  );
                                  setTextBoxes(updated);
                                }}
                                className="w-full h-8 rounded border border-gray-300"
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Text Align
                            </label>
                            <select
                              value={selectedTextBox.textAlign || "left"}
                              onChange={(e) => {
                                const updated = textBoxes.map((tb) =>
                                  tb.id === selectedTextBoxId
                                    ? {
                                        ...tb,
                                        textAlign: e.target.value as
                                          | "left"
                                          | "center"
                                          | "right",
                                      }
                                    : tb
                                );
                                setTextBoxes(updated);
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Width
                              </label>
                              <input
                                type="number"
                                value={selectedTextBox.size.width}
                                onChange={(e) => {
                                  const updated = textBoxes.map((tb) =>
                                    tb.id === selectedTextBoxId
                                      ? {
                                          ...tb,
                                          size: {
                                            ...tb.size,
                                            width:
                                              parseInt(e.target.value) || 200,
                                          },
                                        }
                                      : tb
                                  );
                                  setTextBoxes(updated);
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                min="100"
                                max="500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Height
                              </label>
                              <input
                                type="number"
                                value={selectedTextBox.size.height}
                                onChange={(e) => {
                                  const updated = textBoxes.map((tb) =>
                                    tb.id === selectedTextBoxId
                                      ? {
                                          ...tb,
                                          size: {
                                            ...tb.size,
                                            height:
                                              parseInt(e.target.value) || 60,
                                          },
                                        }
                                      : tb
                                  );
                                  setTextBoxes(updated);
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                min="40"
                                max="300"
                              />
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTextBoxes(
                                textBoxes.filter(
                                  (tb) => tb.id !== selectedTextBoxId
                                )
                              );
                              setSelectedTextBoxId(null);
                            }}
                            className="w-full text-red-600 hover:text-red-700"
                          >
                            Remove Text Box
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Shapes & Symbols */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Shapes & Symbols</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShapesLibrary(!showShapesLibrary)}
            >
              {showShapesLibrary ? "Hide Library" : "Add Shapes"}
            </Button>
          </div>

          {showShapesLibrary && (
            <ShapesLibrary
              onSelectShape={(shape) => {
                const newShape: DesignShape = {
                  id: `shape_${Date.now()}`,
                  name: shape.name,
                  svgPath: shape.svgPath,
                  color: shape.defaultColor,
                  position: { x: 50, y: 50 },
                  size: { width: 60, height: 60 },
                };
                setShapes([...shapes, newShape]);
                setSelectedShapeId(newShape.id);
                setShowShapesLibrary(false);
              }}
              onClose={() => setShowShapesLibrary(false)}
            />
          )}

          {shapes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Added Shapes:</p>
              <div className="flex flex-wrap gap-2">
                {shapes.map((shape) => (
                  <div
                    key={shape.id}
                    className={`p-2 border rounded-lg cursor-pointer ${
                      selectedShapeId === shape.id
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200"
                    }`}
                    onClick={() => setSelectedShapeId(shape.id)}
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 100 100"
                        style={{ color: shape.color }}
                      >
                        <g
                          dangerouslySetInnerHTML={{ __html: shape.svgPath }}
                        />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 truncate w-16">
                      {shape.name}
                    </p>
                  </div>
                ))}
              </div>
              {selectedShapeId && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  {(() => {
                    const selectedShape = shapes.find(
                      (s) => s.id === selectedShapeId
                    );
                    if (!selectedShape) return null;
                    return (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Color
                          </label>
                          <input
                            type="color"
                            value={selectedShape.color}
                            onChange={(e) => {
                              const updated = shapes.map((s) =>
                                s.id === selectedShapeId
                                  ? { ...s, color: e.target.value }
                                  : s
                              );
                              setShapes(updated);
                            }}
                            className="w-full h-8 rounded border border-gray-300"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Width
                            </label>
                            <input
                              type="number"
                              value={selectedShape.size.width}
                              onChange={(e) => {
                                const updated = shapes.map((s) =>
                                  s.id === selectedShapeId
                                    ? {
                                        ...s,
                                        size: {
                                          ...s.size,
                                          width: parseInt(e.target.value) || 60,
                                        },
                                      }
                                    : s
                                );
                                setShapes(updated);
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              min="20"
                              max="200"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Height
                            </label>
                            <input
                              type="number"
                              value={selectedShape.size.height}
                              onChange={(e) => {
                                const updated = shapes.map((s) =>
                                  s.id === selectedShapeId
                                    ? {
                                        ...s,
                                        size: {
                                          ...s.size,
                                          height:
                                            parseInt(e.target.value) || 60,
                                        },
                                      }
                                    : s
                                );
                                setShapes(updated);
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              min="20"
                              max="200"
                            />
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShapes(
                              shapes.filter((s) => s.id !== selectedShapeId)
                            );
                            setSelectedShapeId(null);
                          }}
                          className="w-full text-red-600 hover:text-red-700"
                        >
                          Remove Shape
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Graphics Management */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Graphics & Icons</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGraphicsManager(!showGraphicsManager)}
            >
              {showGraphicsManager ? "Hide" : "Manage Graphics"}
            </Button>
          </div>

          {showGraphicsManager && (
            <Card className="p-4 bg-gray-50 border-2 border-dashed border-gray-300">
              <div className="space-y-4">
                {/* Upload Graphic */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Custom Graphic
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleGraphicUpload(file);
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Upload PNG, JPG, or SVG images
                  </p>
                </div>

                {/* Custom Graphics List */}
                {customGraphics.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Your Graphics:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {customGraphics.map((graphic) => (
                        <div key={graphic.id} className="relative group">
                          <img
                            src={graphic.url}
                            alt="Graphic"
                            className="w-full h-20 object-cover rounded border border-gray-300"
                          />
                          <button
                            onClick={() => removeCustomGraphic(graphic.id)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                            type="button"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Template Graphics */}
                {config?.graphics && config.graphics.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Template Graphics:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {config.graphics.map((graphic) => (
                        <div key={graphic.id} className="relative">
                          <img
                            src={graphic.url}
                            alt="Graphic"
                            className="w-full h-20 object-cover rounded border border-gray-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={saving}
            disabled={saving}
            className="w-full sm:flex-1"
          >
            Save Design
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full sm:flex-1"
          >
            Cancel
          </Button>
        </div>
      </Card>

      {/* Preview Panel */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Live Preview</h2>
        {existingDesign?.customImage ? (
          // Show custom uploaded image
          <div className="aspect-[4/5] bg-white rounded-lg overflow-hidden border-2 border-gray-200">
            <img
              src={existingDesign.customImage}
              alt={existingDesign.name || "Custom Invitation"}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          // Template-based or blank template live preview with shapes overlay
          <div className="relative" ref={previewContainerRef}>
            <InvitationPreview
              templateType={template?.name || "blank"}
              config={config}
              designData={designData}
            />
            {/* Shapes Overlay */}
            {shapes.length > 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 10 }}
              >
                {shapes.map((shape) => (
                  <EditableShape
                    key={shape.id}
                    shape={shape}
                    isSelected={selectedShapeId === shape.id}
                    onSelect={() => {
                      setSelectedShapeId(shape.id);
                      setSelectedTextBoxId(null);
                    }}
                    onUpdate={(updates) => {
                      const updated = shapes.map((s) =>
                        s.id === shape.id ? { ...s, ...updates } : s
                      );
                      setShapes(updated);
                    }}
                    onDelete={() => {
                      setShapes(shapes.filter((s) => s.id !== shape.id));
                      if (selectedShapeId === shape.id) {
                        setSelectedShapeId(null);
                      }
                    }}
                    containerRef={previewContainerRef}
                  />
                ))}
              </div>
            )}
            {/* Text Boxes Overlay - Only for blank template */}
            {!template && textBoxes.length > 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 11 }}
              >
                {textBoxes.map((textBox) => (
                  <EditableTextBox
                    key={textBox.id}
                    textBox={textBox}
                    isSelected={selectedTextBoxId === textBox.id}
                    onSelect={() => {
                      setSelectedTextBoxId(textBox.id);
                      setSelectedShapeId(null);
                    }}
                    onUpdate={(updates) => {
                      const updated = textBoxes.map((tb) =>
                        tb.id === textBox.id ? { ...tb, ...updates } : tb
                      );
                      setTextBoxes(updated);
                    }}
                    onDelete={() => {
                      setTextBoxes(
                        textBoxes.filter((tb) => tb.id !== textBox.id)
                      );
                      if (selectedTextBoxId === textBox.id) {
                        setSelectedTextBoxId(null);
                      }
                    }}
                    containerRef={previewContainerRef}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {existingDesign?.customImage && (
          <p className="mt-4 text-sm text-gray-600 text-center">
            Custom uploaded design
          </p>
        )}
      </Card>
    </div>
  );
}
