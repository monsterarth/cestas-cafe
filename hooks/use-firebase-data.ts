"use client"

import { useState, useEffect } from "react"
import { getFirebaseDb, isFirebaseAvailable } from "@/lib/firebase"
import type { HotDish, Cabin, AccompanimentCategory, AppConfig, Flavor, AccompanimentItem } from "@/types"
export function useFirebaseData() {
  const [hotDishes, setHotDishes] = useState<HotDish[]>([])
  const [cabins, setCabins] = useState<Cabin[]>([])
  const [deliveryTimes, setDeliveryTimes] = useState<string[]>([])
  const [accompaniments, setAccompaniments] = useState<Record<string, AccompanimentCategory>>({})
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    if (!isFirebaseAvailable()) {
      setError("A conexão com o banco de dados não foi configurada. Verifique as variáveis de ambiente e reinicie o servidor.")
      setLoading(false)
      return
    }

    try {
      const db = await getFirebaseDb()
      if (!db) throw new Error("Falha ao inicializar o Firestore.")

      const { collection, getDocs, doc, getDoc, orderBy, query } = await import("firebase/firestore")

      const appConfigDoc = await getDoc(doc(db, "configuracoes", "app"))
      if (appConfigDoc.exists()) setAppConfig(appConfigDoc.data() as AppConfig)
      else throw new Error("Documento de configuração do aplicativo ('app') não encontrado no Firestore.")

      const generalConfigDoc = await getDoc(doc(db, "configuracoes", "geral"))
      if (generalConfigDoc.exists()) {
        const configData = generalConfigDoc.data()
        setDeliveryTimes(configData.horariosEntrega || [])
        const cabinList: Cabin[] = (configData.cabanas || []).map((c: any) => ({
          name: c.nomeCabana,
          capacity: c.capacidadeMaxima,
        }))
        setCabins(cabinList)
      } else {
        throw new Error("Documento de configurações gerais ('geral') não encontrado no Firestore.")
      }

      const menuQuery = query(collection(db, "cardapio"), orderBy("posicao"))
      const menuSnapshot = await getDocs(menuQuery)

      const dishes: HotDish[] = []
      const accompanimentsData: Record<string, AccompanimentCategory> = {}

      for (const categoryDoc of menuSnapshot.docs) {
        const categoryData = categoryDoc.data()
        const itemsQuery = query(collection(db, "cardapio", categoryDoc.id, "itens"), orderBy("posicao"))
        const itemsSnapshot = await getDocs(itemsQuery)
        const isHotDishCategory = categoryData.nomeCategoria?.toLowerCase().includes("pratos quentes")

        if (isHotDishCategory) {
          for (const itemDoc of itemsSnapshot.docs) {
            const itemData = itemDoc.data()
            if (itemData.disponivel) {
              const saboresQuery = query(collection(db, "cardapio", categoryDoc.id, "itens", itemDoc.id, "sabores"), orderBy("posicao"));
              const saboresSnapshot = await getDocs(saboresQuery)
              const sabores: Flavor[] = []
              saboresSnapshot.forEach((saborDoc) => {
                const saborData = saborDoc.data()
                if (saborData.disponivel) {
                  sabores.push({
                    id: saborDoc.id,
                    nomeSabor: saborData.nomeSabor,
                    disponivel: saborData.disponivel,
                    posicao: saborData.posicao || 0,
                  })
                }
              })

              if (sabores.length > 0) {
                dishes.push({
                  id: itemDoc.id,
                  nomeItem: itemData.nomeItem,
                  emoji: itemData.emoji,
                  disponivel: itemData.disponivel,
                  sabores: sabores,
                  imageUrl: itemData.imageUrl,
                })
              }
            }
          }
        } else {
          const categoryItems: AccompanimentItem[] = []
          itemsSnapshot.forEach((itemDoc) => {
            const itemData = itemDoc.data()
            if (itemData.disponivel) {
              categoryItems.push({
                id: itemDoc.id,
                nomeItem: itemData.nomeItem,
                emoji: itemData.emoji,
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
    } catch (err: any) {
      console.error("Erro ao carregar dados do Firebase:", err)
      setError(`Falha ao carregar dados: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return { hotDishes, cabins, deliveryTimes, accompaniments, appConfig, loading, error, refetch: loadData }
}