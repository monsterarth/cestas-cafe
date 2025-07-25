'use client';

import React, { useState } from 'react';
import { useFetchData } from '@/hooks/use-fetch-data';
import { Supplier, StockItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LoadingScreen } from '@/components/loading-screen';
import { toast, Toaster } from 'sonner';
import { PlusCircle, Edit, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';

type FormValues = {
  name: string;
  posicao?: number;
};

// Componente de formulário para adicionar item
const AddItemForm = ({ supplierId, onFinished }: { supplierId: string, onFinished: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    toast.loading("Adicionando item...");
    try {
      const response = await fetch('/api/estoque/itens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, supplierId }),
      });
      if (!response.ok) throw new Error("Falha ao adicionar item.");
      toast.dismiss();
      toast.success("Item adicionado!");
      reset();
      setIsOpen(false);
      onFinished();
    } catch (error) {
      toast.dismiss();
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Item de Estoque</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label>Nome do Item</label>
            <Input {...register("name", { required: "O nome é obrigatório" })} />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label>Posição (Opcional, para ordenar)</label>
            <Input type="number" {...register("posicao", { valueAsNumber: true })} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Componente principal da página
const EditSupplierItemsPage = ({ params }: { params: { id: string } }) => {
  const { id: supplierId } = params;
  const { data: supplier, isLoading: loadingSupplier, error: supplierError } = useFetchData<Supplier>(`/api/estoque/fornecedores?id=${supplierId}`);
  // CORREÇÃO: Removido o 'mutate' daqui
  const { data: items, isLoading: loadingItems, error: itemsError } = useFetchData<StockItem[]>(`/api/estoque/itens?supplierId=${supplierId}`);
  
  const [itemToDelete, setItemToDelete] = useState<StockItem | null>(null);

  // Função para recarregar a página
  const refreshPage = () => window.location.reload();

  const handleDelete = async () => {
    if (!itemToDelete) return;
    toast.loading("Excluindo item...");
    try {
        await fetch(`/api/estoque/itens?id=${itemToDelete.id}`, { method: 'DELETE' });
        toast.dismiss();
        toast.success("Item excluído!");
        setItemToDelete(null);
        refreshPage();
    } catch (err) {
        toast.dismiss();
        toast.error((err as Error).message);
    }
  };

  if (loadingSupplier || loadingItems) return <LoadingScreen message="Carregando itens do fornecedor..." />;
  if (supplierError || itemsError) return <div className="text-red-500">Erro ao carregar dados.</div>;
  if (!supplier) return <div className="text-center">Fornecedor não encontrado.</div>;

  return (
    <>
      <Toaster richColors position="top-center" />
      <div className="mb-4">
        <Button asChild variant="outline">
            <Link href="/admin/settings/fornecedores"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Fornecedores</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Editando Itens de: {supplier.name}</CardTitle>
              <CardDescription>Gerencie os itens de estoque fornecidos por esta empresa.</CardDescription>
            </div>
            <AddItemForm supplierId={supplierId} onFinished={refreshPage} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nome do Item</TableHead><TableHead>Posição</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {items && items.length > 0 ? (
                items.sort((a,b) => (a.posicao || 0) - (b.posicao || 0)).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.posicao || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="destructive" size="sm" onClick={() => setItemToDelete(item)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={3} className="text-center h-24">Nenhum item cadastrado para este fornecedor.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <DialogContent>
            <DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle></DialogHeader>
            <p>Tem certeza que deseja excluir o item <strong>{itemToDelete?.name}</strong>?</p>
            <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setItemToDelete(null)}>Cancelar</Button>
                <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditSupplierItemsPage;