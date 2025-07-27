'use client';

import React, { useState } from 'react';
import { useFetchData } from '@/hooks/use-fetch-data';
import { Supplier, StockItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LoadingScreen } from '@/components/loading-screen';
import { toast, Toaster } from 'sonner';
import { PlusCircle, Edit, Trash2, Loader2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Label } from '@/components/ui/label';

// Tipos de formulário atualizados
type AddItemFormValues = {
  name: string;
  posicao?: number;
  inStock: number;
  toOrder: number;
  unit: string;
};

type QuickEditFormValues = {
  inStock: number;
  toOrder: number;
};

// Componente de formulário para adicionar item (Atualizado)
const AddItemForm = ({ supplierId, onFinished }: { supplierId: string, onFinished: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddItemFormValues>({
    defaultValues: { inStock: 0, toOrder: 0 }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit: SubmitHandler<AddItemFormValues> = async (data) => {
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
      toast.success("Item adicionado com sucesso!");
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
            <Label>Nome do Item *</Label>
            <Input {...register("name", { required: "O nome é obrigatório" })} />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Unidade *</Label>
              <Input placeholder="Ex: kg, un, pacote" {...register("unit", { required: "A unidade é obrigatória" })} />
              {errors.unit && <p className="text-sm text-red-600 mt-1">{errors.unit.message}</p>}
            </div>
             <div>
              <Label>Posição (Opcional)</Label>
              <Input type="number" {...register("posicao", { valueAsNumber: true })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Em Estoque</Label>
              <Input type="number" {...register("inStock", { valueAsNumber: true, min: 0 })} />
            </div>
            <div>
              <Label>Pedir</Label>
              <Input type="number" {...register("toOrder", { valueAsNumber: true, min: 0 })} />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Componente para edição rápida na linha da tabela
const QuickEditForm = ({ item, onFinished }: { item: StockItem, onFinished: () => void }) => {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm<QuickEditFormValues>({
        defaultValues: {
            inStock: item.inStock || 0,
            toOrder: item.toOrder || 0,
        }
    });

    const onSubmit = async (data: QuickEditFormValues) => {
        const toastId = toast.loading("Salvando alterações...");
        try {
            const response = await fetch(`/api/estoque/itens?id=${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inStock: data.inStock, toOrder: data.toOrder }),
            });
            if (!response.ok) throw new Error("Falha ao salvar.");
            
            toast.dismiss(toastId);
            toast.success("Estoque atualizado!");
            onFinished();
        } catch (error) {
            toast.dismiss(toastId);
            toast.error((error as Error).message);
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Em Estoque ({item.unit})</Label>
                    <Input type="number" {...register("inStock", { valueAsNumber: true, min: 0 })} />
                </div>
                <div>
                    <Label>Pedir ({item.unit})</Label>
                    <Input type="number" {...register("toOrder", { valueAsNumber: true, min: 0 })} />
                </div>
            </div>
            <Button type="submit" size="sm" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="ml-2">Salvar</span>
            </Button>
        </form>
    )
}

// Componente principal da página (Refatorado)
const EditSupplierItemsPage = ({ params }: { params: { id: string } }) => {
  const { id: supplierId } = params;
  const { data: supplier, isLoading: loadingSupplier, error: supplierError } = useFetchData<Supplier>(`/api/estoque/fornecedores?id=${supplierId}`);
  const { data: items, isLoading: loadingItems, error: itemsError } = useFetchData<StockItem[]>(`/api/estoque/itens?supplierId=${supplierId}`);
  
  const [itemToDelete, setItemToDelete] = useState<StockItem | null>(null);

  // Função para recarregar a página, seguindo o padrão do projeto
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

  if (loadingSupplier || loadingItems) return <LoadingScreen message="Carregando dados do fornecedor..." />;
  if (supplierError || itemsError) return <div className="text-red-500 p-4">Erro ao carregar dados. Verifique a API e a conexão.</div>;
  if (!supplier) return <div className="text-center p-4">Fornecedor não encontrado.</div>;

  return (
    <>
      <Toaster richColors position="top-center" />
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
            <Link href="/admin/settings/fornecedores"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Fornecedores</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <CardTitle>Itens de: {supplier.name}</CardTitle>
              <CardDescription>Gerencie o estoque dos itens fornecidos por esta empresa.</CardDescription>
            </div>
            <AddItemForm supplierId={supplierId} onFinished={refreshPage} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[40%]'>Nome do Item</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Em Estoque</TableHead>
                <TableHead>A Pedir</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items && items.length > 0 ? (
                items.sort((a,b) => (a.posicao || 0) - (b.posicao || 0)).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.inStock}</TableCell>
                    <TableCell>{item.toOrder}</TableCell>
                    <TableCell className="text-right">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" /> Gerenciar</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <QuickEditForm item={item} onFinished={refreshPage} />
                            </PopoverContent>
                        </Popover>
                         <Button variant="ghost" size="sm" className="ml-2" onClick={() => setItemToDelete(item)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center h-24">Nenhum item cadastrado para este fornecedor.</TableCell></TableRow>
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