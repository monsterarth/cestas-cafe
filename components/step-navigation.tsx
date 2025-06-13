"use client"

interface StepNavigationProps {
  currentStep: number
  onStepClick: (step: number) => void
}

const steps = [
  { id: 1, label: "Boas-Vindas", shortLabel: "Início" },
  { id: 2, label: "Detalhes", shortLabel: "Detalhes" },
  { id: 3, label: "Pratos Quentes", shortLabel: "Pratos" },
  { id: 4, label: "Acompanhamentos", shortLabel: "Extras" },
  { id: 5, label: "Revisão", shortLabel: "Revisão" },
]

export function StepNavigation({ currentStep, onStepClick }: StepNavigationProps) {
  return (
    <div className="sticky top-0 z-20 border-b border-stone-200 bg-[#F7FDF2]">
      <div className="container mx-auto px-2 md:px-4">
        <div className="flex justify-between py-3 md:py-4 gap-1 md:gap-2">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => onStepClick(step.id)}
              className={`
                flex-1 text-center p-2 md:p-3 rounded-lg text-xs md:text-sm font-medium transition-all
                ${
                  currentStep === step.id
                    ? "bg-[#97A25F] text-[#F7FDF2] shadow-md"
                    : currentStep > step.id
                      ? "bg-[#ADA192] text-[#F7FDF2]"
                      : "bg-transparent text-[#4B4F36] hover:bg-[#E9D9CD]"
                }
              `}
            >
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{step.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
