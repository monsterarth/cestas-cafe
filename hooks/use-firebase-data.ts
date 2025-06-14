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
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initAuthAndLoadData = () => {
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
    initAuthAndLoadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    setLoading(true) 

    try {
      // Executa buscas independentes em paralelo
      const [configGeralDoc, appConfigDoc, menuSnapshot] = await Promise.all([
        getDoc(doc(db, "configuracoes", "geral")),
        getDoc(doc(db, "configuracoes", "app")),
        getDocs(query(collection(db, "cardapio"), orderBy("posicao")))
      ]);
      
      // Processa configurações gerais
      if (configGeralDoc.exists()) {
        const configData = configGeralDoc.data()
        setDeliveryTimes(configData.horariosEntrega || [])
        if (configData.cabanas && Array.isArray(configData.cabanas)) {
          const cabinList: Cabin[] = configData.cabanas.map((c: any) => ({
            name: c.nomeCabana,
            capacity: c.capacidadeMaxima,
          }))
          setCabins(cabinList)
        }
      }

      // Processa e mescla configurações do app
      const finalAppConfig: AppConfig = {
        nomeFazenda: "Fazenda do Rosa",
        subtitulo: "Cesta de Café da Manhã Personalizada",
        textoIntroducao: "Preparamos tudo com muito carinho...",
        textoAgradecimento: 'Agradecemos sua colaboração...',
        corPrimaria: "#97A25F",
        corSecundaria: "#4B4F36",
        caloriasMediasPorPessoa: 600,
        ...appConfigDoc.data()
      };
      setAppConfig(finalAppConfig);

      // Processa cardápio
      const dishes: HotDish[] = []
      const accompanimentsData: Record<string, AccompanimentCategory> = {}

      // Mapeia todas as buscas de subcoleções em um array de promessas
      const itemPromises = menuSnapshot.docs.map(async (categoryDoc) => {
        const categoryData = categoryDoc.data();
        const itemsQuery = query(collection(db, "cardapio", categoryDoc.id, "itens"), orderBy("posicao"));
        const itemsSnapshot = await getDocs(itemsQuery);
        
        const isHotDishCategory = categoryData.nomeCategoria?.toLowerCase().includes('pratos quentes');

        if (isHotDishCategory) {
          for (const itemDoc of itemsSnapshot.docs) {
            const itemData = itemDoc.data();
            if (itemData.disponivel) {
              const saboresSnapshot = await getDocs(collection(db, "cardapio", categoryDoc.id, "itens", itemDoc.id, "sabores"));
              const sabores = saboresSnapshot.docs
                .map(saborDoc => ({ id: saborDoc.id, ...saborDoc.data() }))
                .filter(saborData => saborData.disponivel);
              
              if (sabores.length > 0) {
                dishes.push({
                  id: itemDoc.id,
                  nomeItem: itemData.nomeItem,
                  emoji: itemData.emoji,
                  imageUrl: itemData.imageUrl,
                  calorias: itemData.calorias || 0,
                  disponivel: itemData.disponivel,
                  sabores: sabores as any,
                });
              }
            }
          }
        } else {
          const categoryItems = itemsSnapshot.docs
            .map(itemDoc => ({ id: itemDoc.id, ...itemDoc.data() }))
            .filter(itemData => itemData.disponivel);

          if (categoryItems.length > 0) {
            accompanimentsData[categoryDoc.id] = {
              id: categoryDoc.id,
              name: categoryData.nomeCategoria,
              items: categoryItems as any,
            };
          }
        }
      });

      await Promise.all(itemPromises);

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