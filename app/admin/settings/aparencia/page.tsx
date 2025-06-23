// Arquivo: app/admin/settings/aparencia/page.tsx
'use client';

import { useState, useEffect, useRef, ChangeEvent, FC } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { AppConfig } from '@/types';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Upload, Palette } from 'lucide-react';
import { type PutBlobResult } from '@vercel/blob';
import { Skeleton } from '@/components/ui/skeleton';

const colorFields: (keyof AppConfig)[] = [
  'corFundo', 'corTexto', 'corDestaque', 'corDestaqueTexto', 'corCartao'
];

// Label do 'corCartao' foi atualizada para maior clareza
const colorLabels: Record<string, string> = {
  corFundo: 'Fundo da Página',
  corTexto: 'Texto Principal',
  corDestaque: 'Destaque (Botões)',
  corDestaqueTexto: 'Texto (Botões)',
  corCartao: 'Fundo (Header/Cards)',
};

// --- COMPONENTE DE PREVIEW ATUALIZADO ---
const ColorPreview: FC<{ config: Partial<AppConfig> }> = ({ config }) => {
  const styles = {
    header: {
      backgroundColor: config.corCartao || '#F7FDF2',
      color: config.corTexto || '#000000',
    },
    page: {
      backgroundColor: config.corFundo || '#FFFFFF',
      color: config.corTexto || '#000000',
    },
    card: {
      backgroundColor: config.corCartao || '#F9FAFB',
      color: config.corTexto || '#000000',
      border: `1px solid ${config.corDestaque || '#000000'}`
    },
    button: {
      backgroundColor: config.corDestaque || '#000000',
      color: config.corDestaqueTexto || '#FFFFFF',
    },
  };

  return (
    <div className="sticky top-6">
      <Label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
        <Palette className="h-4 w-4" />
        Pré-visualização em Tempo Real
      </Label>
      <div className="border rounded-lg overflow-hidden shadow-lg">
        {/* Preview do Header */}
        <div style={styles.header} className="p-6 text-center border-b transition-colors duration-300">
            {config.logoUrl ? (
                <img src={config.logoUrl} alt="Logo Preview" className="h-20 max-w-[200px] w-auto mx-auto object-contain" />
            ) : (
                <div className="h-20 flex items-center justify-center">
                    <h2 className="text-2xl font-bold" style={{ color: config.corTexto }}>
                      Sua Logo Aqui
                    </h2>
                </div>
            )}
            <p className="text-sm opacity-90 mt-2" style={{ color: config.corTexto }}>
                {config.subtitulo || 'Subtítulo da sua aplicação'}
            </p>
        </div>
        {/* Preview do Corpo da Página */}
        <div style={styles.page} className="p-6 transition-colors duration-300">
            <h3 className="text-lg font-bold mb-4">Como ficará a página</h3>
            <div style={styles.card} className="p-4 rounded-md">
              <h4 className="font-semibold mb-2" style={{ color: config.corTexto }}>
                Exemplo de Card
              </h4>
              <p className="text-xs opacity-80 mb-4">
                Este card usa a cor de fundo definida.
              </p>
              <Button style={styles.button} className="w-full transition-colors duration-300">
                Botão de Destaque
              </Button>
            </div>
        </div>
      </div>
    </div>
  );
};


export default function AppearanceSettingsPage() {
  const [config, setConfig] = useState<Partial<AppConfig>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      const db = await getFirebaseDb();
      if (db) {
        const configRef = doc(db, 'configuracoes', 'app');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          setConfig(configSnap.data() as AppConfig);
        }
      }
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  }

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha no upload.');
      }
      
      const newBlob = (await response.json()) as PutBlobResult;
      
      setConfig(prev => ({ ...prev, logoUrl: newBlob.url }));
      toast.success("Logo enviada! Clique em 'Salvar Alterações' para confirmar.");

    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar a imagem. Tente novamente.");
      console.error(error);
    } finally {
      setIsUploading(false);
      if (inputFileRef.current) {
        inputFileRef.current.value = "";
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const db = await getFirebaseDb();
    if (db) {
      try {
        const configRef = doc(db, 'configuracoes', 'app');
        await setDoc(configRef, config, { merge: true });
        toast.success('Configurações de aparência salvas com sucesso!');
      } catch (error) {
        toast.error('Falha ao salvar as configurações.');
        console.error(error);
      }
    }
    setIsSaving(false);
  };

  if (loading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-16 w-1/2" />
            <Skeleton className="h-[500px] w-full" />
        </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
      <Card>
        <CardHeader>
          <CardTitle>Aparência da Aplicação</CardTitle>
          <CardDescription>
            Personalize a logo, subtítulo e as cores. As alterações são exibidas na pré-visualização à direita.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-12 lg:gap-16">
          <div className="space-y-8">
            <div className="space-y-2">
                <Label htmlFor="subtitulo">Subtítulo da Aplicação</Label>
                <Input
                  id="subtitulo"
                  name="subtitulo"
                  value={config.subtitulo || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: Café da Manhã na Cesta"
                />
            </div>

            <div className="space-y-4">
                <Label>Logo da Aplicação</Label>
                <div className="flex items-center gap-4">
                    {config.logoUrl ? (
                        <img src={config.logoUrl} alt="Logo" className="h-16 w-auto max-w-xs rounded-lg object-contain bg-slate-200" />
                    ) : (
                        <div className="h-16 w-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                           Logo
                        </div>
                    )}
                    <input type="file" ref={inputFileRef} onChange={handleLogoUpload} className="hidden" accept="image/png, image/jpeg, image/webp" />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => inputFileRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      {config.logoUrl ? "Trocar Logo" : "Enviar Logo"}
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <Label>Esquema de Cores</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {colorFields.map(field => (
                    <div key={field} className="flex flex-col space-y-2">
                        <Label htmlFor={field} className="text-sm">{colorLabels[field]}</Label>
                        <div className="relative flex items-center">
                            <Input
                                id={field}
                                name={field}
                                type="text"
                                value={(config[field] as string)?.toUpperCase() || '#000000'}
                                onChange={handleInputChange}
                                className="w-full pl-3 pr-10"
                                placeholder="#000000"
                            />
                            <input
                                type="color"
                                value={(config[field] as string) || '#000000'}
                                onChange={handleInputChange}
                                name={field}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 border-none cursor-pointer bg-transparent"
                            />
                        </div>
                    </div>
                    ))}
                </div>
            </div>
          </div>

          <div>
            <ColorPreview config={config} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}