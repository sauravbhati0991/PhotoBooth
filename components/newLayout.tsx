"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Trash2, Lock, Unlock, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Plus, 
  Image as ImageIcon, Type, Save, ZoomIn, ZoomOut,
  Undo2, Redo2, Maximize, Square, PanelLeftOpen, Layers, Settings2, X, Menu, ChevronUp, ChevronDown
} from "lucide-react";
import CustomModal from "./customModal";

type ElementType = "image" | "placeholder" | "text";

type LayoutElement = {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  src?: string;       // For image elements
  text?: string;      // For text elements
  isLocked?: boolean;
};

type NewLayoutProps = {
  templateId?: string;
};

export default function NewLayout({ templateId }: NewLayoutProps) {
  const router = useRouter();
  const isEditMode = !!templateId;

  // Template settings
  const [layoutName, setLayoutName] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [printSecondary, setPrintSecondary] = useState(false);
  const [paperSize, setPaperSize] = useState("4x6"); // Default to 4x6

  // Canvas elements state
  const [elements, setElements] = useState<LayoutElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // History for undo/redo
  const [history, setHistory] = useState<LayoutElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Layout editor visual settings
  const [zoom, setZoom] = useState(30); // scale percentage
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Mobile responsive state
  const [mobilePanel, setMobilePanel] = useState(false);
  const [activeTab, setActiveTab] = useState<"template" | "layers" | "properties">("template");
  const [mobileToolbarExpanded, setMobileToolbarExpanded] = useState(false);

  // Property inputs (tied to selected element)
  const [propX, setPropX] = useState("0");
  const [propY, setPropY] = useState("0");
  const [propW, setPropW] = useState("100");
  const [propH, setPropH] = useState("100");
  const [keepAspect, setKeepAspect] = useState(false);
  const [textVal, setTextVal] = useState("Sample Text");

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartSize, setResizeStartSize] = useState({ width: 100, height: 100 });
  const [resizeStartMouse, setResizeStartMouse] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  // Custom Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "alert" | "confirm";
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: "alert",
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showAlert = (title: string, message: string) => {
    setModalState({
      isOpen: true,
      type: "alert",
      title,
      message,
      onConfirm: () => setModalState(prev => ({ ...prev, isOpen: false })),
    });
  };

  const showConfirm = (title: string, message: string, onConfirmAction: () => void) => {
    setModalState({
      isOpen: true,
      type: "confirm",
      title,
      message,
      onConfirm: () => {
        onConfirmAction();
        setModalState(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const closeDialog = () => setModalState(prev => ({ ...prev, isOpen: false }));

  // Continuous movement timers & refs
  const moveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasMovedRef = useRef(false);
  const latestElementsRef = useRef(elements);

  useEffect(() => {
    latestElementsRef.current = elements;
  }, [elements]);

  const startContinuousMove = (dx: number, dy: number) => {
    stopContinuousMove();
    hasMovedRef.current = false;

    const nudge = () => {
      setElements(prev => {
        let updated = false;
        const nextElements = prev.map(item => {
          if (item.id === selectedId) {
            const targetX = Math.max(0, Math.min(1200 - item.width, item.x + dx));
            const targetY = Math.max(0, Math.min(1800 - item.height, item.y + dy));
            setPropX(targetX.toString());
            setPropY(targetY.toString());
            if (targetX !== item.x || targetY !== item.y) {
              updated = true;
            }
            return { ...item, x: targetX, y: targetY };
          }
          return item;
        });
        if (updated) {
          hasMovedRef.current = true;
        }
        return nextElements;
      });
    };

    nudge();

    moveTimeoutRef.current = setTimeout(() => {
      moveIntervalRef.current = setInterval(nudge, 40);
    }, 300);
  };

  const stopContinuousMove = () => {
    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current);
      moveTimeoutRef.current = null;
    }
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }
    if (hasMovedRef.current) {
      pushHistory(latestElementsRef.current);
      hasMovedRef.current = false;
    }
  };

  useEffect(() => {
    return () => {
      if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
      if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
    };
  }, []);

  // Fetch existing template in edit mode
  useEffect(() => {
    if (templateId) {
      const fetchTemplate = async () => {
        try {
          const res = await fetch(`/api/layouts/${templateId}`);
          if (!res.ok) throw new Error("Failed to fetch template");
          const data = await res.json();
          setLayoutName(data.name || "");
          setPrice(data.price ?? null);
          setPaperSize("4x6");
          const fetchedElements: LayoutElement[] = (data.elements || []).map((el: any) => ({
            id: el.id || Math.random().toString(36).substring(2, 9),
            type: el.type,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            src: el.src,
            text: el.text,
            isLocked: el.isLocked || false,
          }));
          setElements(fetchedElements);
          setHistory([fetchedElements]);
          setHistoryIndex(0);
        } catch (err) {
          console.error(err);
          showAlert("Error", "Failed to load template for editing.");
          setHistory([[]]);
          setHistoryIndex(0);
        }
      };
      fetchTemplate();
    } else {
      // Initialize history for new template
      setHistory([[]]);
      setHistoryIndex(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  const pushHistory = (newElements: LayoutElement[]) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    setHistory([...nextHistory, newElements]);
    setHistoryIndex(nextHistory.length);
    setElements(newElements);
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
      setSelectedId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
      setSelectedId(null);
    }
  };

  // Sync property panel inputs when selection changes or element updates
  const selectedElement = elements.find(el => el.id === selectedId);
  useEffect(() => {
    if (selectedElement) {
      setPropX(selectedElement.x.toString());
      setPropY(selectedElement.y.toString());
      setPropW(selectedElement.width.toString());
      setPropH(selectedElement.height.toString());
      if (selectedElement.type === "text") {
        setTextVal(selectedElement.text || "");
      }
    }
  }, [selectedId, selectedElement]);

  // Add a new element
  const addElement = (type: ElementType, customProps: Partial<LayoutElement> = {}) => {
    if (paperSize !== "4x6") {
      showAlert("Canvas Size Required", "Please select 4x6 Canvas Size first!");
      return;
    }
    const finalW = Math.max(10, Math.min(1200, customProps.width ?? (type === "placeholder" ? 300 : type === "text" ? 200 : 300)));
    const finalH = Math.max(10, Math.min(1800, customProps.height ?? (type === "placeholder" ? 300 : type === "text" ? 50 : 300)));
    const finalX = Math.max(0, Math.min(1200 - finalW, customProps.x ?? 100));
    const finalY = Math.max(0, Math.min(1800 - finalH, customProps.y ?? 100));

    const newElement: LayoutElement = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      x: finalX,
      y: finalY,
      width: finalW,
      height: finalH,
      isLocked: false,
      src: customProps.src,
      text: customProps.text
    };

    const updated = [...elements, newElement];
    pushHistory(updated);
    setSelectedId(newElement.id);
  };

  // Add image helper
  const handleImageUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      // Get image dimensions to set initial sizing
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        
        // Fit within 600px width/height max bounds while keeping aspect ratio
        const maxWidth = 600;
        const maxHeight = 900;
        
        if (w > maxWidth || h > maxHeight) {
          const ratio = w / h;
          if (ratio > maxWidth / maxHeight) {
            w = maxWidth;
            h = Math.round(maxWidth / ratio);
          } else {
            h = maxHeight;
            w = Math.round(maxHeight * ratio);
          }
        }

        addElement("image", {
          src,
          width: w,
          height: h
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // clear file input
  };

  // Mouse Drag Event Handlers
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const el = elements.find(item => item.id === id);
    if (!el) return;

    setSelectedId(id);

    if (el.isLocked) return;

    setIsDragging(true);

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scale = zoom / 100;
      // Click coordinate on canvas scale
      const clickX = (e.clientX - rect.left) / scale;
      const clickY = (e.clientY - rect.top) / scale;

      setDragOffset({
        x: clickX - el.x,
        y: clickY - el.y
      });
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const el = elements.find(item => item.id === id);
    if (!el || el.isLocked) return;

    setSelectedId(id);
    setIsResizing(true);
    setResizeStartSize({
      width: el.width,
      height: el.height
    });
    setResizeStartMouse({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const scale = zoom / 100;
    
    // Resizing operation
    if (isResizing && selectedId) {
      const el = elements.find(item => item.id === selectedId);
      if (!el || el.isLocked) return;

      const deltaX = (e.clientX - resizeStartMouse.x) / scale;
      const deltaY = (e.clientY - resizeStartMouse.y) / scale;

      let targetW = Math.max(10, Math.round(resizeStartSize.width + deltaX));
      let targetH = Math.max(10, Math.round(resizeStartSize.height + deltaY));

      if (snapToGrid) {
        targetW = Math.round(targetW / 10) * 10;
        targetH = Math.round(targetH / 10) * 10;
      }

      // Constrain size to stay within canvas borders (1200x1800)
      const maxW = Math.min(1200, 1200 - el.x);
      const maxH = Math.min(1800, 1800 - el.y);

      if (keepAspect && el.width > 0) {
        const ratio = el.height / el.width;
        targetW = Math.min(targetW, maxW);
        targetH = Math.round(targetW * ratio);
        if (targetH > maxH) {
          targetH = maxH;
          targetW = Math.round(targetH / ratio);
        }
      } else {
        targetW = Math.min(targetW, maxW);
        targetH = Math.min(targetH, maxH);
      }

      // Final min bounds check
      targetW = Math.max(10, targetW);
      targetH = Math.max(10, targetH);

      setElements(prev => prev.map(item => 
        item.id === selectedId ? { ...item, width: targetW, height: targetH } : item
      ));
      return;
    }

    // Dragging operation
    if (!isDragging || !selectedId || !canvasRef.current) return;
    const el = elements.find(item => item.id === selectedId);
    if (!el || el.isLocked) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) / scale;
    const currentY = (e.clientY - rect.top) / scale;

    let targetX = Math.round(currentX - dragOffset.x);
    let targetY = Math.round(currentY - dragOffset.y);

    if (snapToGrid) {
      targetX = Math.round(targetX / 10) * 10;
      targetY = Math.round(targetY / 10) * 10;
    }

    // Clamp coordinates to stay completely inside canvas borders
    targetX = Math.max(0, Math.min(1200 - el.width, targetX));
    targetY = Math.max(0, Math.min(1800 - el.height, targetY));

    // Update in-place without push history to avoid flooding on drag
    setElements(prev => prev.map(item => 
      item.id === selectedId ? { ...item, x: targetX, y: targetY } : item
    ));
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      pushHistory(elements);
    }
    if (isResizing) {
      setIsResizing(false);
      pushHistory(elements);
    }
  };

  // Helper to move elements from properties arrow buttons
  const moveElementByOffset = (dx: number, dy: number) => {
    if (!selectedId) return;
    const updated = elements.map(item => {
      if (item.id === selectedId) {
        // Enforce canvas constraints
        const targetX = Math.max(0, Math.min(1200 - item.width, item.x + dx));
        const targetY = Math.max(0, Math.min(1800 - item.height, item.y + dy));
        setPropX(targetX.toString());
        setPropY(targetY.toString());
        return { ...item, x: targetX, y: targetY };
      }
      return item;
    });
    pushHistory(updated);
  };

  // Apply inputs properties from right panel
  const handleApplyChanges = () => {
    if (!selectedId) return;
    
    let inputX = Math.round(Number(propX));
    let inputY = Math.round(Number(propY));
    let inputW = Math.round(Number(propW));
    let inputH = Math.round(Number(propH));

    // Clamp sizes (max 1200x1800)
    inputW = Math.max(10, Math.min(1200, inputW));
    inputH = Math.max(10, Math.min(1800, inputH));

    // Clamp coordinates to stay completely inside canvas borders
    inputX = Math.max(0, Math.min(1200 - inputW, inputX));
    inputY = Math.max(0, Math.min(1800 - inputH, inputY));

    const updated = elements.map(el => {
      if (el.id === selectedId) {
        return {
          ...el,
          x: inputX,
          y: inputY,
          width: inputW,
          height: inputH,
          text: el.type === "text" ? textVal : el.text
        };
      }
      return el;
    });
    
    pushHistory(updated);

    // Update form properties with clamped values
    setPropX(inputX.toString());
    setPropY(inputY.toString());
    setPropW(inputW.toString());
    setPropH(inputH.toString());
  };

  // Delete Element
  const handleDeleteElement = (id: string) => {
    const updated = elements.filter(el => el.id !== id);
    pushHistory(updated);
    if (selectedId === id) setSelectedId(null);
  };

  // Lock / Unlock element
  const toggleLock = (id: string) => {
    const updated = elements.map(el => 
      el.id === id ? { ...el, isLocked: !el.isLocked } : el
    );
    pushHistory(updated);
  };

  // Reorder elements (Layers)
  const moveLayer = (id: string, direction: "up" | "down") => {
    const index = elements.findIndex(el => el.id === id);
    if (index === -1) return;
    if (direction === "up" && index === elements.length - 1) return;
    if (direction === "down" && index === 0) return;

    const newElements = [...elements];
    const swapWith = direction === "up" ? index + 1 : index - 1;
    
    // Swap
    const temp = newElements[index];
    newElements[index] = newElements[swapWith];
    newElements[swapWith] = temp;

    pushHistory(newElements);
  };

  // Fit view automatically
  const handleFit = () => {
    if (typeof window !== 'undefined') {
      const vw = window.innerWidth;
      if (vw < 1024) {
        // Mobile/tablet: fit canvas to available width minus padding
        const availW = vw - 32;
        const fitZoom = Math.floor((availW / 1200) * 100);
        setZoom(Math.max(10, Math.min(100, fitZoom)));
      } else {
        setZoom(32);
      }
    } else {
      setZoom(32);
    }
  };

  // Auto-fit zoom on mount for small screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      const availW = window.innerWidth - 32;
      const fitZoom = Math.floor((availW / 1200) * 100);
      setZoom(Math.max(10, Math.min(100, fitZoom)));
    }
  }, []);

  // Save template to DB
  const handleSaveLayout = async () => {
    if (!layoutName) {
      showAlert("Missing Details", "Please enter a Template Name");
      return;
    }
    if (price === null || price === undefined) {
      showAlert("Missing Details", "Please enter a price");
      return;
    }
    if (elements.length === 0) {
      showAlert("Empty Template", "Please add at least one background image or placeholder");
      return;
    }

    setSaving(true);

    try {
      // Validate that layout name doesn't exist (skip in edit mode for same name)
      if (!isEditMode) {
        const existingRes = await fetch("/api/layouts");
        const existingLayouts = await existingRes.json();
        const exists = existingLayouts.some((l: any) => l.name.toLowerCase() === layoutName.toLowerCase());
        if (exists) {
          showAlert("Duplicate Name", "Template name already exists");
          setSaving(false);
          return;
        }
      }

      // Upload base64 image elements to Cloudinary
      const uploadedElements = [...elements];
      for (let i = 0; i < uploadedElements.length; i++) {
        const el = uploadedElements[i];
        if (el.type === "image" && el.src && el.src.startsWith("data:")) {
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: el.src })
          });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) throw new Error(uploadData.error || "Image upload failed");
          uploadedElements[i] = { ...el, src: uploadData.url };
        }
      }

      // Count placeholders
      const placeholderCount = uploadedElements.filter(el => el.type === "placeholder").length;

      // Extract a background image value if available
      const mainImage = uploadedElements.find(el => el.type === "image");
      const bgValue = mainImage ? mainImage.src : "#ffffff";

      const payload = {
        name: layoutName,
        count: placeholderCount,
        rows: 1,
        cols: 1,
        price,
        backgroundType: mainImage ? "image" : "color",
        backgroundValue: bgValue,
        printSecondary,
        elements: uploadedElements
      };

      let res: Response;

      if (isEditMode && templateId) {
        // UPDATE existing template
        res = await fetch(`/api/layouts/${templateId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        // CREATE new template
        res = await fetch("/api/layouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save layout");
      }

      showAlert("Success", isEditMode ? "Template updated successfully!" : "Template saved successfully!");
      setTimeout(() => {
        router.push("/admin");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      showAlert("Error", err.message || "Failed to save layout");
    } finally {
      setSaving(false);
    }
  };

  // ── Shared panel content renderers (used by both desktop sidebars & mobile tabs) ──

  const renderTemplatePanel = () => (
    <div className="flex flex-col gap-5">
      {/* Template Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-white/90 border-b border-white/10 pb-1.5">Template</h3>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/70 font-semibold">Template Name</label>
          <input
            type="text"
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value)}
            className="bg-white/10 border border-white/20 rounded p-2 text-sm text-white focus:outline-none focus:border-white/50 focus:bg-white/15 transition placeholder-white/35"
            placeholder="ex: Wedding Layout"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/70 font-semibold">Template Price (₹)</label>
          <input
            type="number"
            value={price ?? ""}
            onChange={(e) => setPrice(e.target.value === "" ? null : Number(e.target.value))}
            className="bg-white/10 border border-white/20 rounded p-2 text-sm text-white focus:outline-none focus:border-white/50 focus:bg-white/15 transition placeholder-white/35"
            placeholder="ex: 100"
          />
        </div>
      </div>

      <div className="h-px bg-white/10"></div>

      {/* Add Elements Section */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-white/90 border-b border-white/10 pb-1.5">Add Elements</h3>
        {/* Text */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-white/70 font-semibold">Text</span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter text..."
              value={textVal}
              onChange={(e) => setTextVal(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/50 focus:bg-white/15 transition placeholder-white/35"
            />
            <button
              onClick={() => addElement("text", { text: textVal })}
              className="bg-white text-purple-600 hover:bg-purple-50 hover:scale-105 active:scale-95 transition-all p-1.5 rounded flex items-center justify-center shrink-0 cursor-pointer shadow-md"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        {/* Image */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-white/70 font-semibold">Image</span>
          <button
            onClick={handleImageUploadClick}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs py-2 rounded flex items-center justify-center gap-1.5 transition text-white cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <ImageIcon size={14} />
            Add Image
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
          <button
            onClick={() => showAlert("Coming Soon", "Asset Library is coming soon!")}
            className="w-full bg-white/5 border border-dashed border-white/15 text-xs py-2 rounded flex items-center justify-center gap-1.5 transition text-white/40 cursor-not-allowed"
          >
            Import to Assets
          </button>
        </div>
        {/* Placeholders */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-white/70 font-semibold">Placeholders</span>
          <button
            onClick={() => addElement("placeholder")}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs py-2 rounded flex items-center justify-center gap-1.5 transition text-white cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <Square size={14} className="text-pink-300" />
            Photo Placeholder
          </button>
          <button
            onClick={() => showAlert("Coming Soon", "Text placeholders are coming soon!")}
            className="w-full bg-white/5 border border-dashed border-white/15 text-xs py-2 rounded flex items-center justify-center gap-1.5 transition text-white/40 cursor-not-allowed"
          >
            Text Placeholder
          </button>
        </div>
      </div>
    </div>
  );

  const renderLayersPanel = () => (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-white/90 border-b border-white/10 pb-1.5">Layers</h3>
      <div className="bg-white/10 border border-white/20 rounded-lg min-h-[120px] max-h-[220px] overflow-y-auto flex flex-col custom-scrollbar">
        {elements.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-white/50 italic py-6">No layers</div>
        ) : (
          [...elements].reverse().map((el) => {
            const isLayerSelected = el.id === selectedId;
            return (
              <div
                key={el.id}
                onClick={() => setSelectedId(el.id)}
                className={`flex items-center justify-between px-3 py-2 text-xs border-b border-white/10 cursor-pointer transition ${isLayerSelected ? "bg-white/25 text-white font-bold" : "text-white/80 hover:bg-white/5"}`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-[9px] text-white/40 uppercase tracking-tighter shrink-0">{el.type}</span>
                  <span className="truncate">{el.type === "text" ? el.text : el.type === "placeholder" ? "Photo Frame" : "Uploaded Image"}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => toggleLock(el.id)} className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition">
                    {el.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                  </button>
                  <button onClick={() => handleDeleteElement(el.id)} className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-red-300 transition">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Reorder and Actions */}
      {selectedId && (
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-white/50 font-semibold">Reorder</span>
            <div className="flex gap-1.5">
              <button onClick={() => moveLayer(selectedId, "up")} className="flex-1 bg-white/10 hover:bg-white/20 text-[10px] py-1 rounded text-white flex items-center justify-center gap-1 border border-white/25 transition cursor-pointer">
                <ArrowUp size={10} /> Up
              </button>
              <button onClick={() => moveLayer(selectedId, "down")} className="flex-1 bg-white/10 hover:bg-white/20 text-[10px] py-1 rounded text-white flex items-center justify-center gap-1 border border-white/25 transition cursor-pointer">
                <ArrowDown size={10} /> Down
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-white/50 font-semibold">Actions</span>
            <div className="flex gap-1.5">
              <button onClick={() => handleDeleteElement(selectedId)} className="flex-1 bg-red-500/20 hover:bg-red-500/35 border border-red-500/30 text-[10px] py-1 rounded flex items-center justify-center gap-1 transition cursor-pointer">
                <Trash2 size={10} /> Delete
              </button>
              <button onClick={() => toggleLock(selectedId)} className="flex-1 bg-white/10 hover:bg-white/20 border border-white/25 text-white text-[10px] py-1 rounded flex items-center justify-center gap-1 transition cursor-pointer">
                {elements.find(el => el.id === selectedId)?.isLocked ? "Unlock" : "Lock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPropertiesPanel = () => (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-white/90 border-b border-white/10 pb-1.5">Properties</h3>
      {selectedId ? (
        <div className="flex flex-col gap-4 text-xs">
          {/* Position */}
          <div className="flex flex-col gap-1.5">
            <span className="text-white/70 font-semibold">Position</span>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center bg-white/10 border border-white/20 rounded px-2.5 py-1">
                <span className="text-white/50 font-bold mr-2">X</span>
                <input type="number" value={propX} onChange={(e) => setPropX(e.target.value)} className="w-full bg-transparent border-none text-white focus:outline-none text-xs" />
              </div>
              <div className="flex items-center bg-white/10 border border-white/20 rounded px-2.5 py-1">
                <span className="text-white/50 font-bold mr-2">Y</span>
                <input type="number" value={propY} onChange={(e) => setPropY(e.target.value)} className="w-full bg-transparent border-none text-white focus:outline-none text-xs" />
              </div>
            </div>
          </div>
          {/* Move arrows */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-white/50 self-start">Move</span>
            <div className="flex flex-col items-center gap-1 w-20">
              <button onMouseDown={() => startContinuousMove(0, -1)} onMouseUp={stopContinuousMove} onMouseLeave={stopContinuousMove} onTouchStart={(e) => { e.preventDefault(); startContinuousMove(0, -1); }} onTouchEnd={stopContinuousMove} className="bg-white/15 hover:bg-white/25 p-1 rounded text-white border border-white/20 flex items-center justify-center w-8 h-7 select-none transition-all shadow-sm hover:scale-105 active:scale-95" title="Move Up"><ArrowUp size={12} /></button>
              <div className="flex gap-2">
                <button onMouseDown={() => startContinuousMove(-1, 0)} onMouseUp={stopContinuousMove} onMouseLeave={stopContinuousMove} onTouchStart={(e) => { e.preventDefault(); startContinuousMove(-1, 0); }} onTouchEnd={stopContinuousMove} className="bg-white/15 hover:bg-white/25 p-1 rounded text-white border border-white/20 flex items-center justify-center w-8 h-7 select-none transition-all shadow-sm hover:scale-105 active:scale-95" title="Move Left"><ArrowLeft size={12} /></button>
                <button onMouseDown={() => startContinuousMove(1, 0)} onMouseUp={stopContinuousMove} onMouseLeave={stopContinuousMove} onTouchStart={(e) => { e.preventDefault(); startContinuousMove(1, 0); }} onTouchEnd={stopContinuousMove} className="bg-white/15 hover:bg-white/25 p-1 rounded text-white border border-white/20 flex items-center justify-center w-8 h-7 select-none transition-all shadow-sm hover:scale-105 active:scale-95" title="Move Right"><ArrowRight size={12} /></button>
              </div>
              <button onMouseDown={() => startContinuousMove(0, 1)} onMouseUp={stopContinuousMove} onMouseLeave={stopContinuousMove} onTouchStart={(e) => { e.preventDefault(); startContinuousMove(0, 1); }} onTouchEnd={stopContinuousMove} className="bg-white/15 hover:bg-white/25 p-1 rounded text-white border border-white/20 flex items-center justify-center w-8 h-7 select-none transition-all shadow-sm hover:scale-105 active:scale-95" title="Move Down"><ArrowDown size={12} /></button>
            </div>
          </div>
          {/* Size */}
          <div className="flex flex-col gap-1.5">
            <span className="text-white/70 font-semibold">Size</span>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-white/60 font-semibold mb-0.5">Width</span>
                <div className="flex items-center bg-white/10 border border-white/20 rounded px-2.5 py-1">
                  <input type="number" value={propW} onChange={(e) => { const val = e.target.value; setPropW(val); if (keepAspect && selectedElement && selectedElement.width > 0) { const ratio = selectedElement.height / selectedElement.width; setPropH(Math.round(Number(val) * ratio).toString()); } }} className="w-full bg-transparent border-none text-white focus:outline-none text-xs" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-white/60 font-semibold mb-0.5">Height</span>
                <div className="flex items-center bg-white/10 border border-white/20 rounded px-2.5 py-1">
                  <input type="number" value={propH} onChange={(e) => { const val = e.target.value; setPropH(val); if (keepAspect && selectedElement && selectedElement.height > 0) { const ratio = selectedElement.width / selectedElement.height; setPropW(Math.round(Number(val) * ratio).toString()); } }} className="w-full bg-transparent border-none text-white focus:outline-none text-xs" />
                </div>
              </div>
            </div>
            <label className="flex items-center gap-1.5 mt-1 cursor-pointer select-none">
              <input type="checkbox" checked={keepAspect} onChange={(e) => setKeepAspect(e.target.checked)} className="accent-white rounded border-white/20 scale-90 cursor-pointer" />
              <span className="text-[10px] text-white/80 font-semibold">Keep Aspect Ratio</span>
            </label>
          </div>
          {/* Text content */}
          {selectedElement?.type === "text" && (
            <div className="flex flex-col gap-1">
              <span className="text-white/70 font-semibold">Text Content</span>
              <input type="text" value={textVal} onChange={(e) => setTextVal(e.target.value)} className="bg-white/10 border border-white/20 rounded p-2 text-white focus:outline-none placeholder-white/35 focus:border-white/50 text-xs transition" />
            </div>
          )}
          {/* Apply */}
          <button onClick={handleApplyChanges} className="w-full bg-white text-purple-600 hover:bg-purple-50 active:scale-95 py-2 rounded font-bold transition shadow-lg cursor-pointer hover:scale-[1.02] active:scale-[0.98]">Apply Changes</button>
        </div>
      ) : (
        <div className="text-xs text-white/50 italic text-center py-4">No element selected</div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen max-h-screen bg-gradient-to-r from-purple-500 via-pink-400 to-purple-600 text-white flex flex-col font-sans overflow-hidden select-none">

      {/* ═══════════ TOP TOOLBAR ═══════════ */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 px-3 lg:px-6 flex flex-col shrink-0 shadow-lg">
        {/* Primary row – always visible */}
        <div className="h-12 lg:h-14 flex items-center justify-between gap-2">
          {/* Left group */}
          <div className="flex items-center gap-2 lg:gap-4 min-w-0">
            <Link href="/admin" className="flex items-center cursor-pointer gap-1.5 bg-white text-purple-600 px-2.5 lg:px-3.5 py-1.5 rounded-xl shadow hover:scale-105 active:scale-95 transition font-semibold text-xs shrink-0">
              ←<span className="hidden sm:inline"> Back</span>
            </Link>
            <div className="h-5 w-px bg-white/20 hidden sm:block"></div>
            <span className="text-sm lg:text-lg font-extrabold text-white drop-shadow-sm shrink-0 hidden sm:block">
              {isEditMode ? "Edit Template" : "Template Editor"}
            </span>
          </div>

          {/* Right group – core actions always visible */}
          <div className="flex items-center gap-1.5 lg:gap-3">
            {/* Undo/Redo – always shown */}
            <div className="flex gap-0.5">
              <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-1.5 bg-white/10 hover:bg-white/20 rounded disabled:opacity-40 disabled:cursor-not-allowed text-white transition cursor-pointer" title="Undo"><Undo2 size={15} /></button>
              <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-1.5 bg-white/10 hover:bg-white/20 rounded disabled:opacity-40 disabled:cursor-not-allowed text-white transition cursor-pointer" title="Redo"><Redo2 size={15} /></button>
            </div>

            {/* Save – always shown */}
            <button
              onClick={handleSaveLayout}
              disabled={saving}
              className="bg-white text-purple-600 hover:bg-purple-50 active:scale-95 disabled:bg-white/25 disabled:text-white/40 disabled:cursor-not-allowed font-bold text-xs px-3 lg:px-4 py-1.5 rounded transition shadow-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={14} />
              <span className="hidden sm:inline">{saving ? (isEditMode ? "Updating..." : "Saving...") : (isEditMode ? "Update" : "Save")}</span>
            </button>

            {/* Mobile panel toggle */}
            <button
              onClick={() => setMobilePanel(!mobilePanel)}
              className="lg:hidden p-1.5 bg-white/10 hover:bg-white/20 rounded text-white transition cursor-pointer border border-white/20"
              title="Toggle panels"
            >
              {mobilePanel ? <X size={16} /> : <Menu size={16} />}
            </button>

            {/* Expand secondary toolbar on mobile */}
            <button
              onClick={() => setMobileToolbarExpanded(!mobileToolbarExpanded)}
              className="lg:hidden p-1.5 bg-white/10 hover:bg-white/20 rounded text-white transition cursor-pointer border border-white/20"
              title="More tools"
            >
              {mobileToolbarExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Secondary row – shown on desktop always, on mobile when expanded */}
        <div className={`flex items-center gap-2 lg:gap-4 pb-2 flex-wrap ${mobileToolbarExpanded ? 'flex' : 'hidden lg:flex'}`}>
          {/* Canvas size */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] lg:text-xs text-white/80 font-semibold">Canvas:</span>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              className="bg-white/10 border border-white/25 text-white text-[10px] lg:text-xs rounded px-2 py-1 lg:px-2.5 lg:py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-purple-700 text-white">Select</option>
              <option value="4x6" className="bg-purple-700 text-white">4x6 (1200×1800)</option>
            </select>
          </div>

          <div className="h-5 w-px bg-white/20"></div>

          {/* Snap */}
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`text-[10px] lg:text-xs px-2 py-1 lg:px-2.5 lg:py-1.5 rounded transition cursor-pointer border ${snapToGrid ? "bg-white text-purple-600 font-bold shadow-md border-white" : "bg-white/10 text-white/80 hover:text-white border-white/20"}`}
          >
            Snap
          </button>

          {/* Fit */}
          <button onClick={handleFit} className="bg-white/10 hover:bg-white/20 text-white text-[10px] lg:text-xs px-2 py-1 lg:px-3 lg:py-1.5 rounded border border-white/20 transition cursor-pointer shadow-sm">Fit</button>

          <div className="h-5 w-px bg-white/20"></div>

          {/* Zoom */}
          <div className="flex items-center gap-1.5">
            <ZoomOut size={12} className="text-white/70" />
            <input type="range" min="10" max="100" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-16 lg:w-24 accent-white h-1 bg-white/25 rounded-lg appearance-none cursor-pointer" />
            <ZoomIn size={12} className="text-white/70" />
            <span className="text-[10px] lg:text-xs text-white/95 min-w-[28px] font-semibold">{zoom}%</span>
          </div>

          <div className="h-5 w-px bg-white/20"></div>

          {/* New */}
          <button
            onClick={() => {
              showConfirm("New Layout", "Create new layout? Current changes will be lost.", () => { pushHistory([]); setSelectedId(null); });
            }}
            className="bg-white/10 hover:bg-white/20 text-white text-[10px] lg:text-xs px-2 py-1 lg:px-3 lg:py-1.5 rounded border border-white/20 transition cursor-pointer"
          >
            New
          </button>
        </div>
      </header>

      {/* ═══════════ MAIN WORKSPACE ═══════════ */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ── Desktop Left Sidebar ── */}
        <aside className="hidden lg:flex w-66 bg-white/10 backdrop-blur-lg border-r border-white/20 flex-col p-5 gap-6 overflow-y-auto shrink-0 shadow-2xl">
          {renderTemplatePanel()}
        </aside>

        {/* ── Center Editor Workspace ── */}
        <main
          className="flex-1 bg-black/15 flex items-center justify-center overflow-auto p-4 sm:p-8 lg:p-12 relative"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {paperSize === "4x6" ? (
            <div
              ref={canvasRef}
              className="bg-white shadow-2xl relative transition-shadow border border-white/20 rounded-xl lg:rounded-2xl overflow-hidden"
              style={{
                width: 1200 * (zoom / 100),
                height: 1800 * (zoom / 100),
                minWidth: 1200 * (zoom / 100),
                minHeight: 1800 * (zoom / 100),
              }}
              onClick={() => setSelectedId(null)}
            >
              {elements.map((el) => {
                const scale = zoom / 100;
                const isSelected = el.id === selectedId;
                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleMouseDown(e, el.id)}
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute select-none ${isSelected ? "ring-2 ring-dashed ring-purple-600 cursor-move" : "cursor-pointer hover:ring-2 hover:ring-purple-400"}`}
                    style={{
                      left: el.x * scale,
                      top: el.y * scale,
                      width: el.width * scale,
                      height: el.height * scale,
                      zIndex: isSelected ? 40 : (el.type === "image" ? 10 : el.type === "text" ? 20 : 30)
                    }}
                  >
                    {el.type === "image" && el.src && (<img src={el.src} alt="Image Layer" className="w-full h-full object-cover pointer-events-none" />)}
                    {el.type === "placeholder" && (
                      <div className="w-full h-full bg-purple-50/80 border-2 border-dashed border-purple-300 flex flex-col items-center justify-center text-purple-600 font-bold p-2 text-center pointer-events-none">
                        <Square size={20} className="mb-1 text-purple-400" />
                        <span className="text-[10px] tracking-tight uppercase">Photo Placeholder</span>
                      </div>
                    )}
                    {el.type === "text" && (
                      <div className="w-full h-full flex items-center justify-center text-slate-900 font-bold text-center pointer-events-none leading-none" style={{ fontSize: 16 }}>{el.text}</div>
                    )}
                    {el.isLocked && (<div className="absolute top-1 right-1 bg-white/85 text-purple-600 p-1 rounded-sm shadow-md"><Lock size={10} /></div>)}
                    {isSelected && !el.isLocked && (
                      <div onMouseDown={(e) => handleResizeMouseDown(e, el.id)} className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-purple-600 border-2 border-white rounded-full translate-x-1.5 translate-y-1.5 cursor-se-resize z-40 hover:scale-125 active:scale-95 transition-all shadow-md" title="Drag to resize" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center text-white/50 bg-white/5 backdrop-blur-sm border border-white/15 p-6 sm:p-8 rounded-2xl shadow-xl">
              <Maximize size={40} className="animate-pulse text-white/70" />
              <div>
                <h3 className="font-bold text-white text-sm">No Canvas Selected</h3>
                <p className="text-xs max-w-xs mt-1 text-white/80">Please select &quot;4x6 Photo Paper&quot; from the canvas size option to start editing.</p>
              </div>
            </div>
          )}

          {/* Status bar */}
          <div className="absolute bottom-2 left-3 lg:bottom-4 lg:left-6 text-[10px] lg:text-xs text-white/70 font-semibold drop-shadow-sm">
            {paperSize === "4x6" ? "1200×1800" : "None"} | {selectedId ? elements.find(e => e.id === selectedId)?.type : "—"}
          </div>
        </main>

        {/* ── Desktop Right Sidebar ── */}
        <aside className="hidden lg:flex w-66 bg-white/10 backdrop-blur-lg border-l border-white/20 flex-col p-5 gap-6 overflow-y-auto shrink-0 shadow-2xl">
          {renderLayersPanel()}
          <div className="h-px bg-white/10"></div>
          {renderPropertiesPanel()}
        </aside>

        {/* ═══════════ MOBILE / TABLET BOTTOM SHEET ═══════════ */}
        {mobilePanel && (
          <div className="lg:hidden absolute inset-x-0 bottom-0 z-50 flex flex-col animate-in slide-in-from-bottom" style={{ maxHeight: '60vh' }}>
            {/* Tab bar */}
            <div className="flex bg-purple-800/95 backdrop-blur-xl border-t border-white/20 shadow-2xl">
              {(["template", "layers", "properties"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold uppercase tracking-wide transition cursor-pointer
                    ${activeTab === tab ? "text-white bg-white/15 border-b-2 border-white" : "text-white/60 hover:text-white/80"}`}
                >
                  {tab === "template" && <Settings2 size={14} />}
                  {tab === "layers" && <Layers size={14} />}
                  {tab === "properties" && <PanelLeftOpen size={14} />}
                  <span className="hidden xs:inline sm:inline">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                </button>
              ))}
            </div>
            {/* Panel content */}
            <div className="bg-purple-900/95 backdrop-blur-xl overflow-y-auto p-4" style={{ maxHeight: 'calc(60vh - 48px)' }}>
              {activeTab === "template" && renderTemplatePanel()}
              {activeTab === "layers" && renderLayersPanel()}
              {activeTab === "properties" && renderPropertiesPanel()}
            </div>
          </div>
        )}
      </div>

      <CustomModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
        onCancel={closeDialog}
      />
    </div>
  );
}
