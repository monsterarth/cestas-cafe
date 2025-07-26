'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  LayoutDashboard, 
  ShoppingBasket, 
  BarChart2, 
  Ticket, 
  Settings, 
  Paintbrush, 
  MessageSquare, 
  Home, 
  UtensilsCrossed, 
  ClipboardList, 
  FileText, 
  Truck,
  Users,
  Coffee,
  Warehouse,
  BarChart3,
  CalendarDays
} from 'lucide-react';

const NavLink = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);
  
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors hover:bg-gray-700/50 ${isActive ? "bg-[#97A25F] text-white" : "text-gray-300 hover:text-white"}`}
    >
      {children}
    </Link>
  );
};

export const navSections = [
    {
      title: 'Recepção',
      icon: Users,
      links: [
        { href: '/admin/agendamentos', label: 'Agendamentos', icon: CalendarDays },
        { href: '/admin/pre-check-ins', label: 'Pré Check-ins', icon: FileText },
      ],
    },
    {
      title: 'Cozinha',
      icon: Coffee,
      links: [
        { href: '/admin/pedidos', label: 'Pedidos de Café', icon: ShoppingBasket },
        { href: '/admin/comandas/gerenciar', label: 'Comandas', icon: Ticket },
        { href: '/admin/menu', label: 'Cardápio', icon: UtensilsCrossed },
        { href: '/admin/estoque', label: 'Estoque', icon: Warehouse },
      ],
    },
    {
      title: 'Gestão',
      icon: BarChart3,
      links: [
        { href: '/admin/surveys', label: 'Pesquisas', icon: ClipboardList },
        { href: '/admin/pedidos/estatisticas', label: 'Estatísticas', icon: BarChart2 },
      ],
    },
    {
      title: 'Sistema',
      icon: Settings,
      links: [
        { href: '/admin/settings/aparencia', label: 'Aparência', icon: Paintbrush },
        { href: '/admin/settings/mensagens', label: 'Mensagens', icon: MessageSquare },
        { href: '/admin/settings/cabanas', label: 'Cabanas', icon: Home },
        { href: '/admin/settings/fornecedores', label: 'Fornecedores', icon: Truck },
      ],
    },
];

export function AdminNav({ onLinkClick }: { onLinkClick?: () => void }) {
  return (
    <nav className="flex-1 px-2 py-4 space-y-2">
      <div className="px-2">
        <NavLink href="/admin" onClick={onLinkClick}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
      </div>
      
      <Accordion type="multiple" className="w-full">
        {navSections.map((section) => (
          <AccordionItem key={section.title} value={section.title} className="border-none">
            <AccordionTrigger className="px-2 py-2 text-sm font-semibold uppercase text-gray-400 hover:no-underline hover:text-white rounded-lg hover:bg-gray-700/50">
              {section.title}
            </AccordionTrigger>
            <AccordionContent className="pl-4 pt-1 space-y-1">
              {section.links.map((link) => (
                <NavLink key={link.href} href={link.href} onClick={onLinkClick}>
                  <link.icon size={18} /> {link.label}
                </NavLink>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </nav>
  );
}