import { ReactNode } from "react";

type ModalProps = {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  type?: "alert" | "confirm";
  onConfirm: () => void;
  onCancel?: () => void;
};

export default function CustomModal({
  isOpen,
  title,
  message,
  type = "alert",
  onConfirm,
  onCancel
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-[1px] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-white rounded-2xl p-6 min-w-[320px] max-w-sm flex flex-col gap-4 text-slate-800">
          <h3 className="text-xl font-bold text-purple-700">{title}</h3>
          <p className="text-sm font-medium leading-relaxed">{message}</p>
          <div className="flex justify-end gap-3 mt-2">
            {type === "confirm" && (
              <button 
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button 
              onClick={onConfirm}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 shadow-md transition cursor-pointer"
            >
              {type === "confirm" ? "Confirm" : "OK"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
