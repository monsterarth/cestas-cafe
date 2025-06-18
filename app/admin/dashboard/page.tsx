"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Clock, CheckCircle, AlertCircle } from "lucide-react"

interface Order {
  id: string
  hospedeNome: string
  cabanaNumero: string
  horarioEntrega: string
  status: string
  timestampPedido: any
  itensPedido: Array<{
    nomeItem: string
    quantidade: number
  }>
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ordersQuery = query(collection(db, "pedidos"), orderBy("timestampPedido", "desc"))

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[]

        setOrders(ordersData)
        setLoading(false)
      },
      (error) => {
        console.error("Error loading orders:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  // Calcular estatísticas
  const newOrders = orders.filter((o) => o.status === "Novo").length
  const inPrepOrders = orders.filter((o) => o.status === "Em Preparação").length
  const deliveredToday = orders.filter((o) => {
    const orderDate = o.timestampPedido?.toDate?.()
    const today = new Date()
    return o.status === "Entregue" && orderDate && orderDate.toDateString() === today.toDateString()
  }).length

  // Pedidos recentes em aberto
  const recentOpenOrders = orders.filter((o) => ["Novo", "Em Preparação"].includes(o.status)).slice(0, 5)

  // Itens mais pedidos
  const itemCounts: Record<string, number> = {}
  orders.forEach((order) => {
    ;(order.itensPedido || []).forEach((item) => {
      const itemName = item.nomeItem.split(" - ")[0]
      itemCounts[itemName] = (itemCounts[itemName] || 0) + item.quantidade
    })
  })

  const topItems = Object.entries(itemCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, quantity]) => ({ name, quantity }))

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-[#97A25F] rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-[#4B4F36]">Dashboard</h3>
        <p className="text-[#ADA192] mt-1">Visão geral dos pedidos e estatísticas.</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#ADA192]">Novos Pedidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#4B4F36]">{newOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#ADA192]">Em Preparação</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#4B4F36]">{inPrepOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#ADA192]">Entregues Hoje</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#4B4F36]">{deliveredToday}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pedidos Recentes */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#4B4F36]">Pedidos em Aberto Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 font-medium text-[#ADA192]">Hóspede</th>
                      <th className="p-3 font-medium text-[#ADA192]">Cabana</th>
                      <th className="p-3 font-medium text-[#ADA192]">Entrega</th>
                      <th className="p-3 font-medium text-[#ADA192]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOpenOrders.length > 0 ? (
                      recentOpenOrders.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium text-[#4B4F36]">{order.hospedeNome}</td>
                          <td className="p-3 text-[#4B4F36]">{order.cabanaNumero}</td>
                          <td className="p-3 text-[#4B4F36]">{order.horarioEntrega}</td>
                          <td className="p-3">
                            <span
                              className={`font-medium px-2.5 py-0.5 rounded-full text-xs ${
                                order.status === "Novo" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-3 text-center text-[#ADA192]">
                          Nenhum pedido em aberto.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Itens Mais Pedidos */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#4B4F36]">Itens Mais Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              {topItems.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topItems} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="quantity" fill="#97A25F" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-[#ADA192]">Nenhum dado disponível</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
