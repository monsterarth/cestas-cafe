// cestas-cafe/app/admin/estoque/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useFetchData } from '@/hooks/use-fetch-data';
import { Supplier, StockItem } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingScreen } from '@/components/loading-screen';
import { toast, Toaster } from 'sonner';
import { Loader2, ClipboardCopy, ClipboardCheck, ChefHat } from 'lucide-react';

// Tipagem para os dados do formulário
interface StockFormData {
  suppliers: Supplier[];
  items: StockItem[];
}

// Tipagem para os valores que o formulário irá registrar
type FormValues = {
  [supplierId: string]: {
    [itemId: string]: number;
  };
};

// Função para gerar a mensagem formatada
const GenerateWhatsAppMessage = (
  data: FormValues,
  suppliers: Supplier[],
  items: StockItem[]
): string => {
  let message = "📝 *PEDIDO DE ESTOQUE*\n\n";

  for (const supplier of suppliers) {
    const supplierItems = items.filter(item => item.supplierId === supplier.id);
    const orderData = data[supplier.id];

    if (orderData && Object.values(orderData).some(qty => qty > 0)) {
      message += `*${supplier.name.toUpperCase()}:*\n`;
      for (const item of supplierItems) {
        const quantity = orderData[item.id];
        if (quantity > 0) {
          message += `- ${item.name}: ${quantity}\n`;
        }
      }
      message += "\n";
    }
  }

  return message;
};


const StockRequestPage: React.FC = () => {
  const [step, setStep] = useState(0); // 0: Welcome, 1: Form
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [whatsAppMessage, setWhatsAppMessage] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Busca os dados (fornecedores e itens) da nossa nova API
  const { data: formData, isLoading, error } = useFetchData<StockFormData>('/api/estoque/dados-formulario');
  const { register, handleSubmit, reset } = useForm<FormValues>();

  const suppliers = useMemo(() => formData?.suppliers.sort((a,b) => a.name.localeCompare(b.name)) || [], [formData]);
  const items = useMemo(() => formData?.items.sort((a,b) => (a.posicao || 0) - (b.posicao || 0)) || [], [formData]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    toast.loading("Enviando pedido...");

    // Filtra para enviar ao banco de dados apenas os itens com quantidade
    const filteredData = Object.entries(data).reduce((acc, [supplierId, itemQtys]) => {
        const validItems = Object.entries(itemQtys).filter(([, qty]) => Number(qty) > 0);
        if (validItems.length > 0) {
            acc[supplierId] = Object.fromEntries(validItems);
        }
        return acc;
    }, {} as FormValues);

    if (Object.keys(filteredData).length === 0) {
        toast.dismiss();
        toast.info("Nenhum item foi solicitado.");
        setIsSubmitting(false);
        return;
    }

    try {
      await fetch('/api/estoque/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: filteredData }),
      });

      const message = GenerateWhatsAppMessage(filteredData, suppliers, items);
      setWhatsAppMessage(message);

      toast.dismiss();
      toast.success("Pedido de estoque enviado com sucesso!");
      reset(); // Limpa o formulário
      setShowCopyDialog(true);
      setStep(0); // Volta para a tela inicial

    } catch (err) {
      toast.dismiss();
      toast.error("Falha ao enviar o pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(whatsAppMessage);
    setIsCopied(true);
    toast.success("Texto copiado para a área de transferência!");
    setTimeout(() => setIsCopied(false), 2000);
  }

  if (isLoading) return <LoadingScreen message="Carregando dados de estoque..." />;
  if (error) return <div className="text-red-500">Erro ao carregar o formulário: {error.message}</div>;

  return (
    <>
      <Toaster richColors position="top-center" />
      {step === 0 && (
         <Card className="max-w-2xl mx-auto">
             <CardHeader className="items-center text-center">
                <ChefHat className="w-12 h-12 text-amber-600" />
                <CardTitle>Solicitação de Estoque</CardTitle>
                <CardDescription>Clique abaixo para iniciar a solicitação de itens para a cozinha.</CardDescription>
             </CardHeader>
             <CardContent className="text-center">
                <Button size="lg" onClick={() => setStep(1)}>Fazer Pedido</Button>
             </CardContent>
         </Card>
      )}

      {step === 1 && (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-8">
                {suppliers.map(supplier => (
                    <Card key={supplier.id}>
                        <CardHeader>
                            <CardTitle>{supplier.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {items.filter(item => item.supplierId === supplier.id).map(item => (
                                <div key={item.id} className="space-y-2">
                                    <Label htmlFor={`${supplier.id}.${item.id}`}>{item.name}</Label>
                                    <Input
                                        id={`${supplier.id}.${item.id}`}
                                        type="number"
                                        min="0"
                                        placeholder="Qtde."
                                        {...register(`${supplier.id}.${item.id}` as const, { valueAsNumber: true, min: 0 })}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="mt-8 flex justify-end gap-4">
                 <Button variant="ghost" type="button" onClick={() => setStep(0)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar Pedido
                </Button>
            </div>
        </form>
      )}

      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Pedido Formatado para WhatsApp</DialogTitle>
                  <DialogDescription>
                      Copie o texto abaixo e cole na conversa com os fornecedores.
                  </DialogDescription>
              </DialogHeader>
              <div className="my-4 p-4 bg-slate-100 rounded-md whitespace-pre-wrap text-sm max-h-[40vh] overflow-y-auto">
                  {whatsAppMessage}
              </div>
              <Button onClick={copyToClipboard}>
                {isCopied ? <ClipboardCheck className="mr-2 h-4 w-4"/> : <ClipboardCopy className="mr-2 h-4 w-4"/>}
                {isCopied ? 'Copiado!' : 'Copiar Texto'}
              </Button>
          </DialogContent>
      </Dialog>
    </>
  );
};

export default StockRequestPage;