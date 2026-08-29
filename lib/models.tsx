import React from "react"

export interface Model {
  id: string
  name: string
  icon: React.ReactNode
  supportsImages: boolean
}

export const MODELS: Record<string, Model> = {
  mistral: {
    id: "mistralai/mistral-small-3.2-24b-instruct",
    name: "Mistral 3.2",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path
          d="M4 6C4 4.9 4.9 4 6 4H18C19.1 4 20 4.9 20 6V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V6Z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path d="M8 12L12 8L16 12L12 16L8 12Z" fill="currentColor" />
        <path
          d="M12 6V10M12 14V18M6 12H10M14 12H18"
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
    ),
    supportsImages: true,
  },
}

export const DEFAULT_MODEL = MODELS.mistral
export const DEFAULT_MODEL_ID = MODELS.mistral.id

export function getModel(modelId: string): Model {
  return MODELS[Object.keys(MODELS).find((key) => MODELS[key].id === modelId) || "mistral"] || DEFAULT_MODEL
}
