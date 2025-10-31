/**
 * Sélecteur de mode TV / ITTF pour le live scoring
 */

"use client";

interface ModeSelectorProps {
  mode: "tv" | "ittf";
  onChange: (mode: "tv" | "ittf") => void;
  className?: string;
}

export function ModeSelector({
  mode,
  onChange,
  className = "",
}: ModeSelectorProps) {
  return (
    <div className={`${className}`}>
      <h3 className="text-lg font-bold text-gray-900 mb-4">Mode</h3>
      <div className="flex space-x-3">
        <button
          onClick={() => onChange("tv")}
          className={`flex-1 px-6 py-4 rounded-lg font-medium transition-all ${
            mode === "tv"
              ? "bg-primary-600 text-white shadow-lg"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <div className="flex flex-col items-center">
            <svg
              className="w-10 h-10 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span className="text-lg">Mode TV</span>
          </div>
        </button>

        <button
          onClick={() => onChange("ittf")}
          className={`flex-1 px-6 py-4 rounded-lg font-medium transition-all ${
            mode === "ittf"
              ? "bg-primary-600 text-white shadow-lg"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <div className="flex flex-col items-center">
            <svg
              className="w-10 h-10 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
            <span className="text-lg">Mode ITTF</span>
          </div>
        </button>
      </div>
    </div>
  );
}
