// Arquivo: app/admin/settings/aparencia/page.tsx
'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { getFirebaseDb } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { AppConfig } from '@/types'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function AparenciaSettingsPage() {
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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
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
        toast.success('Configurações de aparência salvas com sucesso!');
        window.location.reload();
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
        <CardTitle>Aparência e Cores</CardTitle>
        <CardDescription>Personalize a identidade visual da aplicação do cliente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <Label htmlFor="nomeFazenda">Nome da Pousada/Fazenda</Label>
            <Input id="nomeFazenda" name="nomeFazenda" value={config.nomeFazenda || ''} onChange={handleInputChange} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="logoUrl">URL da Logo</Label>
            <Input id="logoUrl" name="logoUrl" value={config.logoUrl || ''} onChange={handleInputChange} placeholder="https://exemplo.com/logo.png" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="space-y-2">
                <Label htmlFor="corFundo">Cor de Fundo</Label>
                <Input id="corFundo" name="corFundo" type="color" value={config.corFundo || '#FFFFFF'} onChange={handleInputChange} className="h-12 w-full"/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="corTexto">Cor do Texto</Label>
                <Input id="corTexto" name="corTexto" type="color" value={config.corTexto || '#000000'} onChange={handleInputChange} className="h-12 w-full"/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="corDestaque">Cor de Destaque</Label>
                <Input id="corDestaque" name="corDestaque" type="color" value={config.corDestaque || '#97A25F'} onChange={handleInputChange} className="h-12 w-full"/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="corDestaqueTexto">Texto do Destaque</Label>
                <Input id="corDestaqueTexto" name="corDestaqueTexto" type="color" value={config.corDestaqueTexto || '#FFFFFF'} onChange={handleInputChange} className="h-12 w-full"/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="corCartao">Fundo dos Cards</Label>
                <Input id="corCartao" name="corCartao" type="color" value={config.corCartao || '#F7FDF2'} onChange={handleInputChange} className="h-12 w-full"/>
            </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Aparência'}
        </Button>
      </CardFooter>
    </Card>
  );
}