import React, { useState, useEffect, useRef } from 'react';
import { 
  Scale, 
  Users, 
  History, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Share2, 
  ChevronDown,
  X,
  Check,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Client, Sale, PRODUCTS } from './types';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LOGO_URL = "https://storage.googleapis.com/m-infra.appspot.com/v0/b/m-infra.appspot.com/o/public%2Fcharcutaria_logo_new.png?alt=media";

// Logo Component using the provided PNG
const Logo = ({ className }: { className?: string }) => {
  const [error, setError] = useState(false);
  
  if (error) {
    return (
      <div className={cn("bg-primary rounded-full flex items-center justify-center text-white font-serif font-bold", className)}>
        OS
      </div>
    );
  }

  return (
    <img 
      src={LOGO_URL} 
      alt="Origem do Sabor" 
      className={cn("object-contain", className)} 
      onError={() => setError(true)}
      referrerPolicy="no-referrer" 
    />
  );
};
export default function App() {
  const [activeTab, setActiveTab] = useState<'pesagem' | 'clientes' | 'historico'>('pesagem');
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  
  // Global Label Preview State
  const [showLabelPreview, setShowLabelPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{
    client: Client | null;
    product: string;
    weight: string;
    price: string;
    total: number;
    orderId: string;
  } | null>(null);

  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, salesRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/sales')
      ]);
      const clientsData = await clientsRes.json();
      const salesData = await salesRes.json();
      setClients(clientsData);
      setSales(salesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerShare = async () => {
    if (!labelRef.current || !previewData) return;

    try {
      const canvas = await html2canvas(labelRef.current, {
        backgroundColor: '#F6F2ED',
        scale: 2,
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const file = new File([blob], `etiqueta-${previewData.orderId}.png`, { type: 'image/png' });
        const shareData = {
          title: 'Etiqueta Origem do Sabor',
          text: `Olá, ${previewData.client?.name}! Segue sua etiqueta do pedido na Origem do Sabor:\n\nProduto: ${previewData.product}\nPeso: ${previewData.weight}kg\nPreço/kg: R$ ${previewData.price}\nTotal: R$ ${previewData.total.toFixed(2).replace('.', ',')}`,
          files: [file],
        };

        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
        } else {
          const message = encodeURIComponent(shareData.text);
          const whatsappUrl = `https://wa.me/${previewData.client?.phone.replace(/\D/g, '')}?text=${message}`;
          window.open(whatsappUrl, '_blank');
        }
        setShowLabelPreview(false);
      });
    } catch (error) {
      console.error("Error generating label:", error);
    }
  };

  const handleOpenPreview = (data: any) => {
    setPreviewData(data);
    setShowLabelPreview(true);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-bg-cream shadow-2xl overflow-hidden relative">
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-primary flex flex-col items-center justify-center text-white"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-white/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5"></div>
                <Logo className="h-20 w-20 relative z-10" />
              </div>
              <div className="text-center space-y-3">
                <h1 className="text-4xl font-serif font-bold tracking-tighter">
                  ORIGEM <span className="text-accent">DO</span> SABOR
                </h1>
                <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-accent to-transparent mx-auto"></div>
                <p className="text-[9px] uppercase tracking-[0.5em] font-black text-white/50">Tradição em Charcutaria</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Top Bar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-primary/5 px-6 py-4 flex items-center justify-between z-10 sticky top-0 shadow-sm">
        <div className="flex items-center gap-4">
          <Logo className="h-12 w-12" />
          <div>
            <h1 className="text-ink font-serif font-bold text-xl leading-tight tracking-tight">
              ORIGEM <span className="text-primary">DO</span> SABOR
            </h1>
            <p className="text-[8px] uppercase tracking-[0.4em] text-secondary font-black opacity-60">Charcutaria de Origem</p>
          </div>
        </div>
        <div className="h-10 w-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/10">
          <Users size={20} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'pesagem' && (
            <PesagemTab clients={clients} onRefresh={fetchData} onOpenPreview={handleOpenPreview} />
          )}
          {activeTab === 'clientes' && (
            <ClientesTab clients={clients} onRefresh={fetchData} />
          )}
          {activeTab === 'historico' && (
            <HistoricoTab sales={sales} onRefresh={fetchData} onOpenPreview={handleOpenPreview} />
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-primary/10 px-6 py-3 flex justify-between items-center z-20">
        <NavButton 
          active={activeTab === 'pesagem'} 
          onClick={() => setActiveTab('pesagem')} 
          icon={<Scale size={24} />} 
          label="Pesagem" 
        />
        <NavButton 
          active={activeTab === 'clientes'} 
          onClick={() => setActiveTab('clientes')} 
          icon={<Users size={24} />} 
          label="Clientes" 
        />
        <NavButton 
          active={activeTab === 'historico'} 
          onClick={() => setActiveTab('historico')} 
          icon={<History size={24} />} 
          label="Histórico" 
        />
      </nav>
      
      {/* Label Preview Modal */}
      <AnimatePresence>
        {showLabelPreview && previewData && (
          <div className="fixed inset-0 bg-ink/95 backdrop-blur-xl z-[60] flex flex-col items-center justify-start p-6 overflow-y-auto">
            <div className="my-8 flex flex-col items-center w-full">
              <div className="mb-6 text-center">
                <h3 className="text-white font-serif text-xl">Confirmar Etiqueta</h3>
                <p className="text-white/60 text-xs">Revise os dados antes de enviar</p>
              </div>
              
              {/* The Label itself */}
              <div 
                ref={labelRef}
                className="bg-[#FDFBFA] w-full max-w-[300px] p-6 rounded-sm shadow-2xl border-[1px] relative overflow-hidden label-texture"
                style={{ 
                  fontFamily: "'Cormorant Garamond', serif",
                  borderColor: 'rgba(213, 46, 39, 0.1)'
                }}
              >
                {/* Premium Decorative Borders */}
                <div className="absolute inset-2 border pointer-events-none" style={{ borderColor: 'rgba(213, 46, 39, 0.08)' }}></div>
                <div className="absolute top-0 left-0 w-10 h-10 border-t border-l m-1.5" style={{ borderColor: 'rgba(213, 46, 39, 0.15)' }}></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b border-r m-1.5" style={{ borderColor: 'rgba(213, 46, 39, 0.15)' }}></div>
                
                <div className="flex flex-col items-center space-y-3 relative z-10">
                  {/* Header Section */}
                  <div className="flex flex-col items-center text-center space-y-1.5">
                    <div className="relative">
                      <div className="w-16 h-16 border rounded-full flex items-center justify-center relative" style={{ borderColor: 'rgba(213, 46, 39, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
                        <Logo className="w-full h-full p-1.5" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 bg-secondary text-white text-[5px] font-black px-1 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                        Artesanal
                      </div>
                    </div>
                    
                    <div className="space-y-0">
                      <h2 className="text-ink text-xl font-bold tracking-tight leading-none uppercase">
                        ORIGEM <span className="text-primary">DO</span> SABOR
                      </h2>
                      <p className="text-secondary text-[6px] font-black uppercase tracking-[0.4em]" style={{ color: 'rgba(36, 119, 62, 0.4)' }}>Charcutaria de Origem</p>
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="w-full flex items-center gap-2">
                    <div className="h-px flex-1" style={{ backgroundColor: 'rgba(8, 6, 4, 0.15)' }}></div>
                    <div className="w-1 h-1 rotate-45 border" style={{ borderColor: 'rgba(8, 6, 4, 0.15)' }}></div>
                    <div className="h-px flex-1" style={{ backgroundColor: 'rgba(8, 6, 4, 0.15)' }}></div>
                  </div>
                  
                  {/* Content Section */}
                  <div className="w-full space-y-3">
                    {/* Client & Date */}
                    <div className="flex justify-between items-end border-b pb-1.5" style={{ borderBottomColor: 'rgba(213, 46, 39, 0.05)' }}>
                      <div className="flex flex-col">
                        <span className="text-[6px] uppercase font-bold tracking-widest" style={{ color: 'rgba(8, 6, 4, 0.3)' }}>Cliente</span>
                        <p className="text-[11px] font-bold text-ink leading-tight truncate max-w-[140px]">{previewData.client?.name}</p>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[6px] uppercase font-bold tracking-widest" style={{ color: 'rgba(8, 6, 4, 0.3)' }}>Data</span>
                        <p className="text-[8px] font-mono font-medium" style={{ color: 'rgba(8, 6, 4, 0.5)' }}>{format(new Date(), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="space-y-1.5">
                      <div className="flex flex-col">
                        <span className="text-[6px] uppercase font-bold tracking-widest" style={{ color: 'rgba(8, 6, 4, 0.3)' }}>Produto</span>
                        <p className="text-lg font-serif font-bold text-support-brown italic leading-tight">{previewData.product}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 p-2 rounded-lg border" style={{ borderColor: 'rgba(213, 46, 39, 0.04)', backgroundColor: 'rgba(255, 255, 255, 0.4)' }}>
                        <div className="flex flex-col">
                          <span className="text-[6px] uppercase font-bold tracking-widest" style={{ color: 'rgba(8, 6, 4, 0.3)' }}>Peso</span>
                          <p className="text-xs font-mono font-bold text-ink">{previewData.weight.replace('.', ',')} <span className="text-[8px] font-sans" style={{ color: 'rgba(8, 6, 4, 0.3)' }}>kg</span></p>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[6px] uppercase font-bold tracking-widest" style={{ color: 'rgba(8, 6, 4, 0.3)' }}>Preço/kg</span>
                          <p className="text-xs font-mono font-bold text-ink"><span className="text-[8px] font-sans" style={{ color: 'rgba(8, 6, 4, 0.3)' }}>R$</span> {previewData.price.replace('.', ',')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Section */}
                  <div className="w-full">
                    <div className="p-3 rounded-xl flex flex-col items-center border shadow-inner-soft" 
                      style={{ 
                        borderColor: 'rgba(36, 119, 62, 0.15)',
                        backgroundColor: 'rgba(36, 119, 62, 0.03)'
                      }}>
                      <span className="text-[7px] uppercase font-bold tracking-[0.2em] mb-0.5" style={{ color: 'rgba(36, 119, 62, 0.5)' }}>Valor Total</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-serif italic" style={{ color: 'rgba(36, 119, 62, 0.3)' }}>R$</span>
                        <span className="text-3xl font-black text-secondary tracking-tighter leading-none">
                          {previewData.total.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer Section */}
                  <div className="w-full flex justify-between items-center pt-1">
                    <div className="flex flex-col" style={{ color: 'rgba(8, 6, 4, 0.3)' }}>
                      <span className="text-[5px] font-mono tracking-widest uppercase">Lote</span>
                      <span className="text-[8px] font-mono font-bold">#{previewData.orderId}</span>
                    </div>
                    <div className="text-right flex flex-col items-end" style={{ color: 'rgba(8, 6, 4, 0.3)' }}>
                      <div className="w-5 h-5 border rounded-sm flex items-center justify-center rotate-12" style={{ borderColor: 'rgba(8, 6, 4, 0.2)' }}>
                        <span className="text-[6px] font-black -rotate-12">OK</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4 w-full max-w-[320px] pb-12">
                <button 
                  onClick={() => setShowLabelPreview(false)}
                  className="flex-1 bg-white/10 text-white font-bold py-4 rounded-xl border border-white/20"
                >
                  Cancelar
                </button>
                <button 
                  onClick={triggerShare}
                  className="flex-1 bg-secondary text-white font-bold py-4 rounded-xl shadow-xl shadow-secondary/40 flex items-center justify-center gap-2"
                >
                  <Check size={20} /> Compartilhar
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 transition-all duration-500 relative group",
        active ? "text-primary" : "text-ink/20 hover:text-ink/40"
      )}
    >
      <div className={cn(
        "p-2.5 rounded-2xl transition-all duration-500",
        active ? "bg-primary/10 shadow-inner" : "bg-transparent"
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-[9px] font-bold uppercase tracking-[0.15em] transition-all duration-500",
        active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      )}>{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute -bottom-3 w-1 h-1 rounded-full bg-primary"
        />
      )}
    </button>
  );
}

// --- PESAGEM TAB ---
function PesagemTab({ clients, onRefresh, onOpenPreview }: { clients: Client[], onRefresh: () => Promise<void>, onOpenPreview: (data: any) => void }) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0]);
  const [weight, setWeight] = useState('');
  const [price, setPrice] = useState('');
  const [total, setTotal] = useState(0);
  const [showClientModal, setShowClientModal] = useState(false);

  // Auto-calculate total
  useEffect(() => {
    const w = parseFloat(weight.replace(',', '.'));
    const p = parseFloat(price.replace(',', '.'));
    if (!isNaN(w) && !isNaN(p)) {
      setTotal(w * p);
    } else {
      setTotal(0);
    }
  }, [weight, price]);

  const generateOrderId = () => {
    return `OS-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const handleSendWhatsApp = async () => {
    if (!selectedClient || !total) return;

    const orderId = generateOrderId();

    // Save to DB
    try {
      await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          productName: selectedProduct,
          weight: parseFloat(weight.replace(',', '.')),
          pricePerKg: parseFloat(price.replace(',', '.')),
          total: total,
          orderId: orderId
        })
      });
      onRefresh();
    } catch (error) {
      console.error("Error saving sale:", error);
    }

    // Show label preview
    onOpenPreview({
      client: selectedClient,
      product: selectedProduct,
      weight: weight,
      price: price,
      total: total,
      orderId: orderId
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-6 space-y-6"
    >
      <div className="space-y-4">
        {/* Cliente Selection */}
        <div className="space-y-2">
          <div className="flex justify-between items-end px-1">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40">Cliente</label>
            <button 
              onClick={() => setShowClientModal(true)}
              className="text-primary text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 hover:opacity-70 transition-opacity"
            >
              <Plus size={12} /> Novo Cliente
            </button>
          </div>
          <div className="relative group">
            <select 
              className="w-full bg-white border border-primary/10 rounded-2xl px-5 py-4 appearance-none focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium shadow-sm group-hover:border-primary/20"
              value={selectedClient?.id || ''}
              onChange={(e) => {
                const client = clients.find(c => c.id === parseInt(e.target.value));
                setSelectedClient(client || null);
              }}
            >
              <option value="">Selecionar Cliente...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-primary/40 group-hover:text-primary transition-colors pointer-events-none" size={18} />
          </div>
        </div>

        {/* Produto Selection */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40 px-1">Produto</label>
          <div className="relative group">
            <select 
              className="w-full bg-white border border-primary/10 rounded-2xl px-5 py-4 appearance-none focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium shadow-sm group-hover:border-primary/20"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              {PRODUCTS.map(product => (
                <option key={product} value={product}>{product}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-primary/40 group-hover:text-primary transition-colors pointer-events-none" size={18} />
          </div>
        </div>

        {/* Peso e Preço */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40 px-1">Peso (kg)</label>
            <div className="relative group">
              <input 
                type="text" 
                inputMode="decimal"
                placeholder="0,000"
                className="w-full bg-white border border-primary/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-mono font-bold text-xl shadow-sm group-hover:border-primary/20"
                value={weight}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9,.]/g, '');
                  // Only allow one decimal separator
                  const parts = val.split(/[.,]/);
                  if (parts.length <= 2) {
                    setWeight(val);
                  }
                }}
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-ink/20 uppercase tracking-widest pointer-events-none">kg</div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40 px-1">Preço (R$/kg)</label>
            <div className="relative group">
              <input 
                type="text" 
                inputMode="decimal"
                placeholder="0,00"
                className="w-full bg-white border border-primary/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-mono font-bold text-xl shadow-sm group-hover:border-primary/20"
                value={price}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9,.]/g, '');
                  // Only allow one decimal separator
                  const parts = val.split(/[.,]/);
                  if (parts.length <= 2) {
                    setPrice(val);
                  }
                }}
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-ink/20 uppercase tracking-widest pointer-events-none">R$</div>
            </div>
          </div>
        </div>

        {/* Total Display */}
        <div className="relative overflow-hidden bg-white border border-primary/10 rounded-[2rem] p-8 text-center shadow-inner-soft group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary opacity-20"></div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink/30 mb-2">Total Estimado</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl font-serif text-primary/40 mt-2">R$</span>
            <p className="text-5xl font-serif font-black text-ink tracking-tighter">
              {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <motion.div 
            initial={false}
            animate={{ scale: total > 0 ? 1 : 0.9, opacity: total > 0 ? 1 : 0 }}
            className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-[10px] font-bold uppercase tracking-wider"
          >
            <Check size={12} /> Cálculo Realizado
          </motion.div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 gap-4 pt-4">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            disabled={!selectedClient || total === 0}
            onClick={handleSendWhatsApp}
            className="w-full bg-primary text-white font-bold py-5 rounded-[1.5rem] shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale transition-all"
          >
            <Share2 size={20} /> 
            <span className="uppercase tracking-[0.15em] text-xs">Gerar & Enviar Etiqueta</span>
          </motion.button>
        </div>
      </div>

      {/* New Client Modal */}
      <AnimatePresence>
        {showClientModal && (
          <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-cream w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl border border-primary/20"
            >
              <div className="bg-primary p-4 flex justify-between items-center">
                <h3 className="text-white font-bold uppercase tracking-widest text-sm">Novo Cliente</h3>
                <button onClick={() => setShowClientModal(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
              </div>
              <form 
                className="p-6 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const name = formData.get('name') as string;
                  const phone = formData.get('phone') as string;
                  if (name && phone) {
                    await fetch('/api/clients', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name, phone })
                    });
                    onRefresh();
                    setShowClientModal(false);
                  }
                }}
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-ink/40 px-1">Nome Completo</label>
                  <input 
                    name="name"
                    type="text" 
                    required
                    placeholder="Ex: João Silva"
                    className="w-full bg-white border border-primary/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-ink/40 px-1">WhatsApp</label>
                  <input 
                    name="phone"
                    type="tel" 
                    required
                    placeholder="Ex: 11999999999"
                    className="w-full bg-white border border-primary/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 mt-4 uppercase tracking-widest text-xs"
                >
                  Cadastrar Cliente
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- CLIENTES TAB ---
function ClientesTab({ clients, onRefresh }: { clients: Client[], onRefresh: () => Promise<void> }) {
  const [search, setSearch] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  const handleDelete = async (id: number) => {
    if (confirm("Deseja excluir este cliente?")) {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      onRefresh();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif font-bold text-primary">Clientes</h2>
        <button 
          onClick={() => { setEditingClient(null); setShowModal(true); }}
          className="bg-primary text-white p-3 rounded-full shadow-lg shadow-primary/20 active:scale-90 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" size={18} />
        <input 
          type="text" 
          placeholder="Buscar cliente..."
          className="w-full bg-white border border-primary/10 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredClients.map(client => (
          <motion.div 
            layout
            key={client.id} 
            className="bg-white p-5 rounded-[1.5rem] border border-primary/5 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center text-accent font-serif font-bold text-2xl border border-accent/10">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-ink text-lg tracking-tight">{client.name}</h3>
                <p className="text-xs text-ink/30 font-mono flex items-center gap-1.5">
                  <Phone size={12} className="text-secondary" /> {client.phone}
                </p>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => { setEditingClient(client); setShowModal(true); }}
                className="p-2.5 text-secondary hover:bg-secondary/10 rounded-xl transition-colors"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => handleDelete(client.id)}
                className="p-2.5 text-primary hover:bg-primary/10 rounded-xl transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Client Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-cream w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl border border-primary/20"
            >
              <div className="bg-primary p-4 flex justify-between items-center">
                <h3 className="text-white font-bold uppercase tracking-widest text-sm">
                  {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
              </div>
              <form 
                className="p-6 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const name = formData.get('name') as string;
                  const phone = formData.get('phone') as string;
                  if (name && phone) {
                    if (editingClient) {
                      await fetch(`/api/clients/${editingClient.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, phone })
                      });
                    } else {
                      await fetch('/api/clients', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, phone })
                      });
                    }
                    onRefresh();
                    setShowModal(false);
                  }
                }}
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-ink/40">Nome</label>
                  <input name="name" defaultValue={editingClient?.name} required className="w-full bg-white border border-primary/10 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-ink/40">Telefone</label>
                  <input name="phone" defaultValue={editingClient?.phone} required placeholder="55..." className="w-full bg-white border border-primary/10 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-xl">
                  {editingClient ? 'Atualizar' : 'Salvar'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- HISTORICO TAB ---
function HistoricoTab({ sales, onRefresh, onOpenPreview }: { sales: Sale[], onRefresh: () => Promise<void>, onOpenPreview: (data: any) => void }) {
  const totalSales = sales.reduce((acc, sale) => acc + sale.total, 0);
  
  const now = new Date();
  const startMonth = startOfMonth(now);
  const endMonth = endOfMonth(now);
  
  const monthlySales = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp);
    return isWithinInterval(saleDate, { start: startMonth, end: endMonth });
  }).reduce((acc, sale) => acc + sale.total, 0);

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Relatório de Vendas - Origem do Sabor", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);
    
    // Summary Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 242, 237);
    doc.rect(14, 35, 182, 30, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text("Resumo Financeiro", 20, 45);
    
    doc.setFontSize(10);
    doc.text(`Total Geral Acumulado: R$ ${totalSales.toFixed(2).replace('.', ',')}`, 20, 53);
    doc.text(`Total do Mês Atual (${format(now, 'MMMM', { locale: ptBR })}): R$ ${monthlySales.toFixed(2).replace('.', ',')}`, 20, 60);

    // Table
    const tableData = sales.map(sale => [
      format(new Date(sale.timestamp), 'dd/MM/yyyy HH:mm'),
      sale.clientName || 'Cliente Avulso',
      sale.productName,
      `${sale.weight.toFixed(3).replace('.', ',')} kg`,
      `R$ ${sale.total.toFixed(2).replace('.', ',')}`
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['Data', 'Cliente', 'Produto', 'Peso', 'Total']],
      body: tableData,
      headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { top: 75 },
    });

    doc.save(`relatorio-vendas-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif font-bold text-primary">Histórico</h2>
        <button 
          onClick={generatePDF}
          className="bg-secondary text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-secondary/20 hover:scale-105 transition-transform"
        >
          <Share2 size={14} /> Exportar PDF
        </button>
      </div>

      {/* Sales Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-primary/5 shadow-sm">
          <p className="text-[9px] uppercase font-bold text-ink/30 tracking-widest mb-1">Total Geral</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-serif text-primary/40">R$</span>
            <span className="text-2xl font-black text-primary tracking-tighter">
              {totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-primary/5 shadow-sm">
          <p className="text-[9px] uppercase font-bold text-ink/30 tracking-widest mb-1">Vendas do Mês</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-serif text-secondary/40">R$</span>
            <span className="text-2xl font-black text-secondary tracking-tighter">
              {monthlySales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {sales.map(sale => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={sale.id} 
            className="bg-white p-6 rounded-[2rem] border border-primary/5 shadow-sm space-y-4 relative overflow-hidden group hover:shadow-md transition-shadow"
          >
            {/* Accent strip */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent opacity-40 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  <p className="text-[9px] font-bold text-ink/30 uppercase tracking-[0.2em]">
                    {format(new Date(sale.timestamp), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <h3 className="font-serif font-bold text-xl text-ink tracking-tight">{sale.productName}</h3>
                <p className="text-sm font-medium text-secondary/70">{sale.clientName || 'Cliente Avulso'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono text-ink/20 mb-1">#{sale.orderId}</p>
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-xs font-serif text-primary/40">R$</span>
                  <p className="text-2xl font-black text-primary tracking-tighter">{sale.total.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-primary/5">
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase font-bold text-ink/20 tracking-widest">Peso</span>
                  <span className="text-xs font-mono font-bold text-ink/60">{sale.weight.toFixed(3).replace('.', ',')} kg</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase font-bold text-ink/20 tracking-widest">Preço/kg</span>
                  <span className="text-xs font-mono font-bold text-ink/60">R$ {sale.pricePerKg.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
              <button 
                className="bg-secondary/5 text-secondary flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl hover:bg-secondary/10 transition-colors"
                onClick={() => {
                  onOpenPreview({
                    client: { name: sale.clientName || 'Cliente Avulso', phone: sale.clientPhone || '', id: sale.clientId || 0 },
                    product: sale.productName,
                    weight: sale.weight.toString(),
                    price: sale.pricePerKg.toString(),
                    total: sale.total,
                    orderId: sale.orderId
                  });
                }}
              >
                <Share2 size={14} /> Reenviar
              </button>
            </div>
          </motion.div>
        ))}

        {sales.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="bg-primary/5 h-20 w-20 rounded-full flex items-center justify-center mx-auto">
              <History size={40} className="text-primary/20" />
            </div>
            <p className="text-ink/40 font-medium">Nenhuma venda registrada ainda.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
