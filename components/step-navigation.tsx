// Arquivo: components/step-navigation.tsx
"use client"

interface StepNavigationProps {
  currentStep: number
  completedSteps: number[]
  onStepClick: (step: number) => void
}

// ALTERAÇÃO: Removida a etapa "Boas-Vindas"
const steps = [
  { id: 2, label: "Detalhes", shortLabel: "Detalhes" },
  { id: 3, label: "Pratos Quentes", shortLabel: "Pratos" },
  { id: 4, label: "Acompanhamentos", shortLabel: "Extras" },
  { id: 5, label: "Revisão", shortLabel: "Revisão" },
];

export function StepNavigation({ currentStep, completedSteps, onStepClick }: StepNavigationProps) {
  // A lógica de renderização não precisa ser alterada
  const maxCompletedStep = Math.max(...completedSteps);

  const getStepStatus = (stepId: number) => {
    if (stepId === currentStep) return "current";
    if (completedSteps.includes(stepId)) return "completed";
    if (stepId <= maxCompletedStep + 1) return "available";
    return "disabled";
  }

  const getStepClasses = (stepId: number) => {
    const status = getStepStatus(stepId);
    const baseClasses = "flex-1 text-center p-2 md:p-3 rounded-lg text-xs md:text-sm font-medium transition-all";

    switch (status) {
      case "current":
        return `${baseClasses} bg-[#97A25F] text-[#F7FDF2] shadow-md cursor-pointer`;
      case "completed":
        return `${baseClasses} bg-[#ADA192] text-[#F7FDF2] cursor-pointer hover:bg-[#97A25F]`;
      case "available":
        return `${baseClasses} bg-transparent text-[#4B4F36] hover:bg-[#E9D9CD] cursor-pointer`;
      case "disabled":
        return `${baseClasses} bg-transparent text-[#ADA192] cursor-not-allowed opacity-50`;
      default:
        return baseClasses;
    }
  }

  const handleStepClick = (stepId: number) => {
    const status = getStepStatus(stepId);
    if (status !== "disabled") {
      onStepClick(stepId);
    }
  }
  
  // Condição para não renderizar a barra de navegação nas etapas iniciais
  if (currentStep < 2) {
      return null;
  }

  return (
    <div className="sticky top-0 z-20 border-b border-stone-200 bg-[#F7FDF2]">
      <div className="container mx-auto px-2 md:px-4">
        <div className="flex justify-between py-3 md:py-4 gap-1 md:gap-2">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => handleStepClick(step.id)}
              disabled={getStepStatus(step.id) === "disabled"}
              className={getStepClasses(step.id)}
              aria-label={`Etapa ${step.id}: ${step.label}`}
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