// hooks/use-firebase-data.ts

"use client"

import { useState, useEffect } from "react"
import { signInAnonymously, onAuthStateChanged } from "firebase/auth"
import { collection, getDocs, doc, getDoc, orderBy, query } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import type { HotDish, Cabin, AccompanimentCategory, AppConfig } from "@/types"

export function useFirebaseData() {
  const [hotDishes, setHotDishes] = useState<HotDish[]>([])
  const [cabins, setCabins] = useState<Cabin[]>([])
  const [deliveryTimes, setDeliveryTimes] = useState<string[]>([])
  const [accompaniments, setAccompaniments] = useState<Record<string, AccompanimentCategory>>({})
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null) // Iniciar como null para garantir que os dados foram carregados
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initAuth = () => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          loadData()
        } else {
          signInAnonymously(auth).catch((err) => {
             setError("Falha na autenticação anônima.")
             setLoading(false)
          })
        }
      })
    }
    initAuth()
  }, [])

  const loadData = async () => {
    // Não reinicie o loading aqui para evitar piscar a tela
    // setLoading(true) 

    try {
      // Usamos um objeto temporário para construir a configuração final
      let finalAppConfig: AppConfig = {
        nomeFazenda: "Fazenda do Rosa",
        subtitulo: "Cesta de Café da Manhã Personalizada",
        textoIntroducao: "Preparamos tudo com muito carinho...",
        textoAgradecimento: 'Agradecemos sua colaboração...',
        corPrimaria: "#97A25F",
        corSecundaria: "#4B4F36",
        caloriasMediasPorPessoa: 600,
      };

      // Carregar configurações gerais
      const configDoc = await getDoc(doc(db, "configuracoes", "geral"))
      if (configDoc.exists()) {
        const configData = configDoc.data()
        setDeliveryTimes(configData.horariosEntrega || [])

        if (configData.cabanas && Array.isArray(configData.cabanas)) {
          const cabinList: Cabin[] = configData.cabanas.map((c: any) => ({
            name: c.nomeCabana,
            capacity: c.capacidadeMaxima,
          }))
          setCabins(cabinList)
        }
      }

      // Carregar e mesclar configurações do app
      const appConfigDoc = await getDoc(doc(db, "configuracoes", "app"))
      if (appConfigDoc.exists()) {
        const appConfigData = appConfigDoc.data()
        finalAppConfig = {
            ...finalAppConfig,
            ...appConfigData
        }
      }
      
      // Define o estado de appConfig uma única vez com os dados finais
      setAppConfig(finalAppConfig);

      // Carregar cardápio
      const dishes: HotDish[] = []
      const accompanimentsData: Record<string, AccompanimentCategory> = {}
      const menuQuery = query(collection(db, "cardapio"), orderBy("posicao"));
      const menuSnapshot = await getDocs(menuQuery);

      for (const categoryDoc of menuSnapshot.docs) {
        const categoryData = categoryDoc.data()
        const itemsQuery = query(collection(db, "cardapio", categoryDoc.id, "itens"), orderBy("posicao"));
        const itemsSnapshot = await getDocs(itemsQuery);
        
        const isHotDishCategory = categoryData.nomeCategoria?.toLowerCase().includes('pratos quentes');

        if (isHotDishCategory) {
          for (const itemDoc of itemsSnapshot.docs) {
            const itemData = itemDoc.data()
            if (itemData.disponivel) {
              const dish: HotDish = {
                id: itemDoc.id,
                nomeItem: itemData.nomeItem,
                emoji: itemData.emoji,
                imageUrl: itemData.imageUrl,
                calorias: itemData.calorias || 0,
                disponivel: itemData.disponivel,
                sabores: [],
              }
              const saboresSnapshot = await getDocs(collection(db, "cardapio", categoryDoc.id, "itens", itemDoc.id, "sabores"))
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
    } catch (err: any) {
      console.error("Error loading data:", err)
      setError(`Erro ao carregar dados: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return {
    hotDishes,
    cabins,
    deliveryTimes,
    accompaniments,
    appConfig,
    loading,
    error,
    refetch: loadData,
  }
}