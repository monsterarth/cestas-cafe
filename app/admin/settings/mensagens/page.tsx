// Arquivo: app/admin/settings/mensagens/page.tsx
'use client';

import { useState, useEffect, useMemo, ChangeEvent, FC } from 'react';
import { getFirebaseDb } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AppConfig, Comanda } from '@/types';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, Trash2, PlusCircle } from 'lucide-react';
import { VisualEditorModal } from '@/components/visual-editor-modal';
import { ComandaThermalReceipt } from '@/components/comanda-thermal-receipt';
import { StepWelcomeMessage } from '@/components/step-welcome-message';
import { StepSuccess } from '@/components/step-success';
import { SurveySuccessCard } from '@/components/survey-success-card'; // Importar o novo componente
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

type FieldConfig = {
    label: string;
    type: 'input' | 'textarea';
    placeholder?: string;
};

type EditableSection = {
    id: string; // Permitir IDs customizados
    title: string;
    description: string;
    fields: Record<string, FieldConfig>;
    PreviewComponent: FC<any>;
    getInitialData: (config: Partial<AppConfig>) => Partial<AppConfig>;
};

// Objeto de configuração para todas as seções editáveis
const EDITABLE_SECTIONS: Record<string, EditableSection> = {
    comanda: {
        id: 'comanda', title: 'Comanda do Hóspede', description: 'Textos do ticket térmico impresso entregue ao hóspede.',
        fields: {
            comandaTitle: { label: 'Título Principal', type: 'input' }, comandaSubtitle: { label: 'Subtítulo', type: 'input' },
            comandaPostQr: { label: 'Texto Abaixo do QR Code', type: 'input' }, comandaFooter: { label: 'Texto do Rodapé', type: 'textarea' },
        },
        getInitialData: (config) => ({ comandaTitle: config.comandaTitle, comandaSubtitle: config.comandaSubtitle, comandaPostQr: config.comandaPostQr, comandaFooter: config.comandaFooter }),
        PreviewComponent: ComandaThermalReceipt,
    },
    welcome: {
        id: 'welcome', title: 'Tela de Boas-Vindas', description: 'A primeira mensagem que o hóspede vê ao iniciar o pedido.',
        fields: {
            welcomeTitle: { label: 'Título de Boas-Vindas', type: 'input' }, welcomeSubtitle: { label: 'Subtítulo de Boas-Vindas', type: 'input' },
            textoBoasVindas: { label: 'Mensagem Principal', type: 'textarea' }, welcomeEmoji: { label: 'Emoji de Boas-Vindas', type: 'input' },
        },
        getInitialData: (config) => ({ welcomeTitle: config.welcomeTitle, welcomeSubtitle: config.welcomeSubtitle, textoBoasVindas: config.textoBoasVindas, welcomeEmoji: config.welcomeEmoji }),
        PreviewComponent: StepWelcomeMessage,
    },
    success: {
        id: 'success', title: 'Tela de Pedido Enviado', description: 'A mensagem de confirmação mostrada ao finalizar o pedido.',
        fields: {
            successTitle: { label: 'Título de Sucesso', type: 'input' }, successSubtitle: { label: 'Subtítulo de Sucesso', type: 'textarea' },
            successGratitude: { label: 'Mensagem de Agradecimento', type: 'input' }, successFooter: { label: 'Rodapé de Sucesso', type: 'input' },
        },
        getInitialData: (config) => ({ successTitle: config.successTitle, successSubtitle: config.successSubtitle, successGratitude: config.successGratitude, successFooter: config.successFooter }),
        PreviewComponent: StepSuccess,
    },
    // ATUALIZAÇÃO: Adicionada a nova seção para a mensagem de sucesso da pesquisa
    surveySuccess: {
        id: 'surveySuccess', title: 'Sucesso da Pesquisa', description: 'Mensagem exibida ao hóspede após responder a pesquisa de satisfação.',
        fields: {
            surveySuccessTitle: { label: 'Título Principal', type: 'input', placeholder: 'Ex: Obrigado por responder!' },
            surveySuccessSubtitle: { label: 'Subtítulo', type: 'textarea', placeholder: 'Ex: Sua opinião é muito importante para nós.' },
            surveySuccessFooter: { label: 'Rodapé', type: 'input', placeholder: 'Ex: Equipe Fazenda do Rosa' },
        },
        getInitialData: (config) => ({ surveySuccessTitle: config.surveySuccessTitle, surveySuccessSubtitle: config.surveySuccessSubtitle, surveySuccessFooter: config.surveySuccessFooter }),
        PreviewComponent: SurveySuccessCard,
    },
    atraso: {
        id: 'atraso', title: 'Mensagem de Comanda Expirada', description: 'Aviso exibido quando o hóspede tenta usar uma comanda fora do horário.',
        fields: { mensagemAtrasoPadrao: { label: 'Texto do aviso de comanda expirada', type: 'textarea' } },
        getInitialData: (config) => ({ mensagemAtrasoPadrao: config.mensagemAtrasoPadrao }),
        PreviewComponent: ({ config }) => (<Alert variant="destructive" className="w-full max-w-sm"><Terminal className="h-4 w-4" /><AlertTitle>Comanda Expirada</AlertTitle><AlertDescription>{config?.mensagemAtrasoPadrao || "Por favor, escreva a mensagem de aviso."}</AlertDescription></Alert>),
    },
    motivacionais: {
        id: 'motivacionais', title: 'Mensagens Motivacionais', description: 'Frases que aparecem aleatoriamente no rodapé das comandas impressas.',
        fields: {}, getInitialData: (config) => ({ mensagensMotivacionais: Array.isArray(config.mensagensMotivacionais) ? config.mensagensMotivacionais : [] }),
        PreviewComponent: ({ config }) => (<div className="bg-white p-4 rounded-md shadow-sm text-left w-full max-w-sm"><h3 className="font-bold text-lg mb-2 border-b pb-2">Frases da Comanda</h3><ul className="list-disc pl-5 text-gray-700 max-h-60 overflow-y-auto">{config?.mensagensMotivacionais?.map((line: string, index: number) => line && <li key={index}>{line}</li>)}{(!config?.mensagensMotivacionais || config.mensagensMotivacionais.length === 0) && (<li className="text-gray-400">Nenhuma frase cadastrada.</li>)}</ul></div>),
    },
};

