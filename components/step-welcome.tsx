// Arquivo: components/step-welcome.tsx
import { AppConfig, Comanda } from "@/types";
import { Button } from "./ui/button";

interface StepWelcomeProps {
    comanda: Comanda;
    onNext: () => void;
    config: AppConfig | null;
}

export function StepWelcome({ comanda, onNext, config }: StepWelcomeProps) {
    const defaultEmoji = "🎉";
    const defaultTitle = "Seja Bem-Vindo(a)!";
    const defaultSubtitle = "Preparamos tudo com muito carinho para você.";

    return (
        <div className="flex flex-col items-center justify-center text-center p-4 h-full">
            <div className="text-6xl mb-4">{config?.welcomeEmoji || defaultEmoji}</div>
            <h1 className="text-3xl font-bold text-[--primary]">{config?.welcomeTitle || defaultTitle}</h1>
            <h2 className="text-lg text-[--secondary] mt-2 mb-6">{comanda.guestName}</h2>
            <p className="text-muted-foreground mb-8">{config?.welcomeSubtitle || defaultSubtitle}</p>
            
            <div className="bg-muted/50 p-4 rounded-lg text-sm text-left w-full max-w-sm mb-8 space-y-2">
                <p><strong>Reserva para:</strong> {comanda.numberOfGuests} pessoa(s)</p>
                <p><strong>Acomodação:</strong> {comanda.cabin}</p>
            </div>

            <Button onClick={onNext} className="w-full max-w-sm">
                Montar minha cesta
            </Button>
        </div>
    );
}