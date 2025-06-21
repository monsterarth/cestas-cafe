// Arquivo: components/step-success.tsx
import { AppConfig } from "@/types";
import { CheckCircle2 } from "lucide-react";

interface StepSuccessProps {
    config: AppConfig | null;
}

export function StepSuccess({ config }: StepSuccessProps) {
    const defaultTitle = "Sua cesta está sendo preparada com muito carinho pela nossa equipe.";
    const defaultSubtitle = "Em breve você receberá sua deliciosa cesta de café da manhã no horário solicitado.";
    const defaultGratitude = "♥ Desejamos um dia maravilhoso! ♥";
    const defaultFooter = "Obrigado por escolher a Fazenda do Rosa para sua experiência gastronômica.";

    return (
        <div className="flex flex-col items-center justify-center text-center p-6 h-full">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-6" />
            
            <h1 className="text-2xl font-semibold text-[--primary]">
                {config?.successTitle || defaultTitle}
            </h1>
            
            <p className="text-muted-foreground mt-4 max-w-prose">
                {config?.successSubtitle || defaultSubtitle}
            </p>
            
            <p className="text-lg font-medium text-[--secondary] mt-8">
                {config?.successGratitude || defaultGratitude}
            </p>

            <footer className="absolute bottom-4 text-xs text-muted-foreground px-4">
                {config?.successFooter || defaultFooter}
            </footer>
        </div>
    );
}