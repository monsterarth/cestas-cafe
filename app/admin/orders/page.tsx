"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Printer } from "lucide-react"

interface Order {
  id: string
  hospedeNome: string
  cabanaNumero: string
  horarioEntrega: string
  numeroPessoas: number
  status: string
  timestampPedido: any
  itensPedido: Array<{
    nomeItem: string
    quantidade: number
    observacao?: string
    paraPessoa?: string
  }>
  observacoesGerais?: string
  observacoesPratosQuentes?: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
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

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "pedidos", orderId), { status: newStatus })
      setIsModalOpen(false)
    } catch (error) {
      console.error("Error updating order status:", error)
    }
  }

  const handlePrintOrder = () => {
    if (!selectedOrder) return

    const printContent = `
      <div style="font-family: 'Courier New', monospace; width: 80mm; font-size: 12px; font-weight: bold;">
        <div style="text-align: center; margin-bottom: 10px;">
          <h3 style="font-size: 1.2em; margin: 0;">FAZENDA DO ROSA</h3>
          <p style="font-size: 0.9em; margin: 0;">Comanda de Café da Manhã</p>
        </div>
        <p><strong>CABANA:</strong> ${selectedOrder.cabanaNumero}</p>
        <p><strong>HÓSPEDE:</strong> ${selectedOrder.hospedeNome}</p>
        <p><strong>ENTREGA:</strong> ${selectedOrder.horarioEntrega}</p>
        <p><strong>PESSOAS:</strong> ${selectedOrder.numeroPessoas}</p>
        <p><strong>PEDIDO:</strong> #${selectedOrder.id.substring(0, 6)}</p>
        <p><strong>DATA:</strong> ${selectedOrder.timestampPedido?.toDate().toLocaleDateString("pt-BR")}</p>
        <hr style="border: 0; border-top: 1px dashed black; margin: 10px 0;">
        ${(selectedOrder.itensPedido || [])
          .map(
            (item) => `
          <div style="margin-bottom: 2px;">
            <span><strong>${item.quantidade}x</strong> ${item.nomeItem}</span>
            ${item.observacao ? `<br><span style="padding-left: 15px; font-style: italic;">Obs: ${item.observacao}</span>` : ""}
          </div>
        `,
          )
          .join("")}
        ${
          selectedOrder.observacoesPratosQuentes
            ? `
          <hr style="border: 0; border-top: 1px dashed black; margin: 10px 0;">
          <div>
            <h5 style="font-weight: bold; text-transform: uppercase;">Obs. Pratos Quentes</h5>
            <p>${selectedOrder.observacoesPratosQuentes}</p>
          </div>
        `
            : ""
        }
        ${
          selectedOrder.observacoesGerais
            ? `
          <hr style="border: 0; border-top: 1px dashed black; margin: 10px 0;">
          <div>
            <h4 style="font-weight: bold; text-transform: uppercase;">Obs. Gerais</h4>
            <p>${selectedOrder.observacoesGerais}</p>
          </div>
        `
            : ""
        }
      </div>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Comanda - ${selectedOrder.cabanaNumero}</title></head>
          <body>${printContent}</body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Novo":
        return "bg-blue-100 text-blue-800"
      case "Em Preparação":
        return "bg-amber-100 text-amber-800"
      case "Entregue":
        return "bg-green-100 text-green-800"
      case "Cancelado":
        return "bg-red-100 text-red-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-[#97A25F] rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h3 className="text-xl font-semibold text-[#4B4F36]">Pedidos Recebidos</h3>
          <p className="text-[#ADA192] mt-1">A lista é atualizada em tempo real.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-2 sm:p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 font-medium text-[#ADA192]">Data/Hora</th>
                  <th className="p-3 font-medium text-[#ADA192]">Cabana</th>
                  <th className="p-3 font-medium text-[#ADA192]">Hóspede</th>
                  <th className="p-3 font-medium text-[#ADA192]">Entrega</th>
                  <th className="p-3 font-medium text-[#ADA192]">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleOrderClick(order)}
                  >
                    <td className="p-3 whitespace-nowrap text-[#4B4F36]">
                      {order.timestampPedido?.toDate().toLocaleString("pt-BR") || "N/A"}
                    </td>
                    <td className="p-3 font-medium text-[#4B4F36]">{order.cabanaNumero}</td>
                    <td className="p-3 text-[#4B4F36]">{order.hospedeNome}</td>
                    <td className="p-3 text-[#4B4F36]">{order.horarioEntrega}</td>
                    <td className="p-3">
                      <span
                        className={`font-medium px-2.5 py-0.5 rounded-full text-xs ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Pedido */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#4B4F36]">
              Detalhes do Pedido #{selectedOrder?.id.substring(0, 6)}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Informações do Pedido */}
              <div className="grid grid-cols-3 gap-4 text-sm border-b pb-4">
                <div>
                  <p>
                    <strong>CABANA:</strong> {selectedOrder.cabanaNumero}
                  </p>
                  <p>
                    <strong>PESSOAS:</strong> {selectedOrder.numeroPessoas}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>HÓSPEDE:</strong> {selectedOrder.hospedeNome}
                  </p>
                  <p>
                    <strong>PEDIDO:</strong> #{selectedOrder.id.substring(0, 6)}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>ENTREGA:</strong> {selectedOrder.horarioEntrega}
                  </p>
                  <p>
                    <strong>DATA:</strong> {selectedOrder.timestampPedido?.toDate().toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              {/* Itens do Pedido */}
              <div>
                <h4 className="font-bold text-md mb-2 text-[#4B4F36]">ITENS DO PEDIDO</h4>
                <ul className="space-y-1">
                  {(selectedOrder.itensPedido || []).map((item, index) => (
                    <li key={index} className="text-sm">
                      <strong>
                        {item.quantidade}x {item.nomeItem}
                      </strong>
                      {item.observacao && (
                        <div>
                          <br />
                          <em className="ml-4 text-gray-600 text-xs">Obs: {item.observacao}</em>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Observações */}
              {selectedOrder.observacoesPratosQuentes && (
                <div>
                  <h5 className="font-semibold text-sm text-[#4B4F36]">Obs. Gerais (Pratos Quentes):</h5>
                  <p className="text-sm italic pl-2 border-l-2 border-gray-300">
                    {selectedOrder.observacoesPratosQuentes}
                  </p>
                </div>
              )}

              {selectedOrder.observacoesGerais && (
                <div>
                  <h4 className="font-bold text-md text-[#4B4F36]">Observações Gerais do Pedido</h4>
                  <p className="text-sm font-semibold">{selectedOrder.observacoesGerais}</p>
                </div>
              )}

              {/* Controles */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center gap-2">
                  <label className="font-medium text-[#4B4F36]">Status:</label>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => handleStatusUpdate(selectedOrder.id, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Novo">Novo</SelectItem>
                      <SelectItem value="Em Preparação">Em Preparação</SelectItem>
                      <SelectItem value="Entregue">Entregue</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Fechar
                  </Button>
                  <Button onClick={handlePrintOrder} className="bg-[#4B4F36] hover:bg-[#4B4F36]/90">
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir Comanda
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
