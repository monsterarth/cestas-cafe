"use client"

import { useState, useEffect } from "react"
import { signInAnonymously, onAuthStateChanged } from "firebase/auth"
import { collection, getDocs, doc, getDoc, orderBy, query } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import type { HotDish, Cabin, AccompanimentCategory, AppConfig } from "@/types"

export function useFirebaseData() {
  const [hotDishes, setHotDishes] = useState<HotDish[]>([])
  const [cabins, setCabins] = useState<Cabin[]>([]) // Alterado de Record para Array
  const [deliveryTimes, setDeliveryTimes] = useState<string[]>([])
  const [accompaniments, setAccompaniments] = useState<Record<string, AccompanimentCategory>>({})
  const [appConfig, setAppConfig] = useState<AppConfig>({
    nomeFazenda: "Fazenda do Rosa",
    subtitulo: "Cesta de Café da Manhã Personalizada",
    textoIntroducao:
      "Preparamos tudo com muito carinho para que sua experiência seja inesquecível. Pedimos a gentileza de escolher os itens com consciência, pois os alimentos são frescos e preparados para o seu pedido. Itens não consumidos não poderão ser reaproveitados.",
    textoAgradecimento: 'Agradecemos sua colaboração para evitarmos o desperdício. Para iniciar, clique em "Próximo".',
    corPrimaria: "#97A25F",
    corSecundaria: "#4B4F36",
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initAuth = async () => {
      try {
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            await loadData()
          } else {
            await signInAnonymously(auth)
          }
        })
      } catch (err) {
        setError("Falha na autenticação")
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Carregar configurações gerais
      const configDoc = await getDoc(doc(db, "configuracoes", "geral"))
      if (configDoc.exists()) {
        const configData = configDoc.data()
        setDeliveryTimes(configData.horariosEntrega || [])

        // Mantém a ordem do banco de dados
        if (configData.cabanas && Array.isArray(configData.cabanas)) {
          const cabinList: Cabin[] = configData.cabanas.map((c: any) => ({
            name: c.nomeCabana,
            capacity: c.capacidadeMaxima,
          }))
          setCabins(cabinList)
        }
      }

      // Carregar configurações do app (logo, textos, cores)
      const appConfigDoc = await getDoc(doc(db, "configuracoes", "app"))
      if (appConfigDoc.exists()) {
        const appConfigData = appConfigDoc.data()
        setAppConfig((prev) => ({
          ...prev,
          logoUrl: appConfigData.logoUrl || undefined,
          nomeFazenda: appConfigData.nomeFazenda || prev.nomeFazenda,
          subtitulo: appConfigData.subtitulo || prev.subtitulo,
          textoIntroducao: appConfigData.textoIntroducao || prev.textoIntroducao,
          textoAgradecimento: appConfigData.textoAgradecimento || prev.textoAgradecimento,
          corPrimaria: appConfigData.corPrimaria || prev.corPrimaria,
          corSecundaria: appConfigData.corSecundaria || prev.corSecundaria,
        }))
      }

      // Carregar cardápio
      const dishes: HotDish[] = []
      const accompanimentsData: Record<string, AccompanimentCategory> = {}

      const menuQuery = query(collection(db, "cardapio"), orderBy("posicao"));
      const menuSnapshot = await getDocs(menuQuery);

      for (const categoryDoc of menuSnapshot.docs) {
        const categoryData = categoryDoc.data()
        const itemsQuery = query(collection(db, "cardapio", categoryDoc.id, "itens"), orderBy("posicao"));
        const itemsSnapshot = await getDocs(itemsQuery);

        if (categoryData.nomeCategoria?.toLowerCase().includes('pratos quentes')) {
          for (const itemDoc of itemsSnapshot.docs) {
            const itemData = itemDoc.data()

            if (itemData.disponivel) {
              const dish: HotDish = {
                id: itemDoc.id,
                nomeItem: itemData.nomeItem,
                emoji: itemData.emoji,
                calorias: itemData.calorias || 0,
                disponivel: itemData.disponivel,
                sabores: [],
              }

              const saboresSnapshot = await getDocs(
                collection(db, "cardapio", categoryDoc.id, "itens", itemDoc.id, "sabores"),
              )

              saboresSnapshot.forEach((saborDoc) => {
                const saborData = saborDoc.data()
                if (saborData.disponivel) {
                  dish.sabores.push({
                    id: saborDoc.id,
                    nomeSabor: saborData.nomeSabor,
                    calorias: saborData.calorias || 0,
                    disponivel: saborData.disponivel,
                  })
                }
              })
              if (dish.sabores.length > 0) {
                 dishes.push(dish)
              }
            }
          }
        } else {
          // Carregar acompanhamentos
          const categoryItems: any[] = []
          itemsSnapshot.forEach((itemDoc) => {
            const itemData = itemDoc.data()
            if (itemData.disponivel) {
              categoryItems.push({
                id: itemDoc.id,
                nomeItem: itemData.nomeItem,
                emoji: itemData.emoji,
                calorias: itemData.calorias || 0,
                disponivel: itemData.disponivel,
                descricaoPorcao: itemData.descricaoPorcao,
              })
            }
          })

          if (categoryItems.length > 0) {
            accompanimentsData[categoryDoc.id] = {
              id: categoryDoc.id,
              name: categoryData.nomeCategoria,
              items: categoryItems,
            }
          }
        }
      }

      setHotDishes(dishes)
      setAccompaniments(accompanimentsData)
      setError(null)
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Erro ao carregar dados do cardápio")
    } finally {
      setLoading(false)
    }
  }

  return {
    hotDishes,
    cabins, // Alterado para a lista
    deliveryTimes,
    accompaniments,
    appConfig,
    loading,
    error,
    refetch: loadData,
  }
}