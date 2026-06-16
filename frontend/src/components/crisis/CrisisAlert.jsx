// components/crisis/CrisisAlert.jsx
// Displayed as a prominent banner above the chat when a crisis message is detected.
// Separate from MessageBubble so the crisis UI is isolated and can be styled
// independently.

import { Phone, AlertCircle, X } from "lucide-react";
import { useState } from "react";

const HELPLINES = [
  {
    name: "iCall (India)",
    number: "9152987821",
    hours: "Mon–Sat, 8am–10pm",
  },
  {
    name: "AASRA",
    number: "91-9820466627",
    hours: "24/7",
  },
  {
    name: "Vandrevala Foundation",
    number: "1860-2662-345",
    hours: "24/7",
  },
];

export const CrisisAlert = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="mx-4 mt-4 rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <AlertCircle
              size={18}
              className="text-red-600 dark:text-red-400"
            />
          </div>

          <div>
            <p className="font-semibold text-red-800 dark:text-red-300 text-sm">
              It sounds like you may be going through something very difficult.
            </p>

            <p className="text-red-700 dark:text-red-400 text-xs mt-0.5">
              You are not alone. Trained crisis counselors are available right
              now.
            </p>

            <div className="mt-3 space-y-2">
              {HELPLINES.map((h) => (
                <div key={h.name} className="flex items-start gap-2">
                  <Phone
                    size={12}
                    className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5"
                  />

                  <span className="text-xs text-red-800 dark:text-red-300">
                    <span className="font-medium">{h.name}:</span>{" "}
                    <a
                      href={`tel:${h.number.replace(/\D/g, "")}`}
                      className="underline underline-offset-2 hover:text-red-600 dark:hover:text-red-200 font-medium"
                    >
                      {h.number}
                    </a>

                    <span className="text-red-500 dark:text-red-400 ml-1">
                      — {h.hours}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-red-500 dark:text-red-400 mt-2">
              If you are in immediate danger, call{" "}
              <a href="tel:112" className="font-bold underline">
                112
              </a>{" "}
              or go to your nearest hospital.
            </p>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-red-400 dark:text-red-500 transition"
          aria-label="Dismiss crisis alert"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default CrisisAlert;