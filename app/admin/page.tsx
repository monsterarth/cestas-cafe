"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react"
import { collection, onSnapshot, orderBy, query, where, Timestamp } from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts"
import { Utensils, Clock, Users, ShoppingBasket, UtensilsCrossed } from "lucide-react"
import type { Order } from "@/types"

const StatsCard = ({ title, value, description, icon: Icon }: { title: string; value: string | number; description: string; icon: React.ElementType }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      <Icon className="h-5 w-5 text-gray-400" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-[#4B4F36]">{value}</div>
      <p className="text-xs text-gray-500">{description}</p>
    </CardContent>
  </Card>
)

const UpcomingDeliveries = ({ schedule }: { schedule: { time: string; orders: Order[] }[] }) => (
  <Card className="lg:col-span-2">
    <CardHeader>
      <CardTitle>Entregas de Hoje</CardTitle>
      <CardDescription>Linha do tempo das cestas programadas para hoje.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      {schedule.length > 0 ? schedule.map(({ time, orders }) => (
        <div key={time} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#97A25F] text-white font-bold">
              {time}
            </div>
            <div className="flex-1 w-px bg-gray-200"></div>
          </div>
          <div className="flex-1 pb-8">
            {orders.map(order => (
              <div key={order.id} className="mb-2 p-3 bg-white border rounded-lg shadow-sm">
                <div className="font-bold text-[#4B4F36]">Cabana {order.cabanaNumero}</div>
                <div className="text-sm text-gray-600">{order.hospedeNome} - {order.numeroPessoas} pessoa(s)</div>
              </div>
            ))}
          </div>
        </div>
      )) : (
        <div className="text-center py-10 text-gray-500">Nenhuma entrega para hoje.</div>
      )}
    </CardContent>
  </Card>
)

const PrepList = ({ items }: { items: { name: string; quantity: number }[] }) => (
    <Card>
        <CardHeader>
            <CardTitle>Itens para Preparar Hoje</CardTitle>
            <CardDescription>Soma de todos os itens para as cestas de hoje.</CardDescription>
        </CardHeader>
        <CardContent>
            {items.length > 0 ? (
                <ul className="space-y-2 max-h-80 overflow-y-auto">
                {items.map(item => (
                    <li key={item.name} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-md">
                        <span className="text-[#4B4F36]">{item.name}</span>
                        <span className="font-bold bg-[#E9D9CD] text-[#4B4F36] px-2 py-0.5 rounded-full">{item.quantity}</span>
                    </li>
                ))}
                </ul>
            ) : (
                <div className="text-center py-10 text-gray-500">Nenhum item a preparar.</div>
            )}
        </CardContent>
    </Card>
)

export default function AdminDashboardPage() {
  const [todaysOrders, setTodaysOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const setupFirestoreListener = async () => {
      const db = await getFirebaseDb()
      if (!db) { setLoading(false); return }
      
      const ordersQuery = query(collection(db, "pedidos"), orderBy("timestampPedido", "desc"));

      const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        const allOrders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const filteredOrders = allOrders.filter(order => {
          let orderDate: Date | null = null;
          if (order.timestampPedido && typeof order.timestampPedido.toDate === 'function') {
            orderDate = order.timestampPedido.toDate();
          } 
          else if (typeof order.timestampPedido === 'string') {
            orderDate = new Date(order.timestampPedido);
          }

          if (orderDate) {
            return orderDate >= todayStart && orderDate <= todayEnd;
          }
          return false;
        });

        setTodaysOrders(filteredOrders);
        setLoading(false);
      }, (error) => { console.error("Error loading orders:", error); setLoading(false); });
      
      return unsubscribe;
    }
    let unsubscribe: (() => void) | undefined;
    setupFirestoreListener().then(unsub => { if (unsub) unsubscribe = unsub; });
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const { stats, deliverySchedule, prepList, ordersByHour } = useMemo(() => {
    const activeOrders = todaysOrders.filter(o => o.status !== 'Cancelado');

    const nextDelivery = activeOrders
      .filter(o => o.status !== 'Entregue')
      .sort((a, b) => a.horarioEntrega.localeCompare(b.horarioEntrega))
      .find(o => true);

    const stats = {
      ordersToday: activeOrders.length,
      nextDelivery: nextDelivery ? `${nextDelivery.horarioEntrega} (Cab. ${nextDelivery.cabanaNumero})` : 'Nenhuma',
      guestsToday: activeOrders.reduce((sum, o) => sum + o.numeroPessoas, 0),
      itemsToPrep: activeOrders.reduce((sum, o) => sum + o.itensPedido.reduce((itemSum, i) => itemSum + i.quantidade, 0), 0)
    };

    const scheduleMap = new Map<string, Order[]>();
    activeOrders.sort((a, b) => a.horarioEntrega.localeCompare(b.horarioEntrega)).forEach(order => {
        const time = order.horarioEntrega;
        if (!scheduleMap.has(time)) scheduleMap.set(time, []);
        scheduleMap.get(time)!.push(order);
    });
    const deliverySchedule = Array.from(scheduleMap.entries()).map(([time, orders]) => ({ time, orders }));

    const prepMap = new Map<string, number>();
    activeOrders.forEach(order => {
        (order.itensPedido || []).forEach(item => {
            prepMap.set(item.nomeItem, (prepMap.get(item.nomeItem) || 0) + item.quantidade);
        });
    });
    const prepList = Array.from(prepMap.entries()).map(([name, quantity]) => ({ name, quantity })).sort((a,b) => b.quantity - a.quantity);

    const hourMap = new Map<string, number>();
    activeOrders.forEach(order => {
        hourMap.set(order.horarioEntrega, (hourMap.get(order.horarioEntrega) || 0) + 1);
    });
    const ordersByHour = Array.from(hourMap.entries()).map(([name, total]) => ({ name, total })).sort((a,b) => a.name.localeCompare(b.name));

    return { stats, deliverySchedule, prepList, ordersByHour };
  }, [todaysOrders]);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-gray-300 border-t-[#97A25F] rounded-full animate-spin"></div></div>

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Pedidos para Hoje" value={stats.ordersToday} description="Total de cestas a entregar" icon={ShoppingBasket} />
        <StatsCard title="Próxima Entrega" value={stats.nextDelivery} description="Horário e cabana" icon={Clock} />
        <StatsCard title="Hóspedes Servidos Hoje" value={stats.guestsToday} description="Total de pessoas nas cestas" icon={Users} />
        <StatsCard title="Itens para Preparar" value={stats.itemsToPrep} description="Soma de todos os produtos" icon={UtensilsCrossed} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <UpcomingDeliveries schedule={deliverySchedule} />
        <div className="space-y-8">
            <PrepList items={prepList} />
             <Card>
                <CardHeader>
                    <CardTitle>Entregas por Horário</CardTitle>
                    <CardDescription>Volume de cestas para cada horário de entrega.</CardDescription>
                </CardHeader>
                <CardContent>
                    {ordersByHour.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={ordersByHour} margin={{ top: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={30} />
                                <Tooltip cursor={{ fill: 'rgba(233, 217, 205, 0.4)' }} contentStyle={{backgroundColor: '#F7FDF2', border: '1px solid #E9D9CD', borderRadius: '0.5rem'}}/>
                                <Bar dataKey="total" fill="#97A25F" radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="total" position="top" style={{ fill: '#4B4F36', fontSize: 12 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center py-10 text-gray-500">Nenhum dado para exibir.</div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}