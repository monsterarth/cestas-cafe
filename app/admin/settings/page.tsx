'use client';

import { useState, useEffect } from 'react';
// CORREÇÃO: Importando as funções diretamente, sem o 'firestore.'
import { doc, getDoc, updateDoc, Firestore } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Importando Textarea
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { AppConfig } from '@/types'; // Removido AppearanceSettings pois não existe no seu types.ts

export default function SettingsPage() {
  const [db, setDb] = useState<Firestore | null>(null);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    setError(null);
    setLoading(true);
    try {
      const firestoreDb = await getFirebaseDb();
      if (!firestoreDb) throw new Error("Não foi possível conectar ao banco de dados.");
      setDb(firestoreDb);

      const appConfigRef = doc(firestoreDb, 'configuracoes', 'app');
      const appConfigSnap = await getDoc(appConfigRef);

      if (appConfigSnap.exists()) {
        setAppConfig(appConfigSnap.data() as AppConfig);
      } else {
        // Se não existir, inicializa com valores padrão para evitar erros de 'null'
        setAppConfig({
          nomeFazenda: "Nome da sua Fazenda",
          subtitulo: "Subtítulo",
          textoIntroducao: "Texto de introdução...",
          textoAgradecimento: "Texto de agradecimento...",
          logoUrl: "",
          corFundo: "#FFFFFF",
          corTexto: "#000000",
          corCartao: "#FAFAFA",
          corDestaque: "#333333",
          corDestaqueTexto: "#FFFFFF",
        });
      }
      
    } catch (err: any) {
      console.error("Erro ao buscar configurações:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveConfig = async () => {
    if (!db || !appConfig) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, 'configuracoes', 'app');
      // Passa o objeto appConfig diretamente, que já está sendo atualizado pelo estado
      await updateDoc(docRef, { ...appConfig }); 
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar as configurações.');
      console.error(error);
    } finally {
        setIsSaving(false);
    }
  };
  
  // Função para lidar com mudanças nos inputs de forma genérica
  const handleConfigChange = (field: keyof AppConfig, value: string) => {
    setAppConfig(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="mr-2 animate-spin" />Carregando configurações...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-semibold">Erro ao Carregar as Configurações</h2>
        <p className="text-muted-foreground">Não foi possível conectar ao banco de dados para buscar os dados.</p>
        <Button onClick={fetchSettings}>
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personalização do Aplicativo</CardTitle>
          <CardDescription>Altere textos, logo e as cores do formulário do hóspede.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-4">
              <div><Label htmlFor="nomeFazenda">Nome da Fazenda</Label><Input id="nomeFazenda" value={appConfig?.nomeFazenda || ''} onChange={e => handleConfigChange('nomeFazenda', e.target.value)} className="mt-1" /></div>
              <div><Label htmlFor="logoUrl">URL do Logo</Label><Input id="logoUrl" value={appConfig?.logoUrl || ''} onChange={e => handleConfigChange('logoUrl', e.target.value)} placeholder="https://exemplo.com/logo.png" className="mt-1" /></div>
              <div><Label htmlFor="subtitulo">Subtítulo</Label><Input id="subtitulo" value={appConfig?.subtitulo || ''} onChange={e => handleConfigChange('subtitulo', e.target.value)} className="mt-1" /></div>
              <div><Label htmlFor="textoIntroducao">Texto de Introdução</Label><Textarea id="textoIntroducao" value={appConfig?.textoIntroducao || ''} onChange={e => handleConfigChange('textoIntroducao', e.target.value)} rows={4} className="mt-1" /></div>
              <div><Label htmlFor="textoAgradecimento">Texto de Agradecimento</Label><Textarea id="textoAgradecimento" value={appConfig?.textoAgradecimento || ''} onChange={e => handleConfigChange('textoAgradecimento', e.target.value)} rows={2} className="mt-1" /></div>
            </div>
            
            <div className="space-y-4 pt-6 border-t">
                <h4 className="font-medium text-base text-[#4B4F36]">Cores do Tema</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><Label htmlFor="corFundo">Fundo da Página</Label><Input id="corFundo" type="color" value={appConfig?.corFundo || ''} onChange={e => handleConfigChange('corFundo', e.target.value)} className="mt-1 h-10"/></div>
                    <div><Label htmlFor="corCartao">Fundo dos Cartões</Label><Input id="corCartao" type="color" value={appConfig?.corCartao || ''} onChange={e => handleConfigChange('corCartao', e.target.value)} className="mt-1 h-10"/></div>
                    <div><Label htmlFor="corTexto">Texto Principal</Label><Input id="corTexto" type="color" value={appConfig?.corTexto || ''} onChange={e => handleConfigChange('corTexto', e.target.value)} className="mt-1 h-10"/></div>
                    <div><Label htmlFor="corDestaque">Destaques (Botões)</Label><Input id="corDestaque" type="color" value={appConfig?.corDestaque || ''} onChange={e => handleConfigChange('corDestaque', e.target.value)} className="mt-1 h-10"/></div>
                    <div><Label htmlFor="corDestaqueTexto">Texto dos Destaques</Label><Input id="corDestaqueTexto" type="color" value={appConfig?.corDestaqueTexto || ''} onChange={e => handleConfigChange('corDestaqueTexto', e.target.value)} className="mt-1 h-10"/></div>
                </div>
            </div>
            <div className="text-right">
              <Button onClick={handleSaveConfig} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                Salvar Todas as Configurações
              </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}