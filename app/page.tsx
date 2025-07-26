import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Coffee,
  CalendarPlus,
  ClipboardCheck,
  MessageSquareQuote,
} from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function GuestHomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center text-4xl font-bold text-gray-800">
          Bem-vindo à Fazenda do Rosa
        </h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Link href="/cafe" legacyBehavior passHref>
            <Card className="flex h-full cursor-pointer flex-col justify-between transition-transform hover:scale-105 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Coffee className="h-6 w-6 text-yellow-600" />
                  <span>Café da Manhã</span>
                </CardTitle>
                <CardDescription>
                  Peça seu café da manhã em cesta com antecedência.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Fazer Pedido</Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/agendamentos" legacyBehavior passHref>
            <Card className="flex h-full cursor-pointer flex-col justify-between transition-transform hover:scale-105 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <CalendarPlus className="h-6 w-6 text-blue-600" />
                  <span>Serviços</span>
                </CardTitle>
                <CardDescription>
                  Agende o uso de nossas instalações e serviços.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Agendar Agora
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pre-check-in" legacyBehavior passHref>
            <Card className="flex h-full cursor-pointer flex-col justify-between transition-transform hover:scale-105 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <ClipboardCheck className="h-6 w-6 text-green-600" />
                  <span>Pré Check-in</span>
                </CardTitle>
                <CardDescription>
                  Adiante seus dados para um check-in mais rápido.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Iniciar Pré Check-in
                </Button>
              </CardContent>
            </Card>
          </Link>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="flex h-full flex-col justify-between opacity-70">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <MessageSquareQuote className="h-6 w-6 text-purple-600" />
                      <span>Avaliação</span>
                    </CardTitle>
                    <CardDescription>
                      Nos conte como foi sua experiência conosco.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" disabled>
                      Responder
                    </Button>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>É necessário o link personalizado que enviamos.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Em caso de dúvidas, fale conosco pelo WhatsApp.
          </p>
          <Link href="/admin" legacyBehavior passHref>
            <a className="text-xs text-gray-400 hover:underline">
              Acesso Restrito
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}