// Arquivo: app/admin/settings/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import { AppConfig } from "@/types";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, AlertTriangle, Trash2, PlusCircle } from "lucide-react";
import { useEffect, useState, useCallback } from "react"; // CORREÇÃO: Adicionado useCallback
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { getFirebaseDb } from "@/lib/firebase";

const initialMessages = [
    "Que seu dia seja tão incrível quanto o aroma de um café fresquinho.", "Um sorriso pode mudar o mundo. Comece pelo seu!", "A gentileza é como o açúcar, deixa tudo mais doce.", "Respire fundo. Sinta a calma. Prossiga com leveza.", "Cada novo dia é uma tela em branco. Pinte-a com as cores da alegria!", "Pequenos gestos, grandes sorrisos. Faça a diferença hoje.", "Que a energia boa te encontre e faça morada.", "A vida é feita de momentos. Aprecie cada um deles.", "Confie no seu potencial. Você é mais forte do que imagina.", "A felicidade está nas pequenas coisas, como uma xícara de chá quente.", "Seja a razão do sorriso de alguém hoje.", "Que o seu trabalho seja leve e seu coração, grato.", "Comece o dia com o pé direito e a alma em paz.", "Acredite na magia dos novos começos.", "Cultive o bem-estar: corpo são, mente sã.", "Que a sua jornada hoje seja repleta de boas surpresas.", "Lembre-se de fazer uma pausa e apreciar a vista.", "Espalhe positividade. O mundo agradece.", "O melhor tempero da vida é a gratidão.", "Você é capaz de coisas maravilhosas. Acredite!",
];

export default function SettingsPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const db = await getFirebaseDb();
        if (!db) throw new Error("Falha na conexão com o banco de dados.");
        const configRef = doc(db, "configuracoes", "app");
        const docSnap = await getDoc(configRef);
        if (docSnap.exists()) {
            const data = docSnap.data() as AppConfig;
            if (!data.mensagensMotivacionais || data.mensagensMotivacionais.length === 0) {
              setConfig({ ...data, mensagensMotivacionais: initialMessages });
            } else {
              setConfig(data);
            }
        } else {
            toast.info("Nenhum documento de configuração encontrado. Criando um novo.");
            setConfig({} as AppConfig);
        }
    } catch(e) {
        console.error(e);
        setError("Não foi possível carregar as configurações.");
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    const db = await getFirebaseDb();
    if (!db || !config) {
      toast.error("Erro ao salvar: conexão ou dados ausentes.");
      setIsSaving(false);
      return;
    }
    try {
      await setDoc(doc(db, "configuracoes", "app"), config, { merge: true });
      toast.success("Configurações salvas com sucesso!");
    } catch (e) {
      console.error("Erro ao salvar:", e);
      toast.error("Ocorreu um erro ao salvar as configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMessage = () => {
    if (!config || !newMessage.trim()) return;
    const updatedMessages = [...(config.mensagensMotivacionais || []), newMessage.trim()];
    setConfig({ ...config, mensagensMotivacionais: updatedMessages });
    setNewMessage("");
    toast.info("Mensagem adicionada localmente. Clique em 'Salvar' para persistir.");
  };

  const handleRemoveMessage = (indexToRemove: number) => {
    if (!config) return;
    const updatedMessages = config.mensagensMotivacionais?.filter((_, index) => index !== indexToRemove);
    setConfig({ ...config, mensagensMotivacionais: updatedMessages });
    toast.info("Mensagem removida localmente. Clique em 'Salvar' para persistir.");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof AppConfig) => {
    if (!config) return;
    setConfig({ ...config, [field]: e.target.value });
  };
  
  if (loading) return <div className="flex flex-col gap-2 items-center justify-center h-64 text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin" /><span>Carregando...</span></div>;
  if (error) return ( <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4"> <AlertTriangle className="w-12 h-12 text-destructive" /> <h2 className="text-xl font-semibold">{error}</h2> <Button onClick={fetchConfig}>Tentar Novamente</Button></div> );
  if (!config) return <div>Nenhuma configuração para exibir. <Button onClick={fetchConfig}>Carregar</Button></div>;

  return (
    <div className="container mx-auto p-0 md:p-4">
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
          <CardDescription>
            Ajuste os textos, cores e mensagens do formulário de pedidos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Accordion type="multiple" defaultValue={['textos', 'cores', 'mensagens']} className="w-full">
            <AccordionItem value="textos">
              <AccordionTrigger>Textos da Aplicação</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                      <Label>Nome da Fazenda</Label>
                      <Input value={config.nomeFazenda || ""} onChange={(e) => handleInputChange(e, "nomeFazenda")} />
                  </div>
                   <div className="space-y-2">
                      <Label>Subtítulo</Label>
                      <Input value={config.subtitulo || ""} onChange={(e) => handleInputChange(e, "subtitulo")} />
                  </div>
                   <div className="space-y-2">
                      <Label>Texto de Introdução</Label>
                      <Textarea value={config.textoIntroducao || ""} onChange={(e) => handleInputChange(e, "textoIntroducao")} />
                  </div>
                   <div className="space-y-2">
                      <Label>Texto de Agradecimento</Label>
                      <Textarea value={config.textoAgradecimento || ""} onChange={(e) => handleInputChange(e, "textoAgradecimento")} />
                  </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="cores">
              <AccordionTrigger>Cores do Tema</AccordionTrigger>
              <AccordionContent className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Inputs de cores aqui */}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="mensagens">
              <AccordionTrigger>Mensagens Motivacionais</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {config.mensagensMotivacionais?.map((msg, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <p className="flex-1 p-2 bg-muted rounded text-sm">"{msg}"</p>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveMessage(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  <Input 
                    placeholder="Digite uma nova mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMessage(); }}}
                  />
                  <Button onClick={handleAddMessage} size="icon" type="button">
                    <PlusCircle className="h-5 w-5"/>
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Todas as Alterações
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}