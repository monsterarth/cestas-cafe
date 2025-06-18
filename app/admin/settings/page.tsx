"use client"

import { useState, useEffect } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  corPrimaria: string
  corSecundaria: string
  caloriasMediasPorPessoa: number
}

interface GeneralConfig {
  cabanas: Array<{ nomeCabana: string; capacidadeMaxima: number }>
  horariosEntrega: string[]
}

export default function SettingsPage() {
  const [appConfig, setAppConfig] = useState<AppConfig>({
    nomeFazenda: "",
    logoUrl: "",
    subtitulo: "",
    textoIntroducao: "",
    textoAgradecimento: "",
    corPrimaria: "#97A25F",
    corSecundaria: "#4B4F36",
    caloriasMediasPorPessoa: 600,
  })

  const [generalConfig, setGeneralConfig] = useState<GeneralConfig>({
    cabanas: [],
    horariosEntrega: [],
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadConfigurations()
  }, [])

  const loadConfigurations = async () => {
    try {
      // Load app config
      const appConfigDoc = await getDoc(doc(db, "configuracoes", "app"))
      if (appConfigDoc.exists()) {
        setAppConfig((prev) => ({ ...prev, ...appConfigDoc.data() }))
      }

      // Load general config
      const generalConfigDoc = await getDoc(doc(db, "configuracoes", "geral"))
      if (generalConfigDoc.exists()) {
        setGeneralConfig((prev) => ({ ...prev, ...generalConfigDoc.data() }))
      }
    } catch (error) {
      console.error("Error loading configurations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAppConfig = async (formData: FormData) => {
    setSaving(true)
    try {
      const configData = {
        nomeFazenda: formData.get("nomeFazenda") as string,
        logoUrl: formData.get("logoUrl") as string,
        subtitulo: formData.get("subtitulo") as string,
        textoIntroducao: formData.get("textoIntroducao") as string,
        textoAgradecimento: formData.get("textoAgradecimento") as string,
        corPrimaria: formData.get("corPrimaria") as string,
        corSecundaria: formData.get("corSecundaria") as string,
        caloriasMediasPorPessoa: Number.parseInt(formData.get("caloriasMediasPorPessoa") as string) || 600,
      }

      await setDoc(doc(db, "configuracoes", "app"), configData, { merge: true })
      setAppConfig(configData)
      alert("Personalização salva com sucesso!")
    } catch (error) {
      console.error("Error saving app config:", error)
      alert("Erro ao salvar personalização.")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCabanas = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, "configuracoes", "geral"), { cabanas: generalConfig.cabanas }, { merge: true })
      alert("Cabanas salvas com sucesso!")
    } catch (error) {
      console.error("Error saving cabanas:", error)
      alert("Erro ao salvar cabanas.")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveHorarios = async () => {
    setSaving(true)
    try {
      await setDoc(
        doc(db, "configuracoes", "geral"),
        { horariosEntrega: generalConfig.horariosEntrega },
        { merge: true },
      )
      alert("Horários salvos com sucesso!")
    } catch (error) {
      console.error("Error saving horarios:", error)
      alert("Erro ao salvar horários.")
    } finally {
      setSaving(false)
    }
  }

  const addCabana = () => {
    const name = prompt("Nome da Cabana:")
    const capacity = prompt("Capacidade Máxima:")

    if (name && capacity) {
      setGeneralConfig((prev) => ({
        ...prev,
        cabanas: [...prev.cabanas, { nomeCabana: name, capacidadeMaxima: Number.parseInt(capacity) }],
      }))
    }
  }

  const removeCabana = (index: number) => {
    setGeneralConfig((prev) => ({
      ...prev,
      cabanas: prev.cabanas.filter((_, i) => i !== index),
    }))
  }

  const addHorario = () => {
    const horario = prompt("Novo Horário (HH:MM):")

    if (horario && horario.match(/^\d{2}:\d{2}$/)) {
      setGeneralConfig((prev) => ({
        ...prev,
        horariosEntrega: [...prev.horariosEntrega, horario],
      }))
    } else if (horario) {
      alert("Use o formato HH:MM.")
    }
  }

  const removeHorario = (index: number) => {
    setGeneralConfig((prev) => ({
      ...prev,
      horariosEntrega: prev.horariosEntrega.filter((_, i) => i !== index),
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-[#97A25F] rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-[#4B4F36]">Configurações</h3>
        <p className="text-[#ADA192] mt-1">Gerencie os parâmetros do sistema e a aparência do aplicativo.</p>
      </div>

      {/* Personalização do Aplicativo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#4B4F36]">Personalização do Aplicativo</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSaveAppConfig} className="space-y-4">
            <div>
              <Label htmlFor="nomeFazenda">Nome da Fazenda</Label>
              <Input id="nomeFazenda" name="nomeFazenda" defaultValue={appConfig.nomeFazenda} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="logoUrl">URL do Logo</Label>
              <Input
                id="logoUrl"
                name="logoUrl"
                defaultValue={appConfig.logoUrl}
                placeholder="https://exemplo.com/logo.png"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="subtitulo">Subtítulo</Label>
              <Input id="subtitulo" name="subtitulo" defaultValue={appConfig.subtitulo} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="textoIntroducao">Texto de Introdução</Label>
              <Textarea
                id="textoIntroducao"
                name="textoIntroducao"
                defaultValue={appConfig.textoIntroducao}
                rows={4}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="textoAgradecimento">Texto de Agradecimento</Label>
              <Textarea
                id="textoAgradecimento"
                name="textoAgradecimento"
                defaultValue={appConfig.textoAgradecimento}
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="caloriasMediasPorPessoa">Total de Calorias Ideal por Pessoa</Label>
              <Input
                id="caloriasMediasPorPessoa"
                name="caloriasMediasPorPessoa"
                type="number"
                defaultValue={appConfig.caloriasMediasPorPessoa}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="corPrimaria">Cor Primária (Destaque)</Label>
                <Input
                  id="corPrimaria"
                  name="corPrimaria"
                  type="color"
                  defaultValue={appConfig.corPrimaria}
                  className="mt-1 h-10"
                />
              </div>
              <div>
                <Label htmlFor="corSecundaria">Cor Secundária (Texto)</Label>
                <Input
                  id="corSecundaria"
                  name="corSecundaria"
                  type="color"
                  defaultValue={appConfig.corSecundaria}
                  className="mt-1 h-10"
                />
              </div>
            </div>

            <div className="text-right">
              <Button type="submit" disabled={saving} className="bg-[#97A25F] hover:bg-[#97A25F]/90">
                {saving ? "Salvando..." : "Salvar Personalização"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Gerenciar Cabanas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#4B4F36]">Gerenciar Cabanas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            {generalConfig.cabanas.map((cabana, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <span className="text-[#4B4F36]">
                  {cabana.nomeCabana} (Cap: {cabana.capacidadeMaxima})
                </span>
                <Button variant="ghost" size="sm" onClick={() => removeCabana(index)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={addCabana} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Cabana
            </Button>
            <Button onClick={handleSaveCabanas} disabled={saving} className="bg-[#97A25F] hover:bg-[#97A25F]/90">
              {saving ? "Salvando..." : "Salvar Cabanas"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gerenciar Horários */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#4B4F36]">Gerenciar Horários de Entrega</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            {generalConfig.horariosEntrega.map((horario, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <span className="text-[#4B4F36]">{horario}</span>
                <Button variant="ghost" size="sm" onClick={() => removeHorario(index)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={addHorario} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Horário
            </Button>
            <Button onClick={handleSaveHorarios} disabled={saving} className="bg-[#97A25F] hover:bg-[#97A25F]/90">
              {saving ? "Salvando..." : "Salvar Horários"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
