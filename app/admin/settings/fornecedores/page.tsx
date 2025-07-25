'use client';

import React, { useState } from 'react';
import { useFetchData } from '@/hooks/use-fetch-data';
import { Supplier } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LoadingScreen } from '@/components/loading-screen';
import { toast, Toaster } from 'sonner';
import { PlusCircle, Edit, Trash2, Loader2, Truck } from 'lucide-react';
import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';

type FormValues = {
  name: string;
};

// Componente do formulário para adicionar fornecedor
const AddSupplierForm = ({ onFinished }: { onFinished: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    toast.loading("Adicionando fornecedor...");
    try {
      const response = await fetch('/api/estoque/fornecedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Falha ao adicionar fornecedor.");

      toast.dismiss();
      toast.success("Fornecedor adicionado com sucesso!");
      reset();
      setIsOpen(false);
      onFinished(); // <-- Chama a função para recarregar a página
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
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Fornecedor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Fornecedor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Fornecedor</label>
            <Input id="name" {...register("name", { required: "O nome é obrigatório" })} />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Componente principal da página
const ManageSuppliersPage: React.FC = () => {
  // CORREÇÃO: Removido o 'mutate' daqui
  const { data: suppliers, isLoading, error } = useFetchData<Supplier[]>('/api/estoque/fornecedores');
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Função para recarregar a página
  const refreshPage = () => window.location.reload();

  const handleDelete = async () => {
    if (!supplierToDelete) return;
    
    toast.loading("Excluindo fornecedor...");
    try {
        const response = await fetch(`/api/estoque/fornecedores?id=${supplierToDelete.id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error("Falha ao excluir.");

        toast.dismiss();
        toast.success("Fornecedor excluído com sucesso!");
        setSupplierToDelete(null);
        refreshPage(); // <-- Recarrega a página para mostrar a mudança
    } catch (err) {
        toast.dismiss();
        toast.error((err as Error).message);
    }
  };

  if (isLoading) return <LoadingScreen message="Carregando fornecedores..." />;
  if (error) return <div className="text-red-500">Erro ao carregar: {error.message}</div>;

  return (
    <>
      <Toaster richColors position="top-center" />
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
                <CardTitle className="flex items-center gap-2"><Truck /> Gerenciar Fornecedores</CardTitle>
                <CardDescription>Adicione, edite ou remova fornecedores e seus itens de estoque.</CardDescription>
            </div>
            <AddSupplierForm onFinished={refreshPage} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Fornecedor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers && suppliers.length > 0 ? (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/settings/fornecedores/${supplier.id}`}>
                          <Edit className="mr-2 h-4 w-4" /> Editar Itens
                        </Link>
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setSupplierToDelete(supplier)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center h-24">Nenhum fornecedor cadastrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={!!supplierToDelete} onOpenChange={() => setSupplierToDelete(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <p>
                Tem certeza que deseja excluir o fornecedor <strong>{supplierToDelete?.name}</strong>? 
                Todos os itens associados a ele também serão removidos. Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setSupplierToDelete(null)}>Cancelar</Button>
                <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ManageSuppliersPage;