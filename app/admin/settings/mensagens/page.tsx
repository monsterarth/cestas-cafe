// Arquivo: app/admin/settings/mensagens/page.tsx
'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { getFirebaseDb } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { AppConfig } from '@/types'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function MensagensSettingsPage() {
  const [config, setConfig] = useState<Partial<AppConfig>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      const db = await getFirebaseDb();
      if (db) {
        const configRef = doc(db, 'configuracoes', 'app');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          setConfig(configSnap.data());
        }
      }
      setLoading(false);
    }
    fetchConfig();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const db = await getFirebaseDb();
    if (db) {
      try {
        const configRef = doc(db, 'configuracoes', 'app');
        await setDoc(configRef, config, { merge: true });
        toast.success('Mensagens salvas com sucesso!');
      } catch (error) {
        toast.error('Falha ao salvar. Tente novamente.');
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
        <CardTitle>Mensagens Padrão</CardTitle>
        <CardDescription>Personalize os textos que aparecem em diferentes etapas da aplicação.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="textoBoasVindas">Texto de Boas-Vindas</Label>
            <Textarea rows={4} id="textoBoasVindas" name="textoBoasVindas" value={config.textoBoasVindas || ''} onChange={handleInputChange} placeholder="Aparece após o hóspede confirmar os dados da reserva." />
        </div>
        <div className="space-y-2">
            <Label htmlFor="textoAgradecimento">Texto de Agradecimento Final</Label>
            <Textarea rows={4} id="textoAgradecimento" name="textoAgradecimento" value={config.textoAgradecimento || ''} onChange={handleInputChange} placeholder="Aparece após o pedido ser enviado com sucesso." />
        </div>
        <div className="space-y-2">
            <Label htmlFor="mensagemAtrasoPadrao">Mensagem Padrão para Comandas Expiradas</Label>
            <Textarea rows={4} id="mensagemAtrasoPadrao" name="mensagemAtrasoPadrao" value={config.mensagemAtrasoPadrao || ''} onChange={handleInputChange} placeholder="Usada quando uma comanda tem prazo, mas nenhuma mensagem personalizada." />
        </div>
        <div className="space-y-2">
            <Label htmlFor="mensagemDoDia">Mensagem do Dia (Dashboard)</Label>
            <Textarea rows={2} id="mensagemDoDia" name="mensagemDoDia" value={config.mensagemDoDia || ''} onChange={handleInputChange} placeholder="Uma nota rápida para a equipe no dashboard." />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Mensagens'}
        </Button>
      </CardFooter>
    </Card>
  );
}