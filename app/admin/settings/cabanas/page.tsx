// Arquivo: app/admin/settings/cabanas/page.tsx
'use client';

import { useEffect, useState } from "react";
import { Cabin } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PlusCircle, Trash, Edit } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";

function CabinForm({ cabin, onSave, children }: { cabin?: Cabin, onSave: () => void, children: React.ReactNode }) {
    const [name, setName] = useState(cabin?.name || '');
    const [capacity, setCapacity] = useState(cabin?.capacity || 1);
    const [isSaving, setIsSaving] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const url = cabin ? `/api/cabanas/${cabin.id}` : '/api/cabanas';
        const method = cabin ? 'PATCH' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, capacity: Number(capacity) }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Falha ao ${cabin ? 'atualizar' : 'criar'} cabana.`);
            }
            toast.success(`Cabana ${cabin ? 'atualizada' : 'criada'} com sucesso!`);
            onSave();
            setIsOpen(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{cabin ? 'Editar Cabana' : 'Adicionar Nova Cabana'}</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes da acomodação. Clique em salvar para aplicar as mudanças.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome da Cabana</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="capacity">Capacidade (pessoas)</Label>
                        <Input id="capacity" type="number" value={capacity} onChange={e => setCapacity(Number(e.target.value))} required min="1" />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function CabanasSettingsPage() {
    const [cabanas, setCabanas] = useState<Cabin[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCabanas = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/cabanas');
            if (!res.ok) {
                 const errorData = await res.json();
                 throw new Error(errorData.message || "Falha ao carregar cabanas");
            }
            const data: Cabin[] = await res.json();
            data.sort((a, b) => a.name.localeCompare(b.name));
            setCabanas(data);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCabanas();
    }, []);
    
    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/cabanas/${id}`, { method: 'DELETE' });
            if(!res.ok) throw new Error("Falha ao deletar cabana");
            toast.success("Cabana deletada com sucesso!");
            fetchCabanas();
        } catch(error: any) {
            toast.error(error.message);
        }
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Gerenciar Cabanas</h1>
                    <p className="text-muted-foreground">Adicione, edite ou remova as acomodações disponíveis.</p>
                </div>
                <CabinForm onSave={fetchCabanas}>
                    <Button><PlusCircle className="mr-2 h-4 w-4"/> Adicionar Cabana</Button>
                </CabinForm>
            </div>
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Capacidade</TableHead>
                                    <TableHead className="text-right pr-6">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cabanas.map(cabin => (
                                    <TableRow key={cabin.id}>
                                        <TableCell className="font-medium">{cabin.name}</TableCell>
                                        <TableCell>{cabin.capacity} pessoas</TableCell>
                                        <TableCell className="text-right pr-6">
                                          <div className="flex gap-2 justify-end">
                                            <CabinForm cabin={cabin} onSave={fetchCabanas}>
                                                <Button variant="outline" size="sm"><Edit className="h-4 w-4"/></Button>
                                            </CabinForm>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm"><Trash className="h-4 w-4"/></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta ação não pode ser desfeita e removerá permanentemente a cabana.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(cabin.id)}>Deletar</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                          </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}