// Arquivo: app/admin/settings/mensagens/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getFirebaseDb } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppConfig } from '@/types';

export default function MensagensSettingsPage() {
  const [config, setConfig] = useState<Partial<AppConfig>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      const db = await getFirebaseDb();
      if (db) {
        const configRef = doc(db, 'configuracoes', 'app');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          setConfig(configSnap.data());
        }
      }
      setIsLoading(false);
    };

    fetchConfig();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const db = await getFirebaseDb();
    if (db) {
      try {
        const configRef = doc(db, 'configuracoes', 'app');
        await setDoc(configRef, config, { merge: true });
        toast.success('Mensagens salvas com sucesso!');
      } catch (error) {
        toast.error('Falha ao salvar as mensagens.');
        console.error(error);
      }
    }
    setIsSaving(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mensagem do Dia</CardTitle>
          <CardDescription>
            Esta mensagem aparece no topo do painel de admin para toda a sua equipe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mensagemDoDia">Mensagem</Label>
            <Textarea
              id="mensagemDoDia"
              name="mensagemDoDia"
              placeholder="Ex: Bom trabalho hoje, equipe!"
              value={config.mensagemDoDia || ''}
              onChange={handleInputChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* NOVO CARD PARA MENSAGENS DO FLUXO DO CLIENTE */}
      <Card>
        <CardHeader>
            <CardTitle>Mensagens para o Hóspede</CardTitle>
            <CardDescription>
                Personalize os textos que os hóspedes veem durante o processo de pedido.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-lg">Tela de Boas-Vindas</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2 md:col-span-1">
                        <Label htmlFor="welcomeEmoji">Emoji</Label>
                        <Input id="welcomeEmoji" name="welcomeEmoji" value={config.welcomeEmoji || ''} onChange={handleInputChange} placeholder="🎉" />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                        <Label htmlFor="welcomeTitle">Título Principal</Label>
                        <Input id="welcomeTitle" name="welcomeTitle" value={config.welcomeTitle || ''} onChange={handleInputChange} placeholder="Seja Bem-Vindo(a)!" />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="welcomeSubtitle">Subtítulo</Label>
                    <Input id="welcomeSubtitle" name="welcomeSubtitle" value={config.welcomeSubtitle || ''} onChange={handleInputChange} placeholder="Preparamos tudo com muito carinho para você." />
                </div>
            </div>

             <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-lg">Tela de Pedido Enviado</h3>
                <div className="space-y-2">
                    <Label htmlFor="successTitle">Título de Confirmação</Label>
                    <Input id="successTitle" name="successTitle" value={config.successTitle || ''} onChange={handleInputChange} placeholder="Sua cesta está sendo preparada..." />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="successSubtitle">Subtítulo de Confirmação</Label>
                    <Textarea id="successSubtitle" name="successSubtitle" value={config.successSubtitle || ''} onChange={handleInputChange} placeholder="Em breve você receberá sua deliciosa cesta..." />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="successGratitude">Mensagem de Agradecimento</Label>
                    <Input id="successGratitude" name="successGratitude" value={config.successGratitude || ''} onChange={handleInputChange} placeholder="♥ Desejamos um dia maravilhoso! ♥" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="successFooter">Mensagem de Rodapé</Label>
                    <Input id="successFooter" name="successFooter" value={config.successFooter || ''} onChange={handleInputChange} placeholder="Obrigado por escolher a Fazenda do Rosa..." />
                </div>
            </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}