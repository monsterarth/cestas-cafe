// monsterarth/cestas-cafe/cestas-cafe-vfinal/app/admin/settings/page.tsx
"use client"

import { useState, useEffect } from "react"
import { doc, getDoc, setDoc, Firestore } from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Plus } from "lucide-react"

interface AppConfig {
  nomeFazenda: string
  logoUrl: string
  subtitulo: string
  textoIntroducao: string
  textoAgradecimento: string
  corFundo: string
  corTexto: string
  corDestaque: string
  corDestaqueTexto: string
  corCartao: string
}

interface GeneralConfig {
  cabanas: Array<{ nomeCabana: string; capacidadeMaxima: number }>
  horariosEntrega: string[]
}

const DEFAULT_COLORS = {
  corFundo: "#E9D9CD",
  corTexto: "#4B4F36",
  corDestaque: "#97A25F",
  corDestaqueTexto: "#F7FDF2",
  corCartao: "#F7FDF2",
}

export default function SettingsPage() {
  const [db, setDb] = useState<Firestore | null>(null)
  const [appConfig, setAppConfig] = useState<AppConfig>({
    nomeFazenda: "",
    logoUrl: "",
    subtitulo: "",
    textoIntroducao: "",
    textoAgradecimento: "",
    ...DEFAULT_COLORS,
  })

  const [generalConfig, setGeneralConfig] = useState<GeneralConfig>({ cabanas: [], horariosEntrega: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadConfigurations = async () => {
      const firestoreDb = await getFirebaseDb()
      if (!firestoreDb) { setLoading(false); return }
      setDb(firestoreDb)
      try {
        const appConfigDoc = await getDoc(doc(firestoreDb, "configuracoes", "app"))
        if (appConfigDoc.exists()) setAppConfig((prev) => ({ ...prev, ...appConfigDoc.data() }))
        const generalConfigDoc = await getDoc(doc(firestoreDb, "configuracoes", "geral"))
        if (generalConfigDoc.exists()) setGeneralConfig((prev) => ({ ...prev, ...generalConfigDoc.data() }))
      } catch (error) { console.error("Error loading configurations:", error) } 
      finally { setLoading(false) }
    }
    loadConfigurations()
  }, [])

  const handleSaveAppConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!db) return
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    try {
      const configData = {
        nomeFazenda: formData.get("nomeFazenda") as string,
        logoUrl: formData.get("logoUrl") as string,
        subtitulo: formData.get("subtitulo") as string,
        textoIntroducao: formData.get("textoIntroducao") as string,
        textoAgradecimento: formData.get("textoAgradecimento") as string,
        corFundo: formData.get("corFundo") as string,
        corTexto: formData.get("corTexto") as string,
        corDestaque: formData.get("corDestaque") as string,
        corDestaqueTexto: formData.get("corDestaqueTexto") as string,
        corCartao: formData.get("corCartao") as string,
      }
      await setDoc(doc(db, "configuracoes", "app"), configData, { merge: true })
      setAppConfig(configData)
      alert("Personalização salva com sucesso!")
    } catch (error) { console.error("Error saving app config:", error); alert("Erro ao salvar personalização.") } 
    finally { setSaving(false) }
  }

  const handleSaveCabanas = async () => { /* ... (sem alterações) ... */ 
    if (!db) return; setSaving(true);
    try { await setDoc(doc(db, "configuracoes", "geral"), { cabanas: generalConfig.cabanas }, { merge: true }); alert("Cabanas salvas com sucesso!"); } catch (error) { console.error("Error saving cabanas:", error); alert("Erro ao salvar cabanas."); } finally { setSaving(false); }
  }
  const handleSaveHorarios = async () => { /* ... (sem alterações) ... */ 
    if (!db) return; setSaving(true);
    try { await setDoc(doc(db, "configuracoes", "geral"), { horariosEntrega: generalConfig.horariosEntrega }, { merge: true }); alert("Horários salvos com sucesso!"); } catch (error) { console.error("Error saving horarios:", error); alert("Erro ao salvar horários."); } finally { setSaving(false); }
  }
  const addCabana = () => { /* ... (sem alterações) ... */ 
    const name = prompt("Nome da Cabana:"); const capacity = prompt("Capacidade Máxima:"); if (name && capacity) { setGeneralConfig((prev) => ({ ...prev, cabanas: [...prev.cabanas, { nomeCabana: name, capacidadeMaxima: Number.parseInt(capacity) }], })); }
  }
  const removeCabana = (index: number) => { /* ... (sem alterações) ... */ 
    setGeneralConfig((prev) => ({ ...prev, cabanas: prev.cabanas.filter((_, i) => i !== index), }));
  }
  const addHorario = () => { /* ... (sem alterações) ... */ 
    const horario = prompt("Novo Horário (HH:MM):"); if (horario && horario.match(/^\d{2}:\d{2}$/)) { setGeneralConfig((prev) => ({ ...prev, horariosEntrega: [...prev.horariosEntrega, horario], })); } else if (horario) { alert("Use o formato HH:MM."); }
  }
  const removeHorario = (index: number) => { /* ... (sem alterações) ... */ 
    setGeneralConfig((prev) => ({ ...prev, horariosEntrega: prev.horariosEntrega.filter((_, i) => i !== index), }));
  }

  if (loading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-gray-300 border-t-[#97A25F] rounded-full animate-spin"></div></div>

  return (
    <div className="space-y-8">
      <div><h3 className="text-xl font-semibold text-[#4B4F36]">Configurações</h3><p className="text-[#ADA192] mt-1">Gerencie os parâmetros do sistema e a aparência do aplicativo.</p></div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#4B4F36]">Personalização do Aplicativo</CardTitle>
          <CardDescription>Altere textos, logo e as cores do formulário do hóspede.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveAppConfig} className="space-y-6">
            <div className="space-y-4">
              <div><Label htmlFor="nomeFazenda">Nome da Fazenda</Label><Input id="nomeFazenda" name="nomeFazenda" defaultValue={appConfig.nomeFazenda} className="mt-1" /></div>
              <div><Label htmlFor="logoUrl">URL do Logo</Label><Input id="logoUrl" name="logoUrl" defaultValue={appConfig.logoUrl} placeholder="https://exemplo.com/logo.png" className="mt-1" /></div>
              <div><Label htmlFor="subtitulo">Subtítulo</Label><Input id="subtitulo" name="subtitulo" defaultValue={appConfig.subtitulo} className="mt-1" /></div>
              <div><Label htmlFor="textoIntroducao">Texto de Introdução</Label><Textarea id="textoIntroducao" name="textoIntroducao" defaultValue={appConfig.textoIntroducao} rows={4} className="mt-1" /></div>
              <div><Label htmlFor="textoAgradecimento">Texto de Agradecimento</Label><Textarea id="textoAgradecimento" name="textoAgradecimento" defaultValue={appConfig.textoAgradecimento} rows={2} className="mt-1" /></div>
            </div>
            
            <div className="space-y-4 pt-6 border-t">
                <h4 className="font-medium text-base text-[#4B4F36]">Cores do Tema</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><Label htmlFor="corFundo">Fundo da Página</Label><Input id="corFundo" name="corFundo" type="color" defaultValue={appConfig.corFundo} className="mt-1 h-10"/></div>
                    <div><Label htmlFor="corCartao">Fundo dos Cartões</Label><Input id="corCartao" name="corCartao" type="color" defaultValue={appConfig.corCartao} className="mt-1 h-10"/></div>
                    <div><Label htmlFor="corTexto">Texto Principal</Label><Input id="corTexto" name="corTexto" type="color" defaultValue={appConfig.corTexto} className="mt-1 h-10"/></div>
                    <div><Label htmlFor="corDestaque">Destaques (Botões)</Label><Input id="corDestaque" name="corDestaque" type="color" defaultValue={appConfig.corDestaque} className="mt-1 h-10"/></div>
                    <div><Label htmlFor="corDestaqueTexto">Texto dos Destaques</Label><Input id="corDestaqueTexto" name="corDestaqueTexto" type="color" defaultValue={appConfig.corDestaqueTexto} className="mt-1 h-10"/></div>
                </div>
            </div>

            <div className="text-right"><Button type="submit" disabled={saving} className="bg-[#97A25F] hover:bg-[#97A25F]/90">{saving ? "Salvando..." : "Salvar Personalização"}</Button></div>
          </form>
        </CardContent>
      </Card>
      
      {/* Cards de Cabanas e Horários (sem alterações) */}
      <Card><CardHeader><CardTitle className="text-lg font-semibold text-[#4B4F36]">Gerenciar Cabanas</CardTitle></CardHeader><CardContent><div className="space-y-2 mb-4">{generalConfig.cabanas.map((cabana, index) => (<div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"><span className="text-[#4B4F36]">{cabana.nomeCabana} (Cap: {cabana.capacidadeMaxima})</span><Button variant="ghost" size="sm" onClick={() => removeCabana(index)}><Trash2 className="w-4 h-4 text-red-500" /></Button></div>))}</div><div className="flex gap-2"><Button onClick={addCabana} variant="outline"><Plus className="w-4 h-4 mr-2" />Adicionar Cabana</Button><Button onClick={handleSaveCabanas} disabled={saving} className="bg-[#97A25F] hover:bg-[#97A25F]/90">{saving ? "Salvando..." : "Salvar Cabanas"}</Button></div></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-lg font-semibold text-[#4B4F36]">Gerenciar Horários de Entrega</CardTitle></CardHeader><CardContent><div className="space-y-2 mb-4">{generalConfig.horariosEntrega.map((horario, index) => (<div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"><span className="text-[#4B4F36]">{horario}</span><Button variant="ghost" size="sm" onClick={() => removeHorario(index)}><Trash2 className="w-4 h-4 text-red-500" /></Button></div>))}</div><div className="flex gap-2"><Button onClick={addHorario} variant="outline"><Plus className="w-4 h-4 mr-2" />Adicionar Horário</Button><Button onClick={handleSaveHorarios} disabled={saving} className="bg-[#97A25F] hover:bg-[#97A25F]/90">{saving ? "Salvando..." : "Salvar Horários"}</Button></div></CardContent></Card>
    </div>
  )
}