"use client"

import { useState, useEffect } from "react"
import { getFirebaseDb, isFirebaseAvailable } from "@/lib/firebase"
import type { HotDish, Cabin, AccompanimentCategory, AppConfig } from "@/types"

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
    try {
      // Set default configuration first
      const defaultAppConfig: AppConfig = {
        nomeFazenda: "Fazenda do Rosa",
        subtitulo: "Cesta de Café da Manhã Personalizada",
        textoIntroducao:
          "Preparamos sua cesta de café da manhã com muito carinho, usando ingredientes frescos e selecionados especialmente para você. Escolha seus itens favoritos e personalize sua experiência gastronômica conosco.",
        textoAgradecimento: "Agradecemos sua preferência e esperamos que tenha uma experiência maravilhosa!",
        corPrimaria: "#97A25F",
        corSecundaria: "#4B4F36",
        caloriasMediasPorPessoa: 600,
      }

      // Set default data
      const defaultCabins: Cabin[] = [
        { name: "Cabana 1", capacity: 2 },
        { name: "Cabana 2", capacity: 4 },
        { name: "Cabana 3", capacity: 6 },
        { name: "Cabana 4", capacity: 2 },
        { name: "Cabana 5", capacity: 4 },
      ]

      const defaultDeliveryTimes = ["07:00", "07:30", "08:00", "08:30", "09:00", "09:30"]

      const defaultHotDishes: HotDish[] = [
        {
          id: "tapioca",
          nomeItem: "Tapioca",
          emoji: "🥞",
          calorias: 150,
          disponivel: true,
          sabores: [
            { id: "queijo", nomeSabor: "Queijo", calorias: 50, disponivel: true },
            { id: "doce", nomeSabor: "Doce de Leite", calorias: 80, disponivel: true },
            { id: "frango", nomeSabor: "Frango Desfiado", calorias: 70, disponivel: true },
          ],
        },
        {
          id: "omelete",
          nomeItem: "Omelete",
          emoji: "🍳",
          calorias: 200,
          disponivel: true,
          sabores: [
            { id: "simples", nomeSabor: "Simples", calorias: 20, disponivel: true },
            { id: "queijo", nomeSabor: "Com Queijo", calorias: 50, disponivel: true },
            { id: "presunto", nomeSabor: "Presunto e Queijo", calorias: 80, disponivel: true },
          ],
        },
        {
          id: "panqueca",
          nomeItem: "Panqueca",
          emoji: "🥞",
          calorias: 180,
          disponivel: true,
          sabores: [
            { id: "doce", nomeSabor: "Doce", calorias: 100, disponivel: true },
            { id: "salgada", nomeSabor: "Salgada", calorias: 60, disponivel: true },
          ],
        },
      ]

      const defaultAccompaniments: Record<string, AccompanimentCategory> = {
        paes: {
          id: "paes",
          name: "Pães",
          items: [
            {
              id: "pao-frances",
              nomeItem: "Pão Francês",
              emoji: "🥖",
              calorias: 150,
              disponivel: true,
              descricaoPorcao: "2 unidades",
            },
            {
              id: "pao-integral",
              nomeItem: "Pão Integral",
              emoji: "🍞",
              calorias: 120,
              disponivel: true,
              descricaoPorcao: "2 fatias",
            },
            {
              id: "pao-doce",
              nomeItem: "Pão Doce",
              emoji: "🥐",
              calorias: 200,
              disponivel: true,
              descricaoPorcao: "1 unidade",
            },
          ],
        },
        bebidas: {
          id: "bebidas",
          name: "Bebidas",
          items: [
            { id: "cafe", nomeItem: "Café", emoji: "☕", calorias: 5, disponivel: true, descricaoPorcao: "1 xícara" },
            { id: "leite", nomeItem: "Leite", emoji: "🥛", calorias: 150, disponivel: true, descricaoPorcao: "1 copo" },
            {
              id: "suco-laranja",
              nomeItem: "Suco de Laranja",
              emoji: "🍊",
              calorias: 110,
              disponivel: true,
              descricaoPorcao: "1 copo",
            },
            { id: "cha", nomeItem: "Chá", emoji: "🍵", calorias: 2, disponivel: true, descricaoPorcao: "1 xícara" },
          ],
        },
        doces: {
          id: "doces",
          name: "Bolos",
          items: [
            {
              id: "bolo-chocolate",
              nomeItem: "Bolo de Chocolate",
              emoji: "🍰",
              calorias: 250,
              disponivel: true,
              descricaoPorcao: "1 fatia",
            },
            {
              id: "bolo-cenoura",
              nomeItem: "Bolo de Cenoura",
              emoji: "🥕",
              calorias: 220,
              disponivel: true,
              descricaoPorcao: "1 fatia",
            },
            {
              id: "bolo-limao",
              nomeItem: "Bolo de Limão",
              emoji: "🍋",
              calorias: 200,
              disponivel: true,
              descricaoPorcao: "1 fatia",
            },
          ],
        },
        frutas: {
          id: "frutas",
          name: "Frutas",
          items: [
            {
              id: "banana",
              nomeItem: "Banana",
              emoji: "🍌",
              calorias: 90,
              disponivel: true,
              descricaoPorcao: "1 unidade",
            },
            { id: "maca", nomeItem: "Maçã", emoji: "🍎", calorias: 80, disponivel: true, descricaoPorcao: "1 unidade" },
            { id: "mamao", nomeItem: "Mamão", emoji: "🥭", calorias: 60, disponivel: true, descricaoPorcao: "1 fatia" },
          ],
        },
      }

      // Always set defaults first
      setAppConfig(defaultAppConfig)
      setCabins(defaultCabins)
      setDeliveryTimes(defaultDeliveryTimes)
      setHotDishes(defaultHotDishes)
      setAccompaniments(defaultAccompaniments)

      // Try to load from Firebase only if it's available
      if (!isFirebaseAvailable()) {
        console.log("Firebase not available, using default data")
        setError(null)
        setLoading(false)
        return
      }

      try {
        const db = await getFirebaseDb()
        if (!db) {
          console.log("Firestore not available, using default data")
          setError(null)
          setLoading(false)
          return
        }

        // Dynamic imports to avoid initialization issues
        const { collection, getDocs, doc, getDoc, orderBy, query } = await import("firebase/firestore")

        // Try to load configurations
        const configDoc = await getDoc(doc(db, "configuracoes", "geral"))
        if (configDoc.exists()) {
          const configData = configDoc.data()
          if (configData.horariosEntrega) {
            setDeliveryTimes(configData.horariosEntrega)
          }

          if (configData.cabanas && Array.isArray(configData.cabanas)) {
            const cabinList: Cabin[] = configData.cabanas.map((c: any) => ({
              name: c.nomeCabana,
              capacity: c.capacidadeMaxima,
            }))
            setCabins(cabinList)
          }
        }

        // Try to load app config
        const appConfigDoc = await getDoc(doc(db, "configuracoes", "app"))
        if (appConfigDoc.exists()) {
          const appConfigData = appConfigDoc.data()
          setAppConfig({
            ...defaultAppConfig,
            ...appConfigData,
          })
        }

        // Try to load menu
        const menuQuery = query(collection(db, "cardapio"), orderBy("posicao"))
        const menuSnapshot = await getDocs(menuQuery)

        if (!menuSnapshot.empty) {
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
                  const dish: HotDish = {
                    id: itemDoc.id,
                    nomeItem: itemData.nomeItem,
                    emoji: itemData.emoji,
                    imageUrl: itemData.imageUrl,
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

          if (dishes.length > 0) {
            setHotDishes(dishes)
          }

          if (Object.keys(accompanimentsData).length > 0) {
            setAccompaniments(accompanimentsData)
          }
        }
      } catch (firebaseError) {
        console.warn("Firebase data loading failed, using default data:", firebaseError)
        // Keep using default data - no error state needed
      }

      setError(null)
    } catch (err: any) {
      console.error("Error loading data:", err)
      // Even if there's an error, we have default data, so don't show error to user
      setError(null)
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
