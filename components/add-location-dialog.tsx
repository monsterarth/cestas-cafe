// components/add-location-dialog.tsx
'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, PlusCircle } from 'lucide-react';

interface AddLocationDialogProps {
  title: string;
  label: string;
  onSave: (name: string) => Promise<any>;
}

export const AddLocationDialog = ({ title, label, onSave }: AddLocationDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("O nome não pode estar vazio.");
            return;
        }
        setIsSaving(true);
        try {
            await onSave(name);
            toast.success(`${title} adicionado(a) com sucesso!`);
            setName('');
            setIsOpen(false);
        } catch (error: any) {
            toast.error(`Falha ao adicionar: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-full">
                    <PlusCircle className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <div className="space-y-2">
                        <Label htmlFor="location-name">{label}</Label>
                        <Input id="location-name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Adicionar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}