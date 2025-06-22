// Arquivo: app/admin/settings/mensagens/page.tsx
'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { getFirebaseDb } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { AppConfig } from '@/types'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, PlusCircle, Trash2 } from 'lucide-react'

export default function MensagensSettingsPage() {
  const [config, setConfig] = useState<Partial<AppConfig>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newMotivationalMessage, setNewMotivationalMessage] = useState("")

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      const db = await getFirebaseDb();
      if (db) {
        const configRef = doc(db, 'configuracoes', 'app');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          const data = configSnap.data();
          // Garante que mensagensMotivacionais seja um array para evitar erros
          if (!data.mensagensMotivacionais) {
            data.mensagensMotivacionais = [];
          }
          setConfig(data);
        }
      }
      setLoading(false);
    }
    fetchConfig();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMotivationalMessage = () => {
    if (newMotivationalMessage.trim() === "") {
      toast.info("A mensagem não pode estar vazia.");
      return;
    }
    const updatedMessages = [...(config.mensagensMotivacionais || []), newMotivationalMessage];
    setConfig(prev => ({ ...prev, mensagensMotivacionais: updatedMessages }));
    setNewMotivationalMessage(""); // Limpa o input
    toast.success("Mensagem adicionada! Clique em salvar para persistir a alteração.");
  };

  const handleRemoveMotivationalMessage = (indexToRemove: number) => {
    const updatedMessages = config.mensagensMotivacionais?.filter((_, index) => index !== indexToRemove);
    setConfig(prev => ({ ...prev, mensagensMotivacionais: updatedMessages }));
    toast.warning("Mensagem removida! Clique em salvar para persistir a alteração.");
  };

  const handleSave = async () => {
    setSaving(true);
    const db = await getFirebaseDb();
    if (db) {
      try {
        const configRef = doc(db, 'configuracoes', 'app');
        await setDoc(configRef, config, { merge: true });
        toast.success('Configurações salvas com sucesso!');
      } catch (error) {
        toast.error('Falha ao salvar as configurações. Tente novamente.');
      }
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mensagens da Aplicação</CardTitle>
        <CardDescription>Personalize os textos que aparecem em diferentes etapas do fluxo de pedido do hóspede e na cozinha.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seção de Boas Vindas */}
        <div className="space-y-4 p-4 border rounded-lg">
           <h3 className="font-semibold text-lg">Tela de Boas-Vindas</h3>
            <div className='grid grid-cols-1 md:grid-cols-12 gap-4'>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="welcomeEmoji">Emoji</Label>
                    <Input id="welcomeEmoji" name="welcomeEmoji" value={config.welcomeEmoji || ''} onChange={handleInputChange} placeholder="🎉" />
                </div>
                <div className="space-y-2 md:col-span-5">
                    <Label htmlFor="welcomeTitle">Título</Label>
                    <Input id="welcomeTitle" name="welcomeTitle" value={config.welcomeTitle || ''} onChange={handleInputChange} placeholder="Seja Bem-Vindo(a)!" />
                </div>
                <div className="space-y-2 md:col-span-5">
                    <Label htmlFor="welcomeSubtitle">Subtítulo</Label>
                    <Input id="welcomeSubtitle" name="welcomeSubtitle" value={config.welcomeSubtitle || ''} onChange={handleInputChange} placeholder="Preparamos tudo com muito carinho para você." />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="textoBoasVindas">Mensagem Principal</Label>
                <Textarea rows={3} id="textoBoasVindas" name="textoBoasVindas" value={config.textoBoasVindas || ''} onChange={handleInputChange} placeholder="Sua experiência gastronômica na Fazenda do Rosa começa agora..." />
            </div>
        </div>
        
        {/* Seção de Sucesso do Pedido */}
        <div className="space-y-4 p-4 border rounded-lg">
           <h3 className="font-semibold text-lg">Tela de Pedido Enviado</h3>
            <div className="space-y-2">
                <Label htmlFor="successTitle">Título</Label>
                <Input id="successTitle" name="successTitle" value={config.successTitle || ''} onChange={handleInputChange} placeholder="Pedido Confirmado!" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="successSubtitle">Subtítulo</Label>
                <Textarea rows={2} id="successSubtitle" name="successSubtitle" value={config.successSubtitle || ''} onChange={handleInputChange} placeholder="Sua cesta está sendo preparada com muito carinho pela nossa equipe." />
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className="space-y-2">
                    <Label htmlFor="successGratitude">Mensagem de Agradecimento</Label>
                    <Input id="successGratitude" name="successGratitude" value={config.successGratitude || ''} onChange={handleInputChange} placeholder="♥ Desejamos um dia maravilhoso! ♥" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="successFooter">Texto do Rodapé</Label>
                    <Input id="successFooter" name="successFooter" value={config.successFooter || ''} onChange={handleInputChange} placeholder="Obrigado por escolher a Fazenda do Rosa..." />
                </div>
            </div>
        </div>

        {/* NOVA SEÇÃO: Personalização da Comanda */}
        <div className="space-y-4 p-4 border rounded-lg">
           <h3 className="font-semibold text-lg">Personalização da Comanda do Hóspede</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="comandaTitle">Título da Comanda</Label>
                <Input id="comandaTitle" name="comandaTitle" value={config.comandaTitle || ''} onChange={handleInputChange} placeholder="Ex: Fazenda do Rosa" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comandaSubtitle">Subtítulo da Comanda</Label>
                <Input id="comandaSubtitle" name="comandaSubtitle" value={config.comandaSubtitle || ''} onChange={handleInputChange} placeholder="Ex: Sua Comanda de Café da Manhã" />
              </div>
           </div>
           <div className="space-y-2">
                <Label htmlFor="comandaPostQr">Texto Abaixo do QR Code</Label>
                <Input id="comandaPostQr" name="comandaPostQr" value={config.comandaPostQr || ''} onChange={handleInputChange} placeholder="Ex: Escaneie para iniciar o pedido" />
           </div>
           <div className="space-y-2">
                <Label htmlFor="comandaFooter">Rodapé da Comanda</Label>
                <Textarea rows={3} id="comandaFooter" name="comandaFooter" value={config.comandaFooter || ''} onChange={handleInputChange} placeholder="Ex: Apresente este ticket se necessário. Bom apetite!" />
           </div>
        </div>

        {/* Seção de Mensagens Motivacionais */}
        <div className="space-y-4 p-4 border rounded-lg">
           <h3 className="font-semibold text-lg">Mensagens Motivacionais (para Comandas)</h3>
           <div className="space-y-3">
              <Label htmlFor="newMotivationalMessage">Nova Mensagem</Label>
              <div className="flex gap-2">
                  <Input 
                    id="newMotivationalMessage" 
                    value={newMotivationalMessage} 
                    onChange={(e) => setNewMotivationalMessage(e.target.value)} 
                    placeholder="Adicione uma frase inspiradora para a equipe..." 
                  />
                  <Button variant="outline" size="icon" onClick={handleAddMotivationalMessage} aria-label="Adicionar Mensagem">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
              </div>
           </div>
           <div className="space-y-2 pt-2">
                <Label>Mensagens Atuais</Label>
                {config.mensagensMotivacionais && config.mensagensMotivacionais.length > 0 ? (
                    <ul className="space-y-2">
                        {config.mensagensMotivacionais.map((msg, index) => (
                            <li key={index} className="flex items-center justify-between bg-secondary p-2 rounded-md">
                                <span className="text-sm text-secondary-foreground flex-1 pr-2">{msg}</span>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveMotivationalMessage(index)} aria-label="Remover Mensagem">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma mensagem motivacional cadastrada.</p>
                )}
           </div>
        </div>
        
        {/* Seção de Mensagens Administrativas */}
        <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg">Mensagens Administrativas e Padrões</h3>
            <div className="space-y-2">
                <Label htmlFor="mensagemDoDia">Mensagem do Dia (Dashboard)</Label>
                <Textarea rows={2} id="mensagemDoDia" name="mensagemDoDia" value={config.mensagemDoDia || ''} onChange={handleInputChange} placeholder="Uma nota rápida para a equipe que aparece no topo do dashboard." />
            </div>
            <div className="space-y-2">
                <Label htmlFor="mensagemAtrasoPadrao">Mensagem Padrão para Comandas Expiradas</Label>
                <Textarea rows={2} id="mensagemAtrasoPadrao" name="mensagemAtrasoPadrao" value={config.mensagemAtrasoPadrao || ''} onChange={handleInputChange} placeholder="Esta mensagem é exibida caso uma comanda com prazo de validade expire." />
            </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={saving || loading} className="w-full sm:w-auto">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Todas as Configurações'}
        </Button>
      </CardFooter>
    </Card>
  );
}