export default function MensagensSettingsPage() {
    const [fullConfig, setFullConfig] = useState<Partial<AppConfig>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [modalState, setModalState] = useState<{ isOpen: boolean; activeSection: EditableSection | null; editedData: Partial<AppConfig> | null; }>({ isOpen: false, activeSection: null, editedData: null });

    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true);
            const db = await getFirebaseDb();
            if (db) {
                const configRef = doc(db, 'configuracoes', 'app');
                const configSnap = await getDoc(configRef);
                if (configSnap.exists()) { setFullConfig(configSnap.data() as AppConfig); }
            }
            setLoading(false);
        };
        fetchConfig();
    }, []);

    const openModal = (sectionConfig: EditableSection) => {
        const initialDataForSection = sectionConfig.getInitialData(fullConfig);
        setModalState({ isOpen: true, activeSection: sectionConfig, editedData: initialDataForSection });
    };

    const closeModal = () => setModalState({ isOpen: false, activeSection: null, editedData: null });

    const handleMotivationalMessageChange = (index: number, value: string) => {
        if (!modalState.editedData) return;
        const newMessages = [...(modalState.editedData.mensagensMotivacionais || [])];
        newMessages[index] = value;
        setModalState(prev => ({ ...prev, editedData: { ...prev.editedData, mensagensMotivacionais: newMessages } }));
    };

    const addMotivationalMessage = () => {
        if (!modalState.editedData) return;
        const newMessages = [...(modalState.editedData.mensagensMotivacionais || []), ''];
        setModalState(prev => ({ ...prev, editedData: { ...prev.editedData, mensagensMotivacionais: newMessages } }));
    };

    const removeMotivationalMessage = (index: number) => {
        if (!modalState.editedData) return;
        const newMessages = (modalState.editedData.mensagensMotivacionais || []).filter((_, i) => i !== index);
        setModalState(prev => ({ ...prev, editedData: { ...prev.editedData, mensagensMotivacionais: newMessages } }));
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setModalState((prev) => ({ ...prev, editedData: { ...prev.editedData, [name]: value } }));
    };

    const handleSave = async () => {
        if (!modalState.editedData) return;
        setIsSaving(true);
        const dataToSave = { ...modalState.editedData };
        if (dataToSave.mensagensMotivacionais) {
            dataToSave.mensagensMotivacionais = dataToSave.mensagensMotivacionais.filter(m => m && m.trim() !== '');
        }
        const db = await getFirebaseDb();
        if (db) {
            try {
                const configRef = doc(db, 'configuracoes', 'app');
                const newFullConfig = { ...fullConfig, ...dataToSave };
                await setDoc(configRef, newFullConfig, { merge: true });
                setFullConfig(newFullConfig);
                toast.success('Configurações salvas com sucesso!');
                closeModal();
            } catch (error) {
                toast.error('Falha ao salvar as configurações.');
                console.error("Save Error:", error);
            }
        }
        setIsSaving(false);
    };
    
    const dummyComanda = useMemo<Comanda>(() => ({ id: 'preview-123', guestName: 'Hóspede Exemplo', cabin: 'Cabana Preview', numberOfGuests: 2, token: 'F-PREV', isActive: true, status: 'ativa', createdAt: new Date() as any }), []);

    if (loading) { return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>; }
    
    const renderFormFields = () => {
        if (!modalState.activeSection || !modalState.editedData) return null;
        if (modalState.activeSection.id === 'motivacionais') {
            return (
                <div className="space-y-2"><Label>Frases Motivacionais</Label><div className="space-y-3 p-3 border rounded-md max-h-[calc(90vh-250px)] overflow-y-auto">
                    {modalState.editedData.mensagensMotivacionais?.map((message, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Input type="text" value={message} onChange={(e) => handleMotivationalMessageChange(index, e.target.value)} placeholder={`Frase #${index + 1}`} />
                            <Button variant="ghost" size="icon" onClick={() => removeMotivationalMessage(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addMotivationalMessage} className="mt-2"><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Frase</Button>
                </div></div>
            );
        }
        return Object.entries(modalState.activeSection.fields).map(([fieldName, fieldConfig]) => (
            <div key={fieldName} className="space-y-2"><Label htmlFor={fieldName}>{fieldConfig.label}</Label>
                {fieldConfig.type === 'textarea' ? (
                    <Textarea id={fieldName} name={fieldName} value={(modalState.editedData as any)[fieldName] || ''} onChange={handleInputChange} placeholder={fieldConfig.placeholder} rows={8} />
                ) : (
                    <Input id={fieldName} name={fieldName} value={(modalState.editedData as any)[fieldName] || ''} onChange={handleInputChange} placeholder={fieldConfig.placeholder} />
                )}
            </div>
        ));
    };

    return (
        <div className="space-y-6">
            <Card><CardHeader><CardTitle>Editor Visual de Mensagens</CardTitle><CardDescription>Clique em "Editar" em uma das seções abaixo para personalizar os textos da aplicação de forma contextual.</CardDescription></CardHeader></Card>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {Object.values(EDITABLE_SECTIONS).map((section) => (
                    <Card key={section.id} className="flex flex-col">
                        <CardHeader><CardTitle>{section.title}</CardTitle><CardDescription>{section.description}</CardDescription></CardHeader>
                        <CardFooter className="mt-auto"><Button onClick={() => openModal(section)}><Eye className="mr-2 h-4 w-4" />Editar Visualmente</Button></CardFooter>
                    </Card>
                ))}
            </div>
            
            {modalState.activeSection && modalState.isOpen && (
                <VisualEditorModal isOpen={modalState.isOpen} onClose={closeModal} onSave={handleSave} isSaving={isSaving} title={`Editor Visual: ${modalState.activeSection.title}`} description="Altere os campos no painel da direita e veja a pré-visualização à esquerda ser atualizada em tempo real.">
                    <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="flex items-center justify-center rounded-lg bg-slate-100 p-4 dark:bg-slate-800">
                            <div className="scale-90 transform"><modalState.activeSection.PreviewComponent config={modalState.editedData} comanda={dummyComanda} /></div>
                        </div>
                        <div className="space-y-4 overflow-y-auto pr-2">{renderFormFields()}</div>
                    </div>
                </VisualEditorModal>
            )}
        </div>
    );
}