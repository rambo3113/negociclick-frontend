'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { MapPin, Phone, Star, Clock, ChevronLeft, CheckCircle, Calendar, MessageSquare, ArrowRight, Loader2, MessageCircle, X, Share2, ShoppingCart, Plus, Minus, Truck, Package, ChevronRight, AlertTriangle, BadgeCheck } from 'lucide-react';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import CulqiPaymentModal from '@/components/CulqiPaymentModal';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const UPLOADS_BASE = API_BASE.replace('/api', '');
const resolveUrl = (path?: string | null) => {
  if (!path) return '';
  return path.startsWith('http') ? path : `${UPLOADS_BASE}${path}`;
};

const ORDER_CATEGORIES = new Set(['FLORES', 'REPOSTERIA', 'TEJIDOS_CROCHET', 'CATERING', 'DECORACION_EVENTOS']);

// "Hoy" en fecha calendario de Lima (UTC-5), no en UTC — evita que las horas de
// la noche en Perú (que ya son "mañana" en UTC) corran la validación/fecha un día.
const getLimaDateString = (d: Date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(d);

interface CartItem { service: Service; quantity: number; }

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration?: number;
  category: string;
  photo?: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  client: { name: string };
}

interface Business {
  id: string;
  name: string;
  category: string;
  orderMode?: 'APPOINTMENT' | 'ORDER';
  city: string;
  address: string;
  phone: string;
  description?: string;
  averageRating: number | null;
  totalReviews: number;
  services: Service[];
  reviews: Review[];
  owner: { id: string; name: string; email: string; avatar?: string | null };
  ownerPlan?: string;
  onlinePaymentEnabled?: boolean;
  culqiPublicKey?: string | null;
  paymentInstructions?: string | null;
  slogan?: string;
  coverImage?: string;
  featured?: boolean;
}

interface BusinessHour {
  dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean;
}

interface Photo { id: string; url: string; caption?: string | null; }

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function getTodayStatus(hours: BusinessHour[]): { open: boolean; label: string } {
  const today = new Date().getDay();
  const now = new Date().toTimeString().slice(0, 5);
  const h = hours.find(x => x.dayOfWeek === today);
  if (!h || h.isClosed) return { open: false, label: 'Cerrado hoy' };
  if (now >= h.openTime && now <= h.closeTime)
    return { open: true, label: `Abierto · cierra a las ${h.closeTime}` };
  if (now < h.openTime)
    return { open: false, label: `Abre a las ${h.openTime}` };
  return { open: false, label: 'Cerrado por hoy' };
}

const CATEGORY_META: Record<string, { label: string; emoji: string; gradient: string }> = {
  BARBERIA:         { label: 'Barbería',          emoji: '✂️', gradient: 'from-slate-500 to-slate-700' },
  SPA:              { label: 'Spa',              emoji: '🌿', gradient: 'from-emerald-400 to-teal-600' },
  SALON_BELLEZA:    { label: 'Salón de Belleza', emoji: '💅', gradient: 'from-pink-400 to-rose-600' },
  TIENDA_CELULARES: { label: 'Celulares',        emoji: '📱', gradient: 'from-blue-400 to-cyan-600' },
  VETERINARIA:      { label: 'Veterinaria',      emoji: '🐾', gradient: 'from-green-400 to-emerald-600' },
  REPOSTERIA:       { label: 'Repostería',       emoji: '🎂', gradient: 'from-pink-300 to-rose-500' },
  ODONTOLOGIA:      { label: 'Odontología',      emoji: '🦷', gradient: 'from-cyan-400 to-blue-500' },
  GIMNASIO:         { label: 'Gimnasio / Fitness', emoji: '🏋️', gradient: 'from-orange-400 to-red-500' },
  TATUAJES:         { label: 'Tatuajes & Piercing', emoji: '🎨', gradient: 'from-violet-500 to-purple-700' },
  PSICOLOGO:        { label: 'Psicólogo / Terapia', emoji: '🧠', gradient: 'from-purple-400 to-indigo-600' },
  NUTRICIONISTA:    { label: 'Nutricionista',    emoji: '🥗', gradient: 'from-lime-400 to-green-600' },
  PELUQUERIA_CANINA:  { label: 'Peluquería Canina',    emoji: '🐕', gradient: 'from-yellow-400 to-amber-500' },
  FISIOTERAPIA:       { label: 'Fisioterapia',         emoji: '🦺', gradient: 'from-blue-400 to-indigo-500' },
  MICROPIGMENTACION:  { label: 'Micropigmentación',    emoji: '🖌️', gradient: 'from-rose-400 to-pink-600' },
  CLASES_PARTICULARES:{ label: 'Clases Particulares',  emoji: '📚', gradient: 'from-blue-500 to-violet-600' },
  LIMPIEZA_HOGAR:     { label: 'Limpieza del Hogar',   emoji: '🧹', gradient: 'from-sky-400 to-cyan-500' },
  MAQUILLAJE:          { label: 'Maquillaje Profesional', emoji: '💄', gradient: 'from-fuchsia-400 to-pink-600' },
  DJ:                  { label: 'DJ / Animación',        emoji: '🎧', gradient: 'from-purple-500 to-fuchsia-600' },
  DECORACION_EVENTOS:  { label: 'Decoración de Eventos', emoji: '🎊', gradient: 'from-pink-500 to-rose-600' },
  CATERING:            { label: 'Catering / Chef',       emoji: '🍽️', gradient: 'from-orange-400 to-amber-600' },
  GASFITERIA:          { label: 'Gasfitería',            emoji: '🔧', gradient: 'from-blue-500 to-cyan-600' },
  CARPINTERIA:         { label: 'Carpintería',           emoji: '🪚', gradient: 'from-amber-600 to-orange-700' },
  JARDINERIA:          { label: 'Jardinería',            emoji: '🌱', gradient: 'from-green-500 to-emerald-700' },
  ELECTRICIDAD:        { label: 'Electricidad',          emoji: '⚡', gradient: 'from-yellow-400 to-orange-500' },
  DEPILACION:          { label: 'Depilación',            emoji: '🪒', gradient: 'from-violet-400 to-purple-600' },
  MASAJES_DOMICILIO:   { label: 'Masajes a Domicilio',   emoji: '💆', gradient: 'from-teal-400 to-emerald-600' },
  NAIL_ART:            { label: 'Uñas / Nail Art',       emoji: '💅', gradient: 'from-pink-400 to-fuchsia-500' },
  FLORES:              { label: 'Venta de Flores',       emoji: '🌸', gradient: 'from-rose-400 to-pink-500' },
  TEJIDOS_CROCHET:     { label: 'Tejidos a Crochet',     emoji: '🧶', gradient: 'from-violet-400 to-purple-500' },
  OTRO:                { label: 'Otro',                  emoji: '🏪', gradient: 'from-amber-400 to-orange-500' },
};

function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${cls} ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

export default function BusinessDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingHour, setBookingHour] = useState('9');
  const [bookingMinute, setBookingMinute] = useState('00');
  const [bookingAmPm, setBookingAmPm] = useState<'AM' | 'PM'>('AM');
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingPaid, setBookingPaid] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [premiumPayment, setPremiumPayment] = useState<{
    paymentId: string;
    booking: { id: string; service: { name: string }; date: string; totalAmount: number };
  } | null>(null);
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [dateWarning, setDateWarning] = useState('');
  const [availBlocks, setAvailBlocks] = useState<{ id: string; startDate: string; endDate: string; reason?: string | null }[]>([]);
  const [carouselIdx, setCarouselIdx] = useState(0);
  // Cart (order categories)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState('');

  // orderMode viene del backend; se usa la categoría solo como fallback si aún no llega
  const isOrderCategory = business
    ? (business.orderMode ? business.orderMode === 'ORDER' : ORDER_CATEGORIES.has(business.category))
    : false;
  const cartTotal = parseFloat(cart.reduce((s, i) => s + Number(i.service.price) * i.quantity, 0).toFixed(2));
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const appointmentTotal = parseFloat(selectedServices.reduce((s, sv) => s + Number(sv.price), 0).toFixed(2));

  const addToCart = (service: Service) => {
    setCart(prev => {
      const found = prev.find(i => i.service.id === service.id);
      if (found) return prev.map(i => i.service.id === service.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { service, quantity: 1 }];
    });
  };

  const decreaseCart = (serviceId: string) => {
    setCart(prev => {
      const found = prev.find(i => i.service.id === serviceId);
      if (!found) return prev;
      if (found.quantity === 1) return prev.filter(i => i.service.id !== serviceId);
      return prev.map(i => i.service.id === serviceId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const toggleService = (service: Service) => {
    setSelectedServices(prev => {
      const found = prev.find(s => s.id === service.id);
      if (found) return prev.filter(s => s.id !== service.id);
      return [...prev, service];
    });
  };

  const handleOrder = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    if (cart.length === 0) return;
    if (!deliveryAddress.trim()) { setOrderError('Ingresa una dirección de entrega.'); return; }
    if (deliveryDate) {
      const today = getLimaDateString();
      if (deliveryDate < today) {
        setOrderError('La fecha de entrega no puede ser anterior a hoy.');
        return;
      }
    }
    setOrderLoading(true);
    setOrderError('');
    const lines = cart.map(i =>
      `${i.quantity}x ${i.service.name} (S/ ${(Number(i.service.price) * i.quantity).toLocaleString('es-PE', { minimumFractionDigits: 2 })})`
    ).join(' + ');
    const structured = `[PEDIDO] ${lines} | Total: S/ ${cartTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })} | Entrega: ${deliveryDate || 'A coordinar'} | Dirección: ${deliveryAddress}${orderNotes ? ` | Notas: ${orderNotes}` : ''}`;
    // Mediodía Lima con offset explícito (-05:00): un instante inequívoco sea cual sea
    // la zona horaria del navegador o del servidor que lo parsee — nunca se corre de día.
    const deliveryISO = deliveryDate
      ? `${deliveryDate}T12:00:00-05:00`
      : new Date().toISOString();
    try {
      const res = await api.post('/bookings', {
        serviceId: cart[0].service.id,
        businessId: business?.id,
        date: deliveryISO,
        notes: structured,
        orderTotal: cartTotal,
        deliveryAddress,
      });
      if (business?.onlinePaymentEnabled) {
        let payRes;
        try {
          payRes = await api.post('/payments', { bookingId: res.data.booking.id });
        } catch (payErr: any) {
          await api.delete(`/bookings/${res.data.booking.id}`).catch(() => {});
          throw payErr;
        }
        setPremiumPayment({
          paymentId: payRes.data.payment.id,
          booking: { id: res.data.booking.id, service: { name: `Pedido (${cart.length} producto${cart.length > 1 ? 's' : ''})` }, date: deliveryISO, totalAmount: cartTotal },
        });
      } else {
        setCart([]); setDeliveryAddress(''); setDeliveryDate(''); setOrderNotes('');
        setOrderSuccess(true);
      }
    } catch (err: any) {
      setOrderError(err.response?.data?.error || 'Error al enviar el pedido');
    } finally {
      setOrderLoading(false);
    }
  };

  const buildDateISO = () => {
    if (!bookingDate) return '';
    let h = parseInt(bookingHour);
    if (bookingAmPm === 'PM' && h !== 12) h += 12;
    if (bookingAmPm === 'AM' && h === 12) h = 0;
    return `${bookingDate}T${String(h).padStart(2, '0')}:${bookingMinute}:00-05:00`;
  };
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      api.get(`/businesses/${id}`),
      api.get(`/businesses/${id}/hours`).catch(() => ({ data: { hours: [] } })),
      api.get(`/businesses/${id}/photos`).catch(() => ({ data: { photos: [] } })),
      api.get(`/businesses/${id}/availability`).catch(() => ({ data: { blocks: [] } })),
    ]).then(([bizRes, hoursRes, photosRes, availRes]) => {
      setBusiness(bizRes.data.business);
      setHours(hoursRes.data.hours ?? []);
      setPhotos(photosRes.data.photos ?? []);
      setAvailBlocks(availRes.data.blocks ?? []);
      // Registrar vista (fire-and-forget)
      api.post(`/businesses/${id}/view`).catch(() => {});
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const iso = buildDateISO();
    if (!iso || hours.length === 0) { setDateWarning(''); return; }
    const dt = new Date(iso);
    const dayOfWeek = dt.getDay();
    const time = `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
    const h = hours.find(x => x.dayOfWeek === dayOfWeek);
    if (!h || h.isClosed) {
      setDateWarning(`El negocio no atiende los ${DAYS_ES[dayOfWeek]}.`);
      return;
    }
    if (time < h.openTime || time > h.closeTime) {
      setDateWarning(`Fuera del horario de atención (${h.openTime} – ${h.closeTime}).`);
      return;
    }
    if (bookingDate && availBlocks.length > 0) {
      const day = new Date(bookingDate + 'T00:00:00');
      const blocked = availBlocks.find(b => {
        const s = new Date(b.startDate); s.setHours(0,0,0,0);
        const e = new Date(b.endDate);   e.setHours(23,59,59,999);
        return day >= s && day <= e;
      });
      if (blocked) {
        setDateWarning(blocked.reason ? `No disponible: ${blocked.reason}` : 'El negocio no está disponible en esta fecha.');
        return;
      }
    }
    setDateWarning('');
  }, [bookingDate, bookingHour, bookingMinute, bookingAmPm, hours, availBlocks]);

  // Slides para el carousel: imagen de portada + fotos de galería
  const carouselSlides = useMemo(() => {
    if (!business || business.ownerPlan === 'FREE') return [];
    const slides: string[] = [];
    if (business.coverImage) slides.push(resolveUrl(business.coverImage));
    photos.forEach(p => {
      const url = resolveUrl(p.url);
      if (!slides.includes(url)) slides.push(url);
    });
    return slides;
  }, [business, photos]);

  useEffect(() => {
    if (carouselSlides.length <= 1) return;
    const t = setInterval(() => setCarouselIdx(i => (i + 1) % carouselSlides.length), 5000);
    return () => clearInterval(t);
  }, [carouselSlides.length]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: business?.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.show('Enlace copiado al portapapeles', 'success');
      }
    } catch {
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.show('Enlace copiado al portapapeles', 'success');
    }
  };

  const handleBooking = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    if (selectedServices.length === 0) return;
    const dateISO = buildDateISO();
    if (!dateISO) return;
    setBookingLoading(true);
    setBookingError('');
    try {
      // Multi-service: structured notes + orderTotal
      const isMulti = selectedServices.length > 1;
      const lines = selectedServices.map(s => `${s.name} (S/ ${Number(s.price).toLocaleString('es-PE', { minimumFractionDigits: 2 })})`).join(' + ');
      const bookingNotes = isMulti
        ? `[MULTI-SERVICIO] ${lines} | Total: S/ ${appointmentTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}${notes ? ` | Notas: ${notes}` : ''}`
        : notes;
      const bookingRes = await api.post('/bookings', {
        serviceId: selectedServices[0].id,
        businessId: business?.id,
        date: dateISO,
        notes: bookingNotes,
        ...(isMulti ? { serviceIds: selectedServices.map(s => s.id) } : {}),
      });
      const newBooking = bookingRes.data.booking;

      if (business?.onlinePaymentEnabled) {
        let paymentRes;
        try {
          paymentRes = await api.post('/payments', { bookingId: newBooking.id });
        } catch (payErr: any) {
          // Si falla la creación del pago, cancelar la reserva para evitar booking huérfano
          await api.delete(`/bookings/${newBooking.id}`).catch(() => {});
          throw payErr;
        }
        const displayName = isMulti
          ? `${selectedServices.length} servicios`
          : newBooking.service.name;
        setPremiumPayment({
          paymentId: paymentRes.data.payment.id,
          booking: {
            id: newBooking.id,
            service: { name: displayName },
            date: newBooking.date,
            totalAmount: isMulti ? appointmentTotal : newBooking.totalAmount,
          },
        });
      } else {
        setBookingSuccess(true);
      }

      setBookingDate('');
      setBookingHour('9');
      setBookingMinute('00');
      setBookingAmPm('AM');
      setNotes('');
      if (!business || !business.onlinePaymentEnabled) setSelectedServices([]);
    } catch (err: any) {
      setBookingError(err.response?.data?.error || 'Error al crear reserva');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Cargando negocio...</p>
      </div>
    </div>
  );

  if (!business) return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">😕</div>
        <h2 className="text-xl font-bold text-gray-900">Negocio no encontrado</h2>
        <Link href="/" className="text-indigo-600 font-semibold hover:underline text-sm">Volver al inicio</Link>
      </div>
    </div>
  );

  const meta = CATEGORY_META[business.category] ?? CATEGORY_META.OTRO;
  const minPrice = business.services.length > 0 ? Math.min(...business.services.map(s => Number(s.price))) : null;
  const todayStatus = getTodayStatus(hours);
  const isBusinessVerified = !!(business.coverImage && business.description && photos.length >= 1);

  const isOwner = user && business.owner && user.id === business.owner.id;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* ── BANNER DUEÑO: Destacar negocio ── */}
      {isOwner && !business.featured && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">⚡</span>
              <div>
                <p className="text-sm font-semibold text-amber-900">Este es tu negocio</p>
                <p className="text-xs text-amber-700">Destácalo para aparecer primero y atraer más clientes — desde S/ 9.90</p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="flex-shrink-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:from-amber-600 hover:to-orange-600 transition"
            >
              Destacar mi negocio →
            </Link>
          </div>
        </div>
      )}
      {isOwner && business.featured && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-200">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2.5">
            <span className="text-xl">✅</span>
            <p className="text-sm text-indigo-800">
              <strong>Tu negocio está Destacado</strong> — aparece primero en los resultados.{' '}
              <Link href="/dashboard" className="underline hover:text-indigo-600">Gestionar desde el dashboard</Link>
            </p>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <div className={`relative overflow-hidden min-h-[280px] ${carouselSlides.length > 0 ? '' : `bg-gradient-to-br ${meta.gradient}`}`}>
        {carouselSlides.length > 0 ? (
          <>
            {carouselSlides.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={business.name}
                className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ${i === carouselIdx ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}
            <div className="absolute inset-0 bg-black/50" />
            {carouselSlides.length > 1 && (
              <>
                <button
                  onClick={() => setCarouselIdx(i => (i - 1 + carouselSlides.length) % carouselSlides.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCarouselIdx(i => (i + 1) % carouselSlides.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                  {carouselSlides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCarouselIdx(i)}
                      className={`rounded-full transition-all ${i === carouselIdx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
            <span className="text-[20rem] leading-none">{meta.emoji}</span>
          </div>
        )}

        <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium mb-6 transition-colors group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Volver
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-xl flex-shrink-0">
              <span className="text-4xl font-black text-white drop-shadow">
                {business.name.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-bold bg-white/20 backdrop-blur-sm border border-white/20 text-white px-3 py-1 rounded-full">
                  {meta.emoji} {meta.label}
                </span>
                {isBusinessVerified && (
                  <span className="text-xs font-bold bg-green-500/20 border border-green-400/30 text-white px-3 py-1 rounded-full flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verificado
                  </span>
                )}
                {business.averageRating && (
                  <span className="text-xs font-bold bg-yellow-400/20 border border-yellow-400/30 text-white px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                    {business.averageRating} · {business.totalReviews} reseña{business.totalReviews !== 1 ? 's' : ''}
                  </span>
                )}
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  todayStatus.open
                    ? 'bg-green-500/20 border-green-400/30 text-white'
                    : 'bg-red-500/20 border-red-400/30 text-white/80'
                }`}>
                  {todayStatus.open ? '🟢' : '🔴'} {todayStatus.label}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-1 drop-shadow-sm">{business.name}</h1>
              {business.slogan && business.ownerPlan !== 'FREE' && (
                <p className="text-white/80 text-sm italic mb-2">"{business.slogan}"</p>
              )}
              <div className="flex flex-wrap gap-3 text-white/70 text-sm">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />{business.city} · {business.address}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />{business.phone}
                </span>
                <a
                  href={`https://wa.me/51${business.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Compartir
                </button>
              </div>
            </div>

            {minPrice !== null && (
              <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-5 py-3 text-center">
                <p className="text-white/60 text-xs">Desde</p>
                <p className="text-2xl font-black text-white">S/ {minPrice.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto w-full px-4 py-8 pb-24 lg:pb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT COLUMN ── */}
        <div className={`${(business?.ownerPlan === 'FREE' && !isOrderCategory) ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-6`}>

          {/* Description — solo PRO/PREMIUM */}
          {business.description && business.ownerPlan !== 'FREE' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-gray-600 leading-relaxed">{business.description}</p>
            </div>
          )}

          {/* Photo gallery */}
          {photos.length > 0 && business?.ownerPlan !== 'FREE' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-bold text-gray-900">Galería</h2>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {photos.map((photo, i) => (
                  <button
                    key={photo.id}
                    onClick={() => setLightboxPhoto(photo)}
                    className={`relative overflow-hidden rounded-xl border border-gray-100 hover:opacity-90 transition-opacity ${i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'}`}
                  >
                    <img
                      src={resolveUrl(photo.url)}
                      alt={photo.caption ?? 'Foto del negocio'}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          <div id="services-section" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50">
              <h2 className="font-bold text-gray-900 text-lg">Servicios disponibles</h2>
              {business.services.length > 0 && business?.ownerPlan !== 'FREE' && (
                <p className="text-sm text-gray-400 mt-0.5">
                  {isOrderCategory ? 'Agrega productos a tu carrito' : 'Selecciona uno para reservar'}
                </p>
              )}
            </div>

            {business.services.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <div className="text-4xl mb-3">🛠️</div>
                <p className="text-gray-400 text-sm">Este negocio aún no ha publicado servicios.</p>
              </div>
            ) : isOrderCategory ? (
              business?.ownerPlan === 'FREE' ? (
                /* ORDER + FREE: read-only list + WhatsApp CTA */
                <>
                  <div className="divide-y divide-gray-50">
                    {business.services.slice(0, 5).map(service => (
                      <div key={service.id} className="px-6 py-4 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">{service.name}</p>
                          {service.description && <p className="text-sm text-gray-400 truncate">{service.description}</p>}
                        </div>
                        <span className="text-lg font-black text-gray-900 flex-shrink-0">
                          S/ {Number(service.price).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="px-6 py-4 border-t border-gray-50 bg-green-50/60">
                    <p className="text-sm text-gray-500 mb-3">Para hacer un pedido, contacta directamente al negocio:</p>
                    <a
                      href={`https://wa.me/51${business.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-400 text-white font-bold py-3 rounded-xl transition-all hover:shadow-lg text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Pedir por WhatsApp
                    </a>
                  </div>
                </>
              ) : (
                /* ORDER + PRO/PREMIUM: product cards with +/- quantity */
                <div className="divide-y divide-gray-50">
                  {business.services.map(service => {
                    const cartItem = cart.find(i => i.service.id === service.id);
                    const qty = cartItem?.quantity ?? 0;
                    return (
                      <div key={service.id} className="px-6 py-4 flex items-center gap-4">
                        {service.photo && (
                          <img
                            src={resolveUrl(service.photo)}
                            alt={service.name}
                            className="w-16 h-16 rounded-xl object-cover object-center flex-shrink-0 border border-gray-100"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">{service.name}</p>
                          {service.description && <p className="text-sm text-gray-400 truncate">{service.description}</p>}
                          <span className="text-base font-black text-indigo-600 mt-0.5 block">
                            S/ {Number(service.price).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {qty > 0 ? (
                            <>
                              <button
                                onClick={() => decreaseCart(service.id)}
                                className="w-8 h-8 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 flex items-center justify-center transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-6 text-center font-bold text-gray-900">{qty}</span>
                              <button
                                onClick={() => addToCart(service)}
                                className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => addToCart(service)}
                              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Agregar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : business?.ownerPlan === 'FREE' ? (
              /* APPOINTMENT + FREE: read-only list, max 3 services */
              <div className="divide-y divide-gray-50">
                {business.services.slice(0, 5).map(service => (
                  <div key={service.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{service.name}</p>
                      {service.description && (
                        <p className="text-sm text-gray-400 truncate">{service.description}</p>
                      )}
                    </div>
                    <span className="text-lg font-black text-gray-900 flex-shrink-0">
                      S/ {Number(service.price).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* APPOINTMENT + PRO/PREMIUM: multi-service selection */
              <div className="divide-y divide-gray-50">
                {business.services.map(service => {
                  const isSelected = selectedServices.some(s => s.id === service.id);
                  return (
                    <button
                      key={service.id}
                      onClick={() => toggleService(service)}
                      className={`w-full text-left px-6 py-4 flex items-center gap-4 transition-all group ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                    >
                      {service.photo && (
                        <img
                          src={resolveUrl(service.photo)}
                          alt={service.name}
                          className="w-14 h-14 rounded-xl object-cover object-center flex-shrink-0 border border-gray-100"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`font-semibold ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>
                            {service.name}
                          </p>
                          {isSelected && (
                            <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Seleccionado</span>
                          )}
                        </div>
                        {service.description && <p className="text-sm text-gray-400 truncate">{service.description}</p>}
                        {service.duration && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400 mt-1">
                            <Clock className="w-3 h-3" />{service.duration} min
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-lg font-black ${isSelected ? 'text-indigo-600' : 'text-gray-900'}`}>
                          S/ {Number(service.price).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </span>
                        <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 group-hover:border-indigo-400'}`}>
                          {isSelected && <CheckCircle className="w-4 h-4 text-white fill-white" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Business hours */}
          {hours.length > 0 && business?.ownerPlan !== 'FREE' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-bold text-gray-900">Horarios de atención</h2>
              </div>
              <div className="px-6 py-4 space-y-2">
                {DAYS_ES.map((day, i) => {
                  const h = hours.find(x => x.dayOfWeek === i);
                  const isToday = new Date().getDay() === i;
                  return (
                    <div key={i} className={`flex items-center justify-between py-1.5 ${isToday ? 'font-semibold' : ''}`}>
                      <span className={`text-sm ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
                        {isToday && <span className="mr-1.5 text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">Hoy</span>}
                        {day}
                      </span>
                      {!h || h.isClosed ? (
                        <span className="text-xs text-red-400 font-medium">Cerrado</span>
                      ) : (
                        <span className={`text-sm ${isToday ? 'text-indigo-600' : 'text-gray-500'}`}>
                          {h.openTime} – {h.closeTime}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Google Maps */}
          {business.address && business.ownerPlan !== 'FREE' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <div>
                  <h2 className="font-bold text-gray-900">Ubicación</h2>
                  <p className="text-sm text-gray-400">{business.address}, {business.city}</p>
                </div>
              </div>
              <div className="h-52">
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(`${business.address}, ${business.city}, Lima, Peru`)}&output=embed&z=15`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Ubicación de ${business.name}`}
                />
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Reseñas</h2>
                {business.totalReviews > 0 && (
                  <p className="text-sm text-gray-400 mt-0.5">{business.totalReviews} opiniones de clientes</p>
                )}
              </div>
              {business.averageRating && (
                <div className="text-center">
                  <p className="text-3xl font-black text-gray-900">{business.averageRating}</p>
                  <StarRow rating={Math.round(business.averageRating)} size="sm" />
                </div>
              )}
            </div>

            {business.reviews.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Aún no hay reseñas. ¡Sé el primero!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {business.reviews.map(review => (
                  <div key={review.id} className="px-6 py-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                          {review.client.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">{review.client.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRow rating={review.rating} size="sm" />
                        <span className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 leading-relaxed ml-10">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">

            {/* Card propietario — solo PRO / PREMIUM */}
            {business.ownerPlan !== 'FREE' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  {business.owner.avatar ? (
                    <img
                      src={resolveUrl(business.owner.avatar)}
                      alt={business.owner.name}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-100"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center ring-2 ring-indigo-100">
                      <span className="text-white font-bold text-xl">
                        {business.owner.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {business.ownerPlan === 'PREMIUM' && (
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                      <BadgeCheck className="w-3.5 h-3.5 text-white" />
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Atendido por</p>
                  <p className="font-bold text-gray-900 text-sm truncate">{business.owner.name}</p>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                    business.ownerPlan === 'PREMIUM'
                      ? 'bg-amber-50 text-amber-600 border border-amber-200'
                      : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                  }`}>
                    {business.ownerPlan === 'PREMIUM' ? 'PREMIUM' : 'PRO'}
                  </span>
                </div>
              </div>
            )}

            {isOrderCategory ? (
              /* ── ORDER SIDEBAR ── */
              business?.ownerPlan === 'FREE' ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                  <Package className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 mb-2">Haz tu pedido</h3>
                  <p className="text-sm text-gray-500 mb-4">Contacta al negocio para coordinar tu pedido y entrega.</p>
                  <a
                    href={`https://wa.me/51${business.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-400 text-white font-bold py-3 rounded-xl transition-all hover:shadow-lg text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Pedir por WhatsApp
                  </a>
                </div>
              ) : orderSuccess ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-9 h-9 text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">¡Pedido enviado!</h3>
                  <p className="text-sm text-gray-400 mb-5">El negocio recibirá tu pedido y coordinará la entrega contigo.</p>
                  <Link
                    href="/bookings"
                    className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all mb-3"
                  >
                    Ver mis pedidos <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setOrderSuccess(false)}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Hacer otro pedido
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Cart header */}
                  <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-gray-900">Tu carrito</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Agrega productos desde la lista</p>
                    </div>
                    {cartCount > 0 && (
                      <span className="text-xs font-bold bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </div>

                  {/* Cart items */}
                  {cart.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                      <ShoppingCart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Tu carrito está vacío</p>
                    </div>
                  ) : (
                    <>
                      <div className="divide-y divide-gray-50">
                        {cart.map(item => (
                          <div key={item.service.id} className="px-4 py-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{item.service.name}</p>
                              <p className="text-xs text-gray-400">
                                S/ {Number(item.service.price).toLocaleString('es-PE', { minimumFractionDigits: 2 })} c/u
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => decreaseCart(item.service.id)}
                                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-5 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                              <button
                                onClick={() => addToCart(item.service)}
                                className="w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-sm font-black text-indigo-600 w-16 text-right">
                              S/ {(Number(item.service.price) * item.quantity).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-700">Total</span>
                        <span className="text-lg font-black text-indigo-600">
                          S/ {cartTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Order form */}
                  <form id="order-form" onSubmit={handleOrder} className="p-5 space-y-4 border-t border-gray-100">
                    {orderError && (
                      <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
                        {orderError}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-indigo-400" />
                        Dirección de entrega
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={e => setDeliveryAddress(e.target.value)}
                        placeholder="Ej: Av. Larco 1234, Miraflores"
                        required
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        Fecha de entrega <span className="font-normal text-gray-400">(opcional)</span>
                      </label>
                      <input
                        type="date"
                        value={deliveryDate}
                        onChange={e => setDeliveryDate(e.target.value)}
                        min={getLimaDateString()}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Notas <span className="font-normal text-gray-400">(opcional)</span>
                      </label>
                      <textarea
                        value={orderNotes}
                        onChange={e => setOrderNotes(e.target.value)}
                        rows={2}
                        placeholder="Color, tamaño, instrucciones especiales..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={orderLoading || cart.length === 0}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      {orderLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : cart.length === 0 ? (
                        'Agrega productos al carrito'
                      ) : business?.onlinePaymentEnabled ? (
                        <><Package className="w-4 h-4" /> Pedir y pagar</>
                      ) : (
                        <><Package className="w-4 h-4" /> Enviar pedido</>
                      )}
                    </button>
                    <p className="text-xs text-gray-400 text-center">
                      {business?.onlinePaymentEnabled
                        ? 'Pago seguro · Tarjeta de crédito, débito o Yape'
                        : 'El negocio coordinará la entrega contigo'}
                    </p>
                  </form>
                </div>
              )
            ) : (
              /* ── APPOINTMENT SIDEBAR ── */
              business?.ownerPlan === 'FREE' ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">Pedidos no disponibles</h3>
                  <p className="text-sm text-gray-500 mb-4">Este negocio aún no recibe pedidos online. Contáctalos directamente.</p>
                  {business.phone && (
                    <a
                      href={`https://wa.me/${business.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold text-sm transition"
                    >
                      <MessageCircle className="w-4 h-4" /> Contactar por WhatsApp
                    </a>
                  )}
                </div>
              ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {bookingSuccess ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-9 h-9 text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">
                    {bookingPaid ? '¡Reserva confirmada!' : '¡Reserva creada!'}
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    {bookingPaid
                      ? 'Tu pago fue procesado exitosamente. Nos vemos pronto.'
                      : 'Tu cita está agendada.'}
                  </p>
                  {!bookingPaid && business.paymentInstructions && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left mb-4">
                      <p className="text-xs font-semibold text-amber-800 mb-1">Instrucciones de pago</p>
                      <p className="text-sm text-amber-700 whitespace-pre-line">{business.paymentInstructions}</p>
                    </div>
                  )}
                  <Link
                    href="/bookings"
                    className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all mb-3"
                  >
                    Ver mis reservas <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => { setBookingSuccess(false); setBookingPaid(false); setSelectedServices([]); }}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Hacer otra reserva
                  </button>
                </div>
              ) : (
                <>
                  <div className="px-6 py-5 border-b border-gray-50">
                    <h2 className="font-bold text-gray-900">Reservar cita</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Selecciona un servicio y fecha</p>
                  </div>

                  {/* Selected services preview */}
                  {selectedServices.length > 0 && (
                    <div className="mx-4 mt-4 space-y-1.5">
                      {selectedServices.map(sv => (
                        <div key={sv.id} className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-indigo-800">{sv.name}</p>
                            {sv.duration && (
                              <p className="text-xs text-indigo-500 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />{sv.duration} min
                              </p>
                            )}
                          </div>
                          <span className="font-black text-indigo-700 text-sm flex-shrink-0">S/ {Number(sv.price).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                          <button
                            type="button"
                            onClick={() => toggleService(sv)}
                            className="w-6 h-6 rounded-full bg-indigo-200 hover:bg-red-100 hover:text-red-600 text-indigo-500 flex items-center justify-center transition-colors flex-shrink-0"
                            title="Quitar servicio"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {selectedServices.length > 1 && (
                        <div className="flex justify-between items-center px-3 py-2 bg-indigo-600 rounded-xl">
                          <span className="text-sm font-bold text-white">Total ({selectedServices.length} servicios)</span>
                          <span className="font-black text-white">S/ {appointmentTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleBooking} className="p-6 space-y-4">
                    {bookingError && (
                      <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
                        {bookingError}
                      </div>
                    )}

                    {selectedServices.length === 0 && (
                      <div className="bg-amber-50 border border-amber-100 text-amber-700 text-xs rounded-xl px-3 py-2.5 text-center">
                        ← Selecciona uno o más servicios de la lista
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={bookingDate}
                        onChange={e => setBookingDate(e.target.value)}
                        required
                        min={new Date().toISOString().slice(0, 10)}
                        className={`w-full border rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all ${dateWarning ? 'border-amber-300' : 'border-gray-200'}`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        Hora
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={bookingHour}
                          onChange={e => setBookingHour(e.target.value)}
                          className="flex-1 border border-gray-200 rounded-xl px-3 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        >
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => (
                            <option key={h} value={String(h)}>{String(h).padStart(2,'0')}</option>
                          ))}
                        </select>
                        <select
                          value={bookingMinute}
                          onChange={e => setBookingMinute(e.target.value)}
                          className="w-20 border border-gray-200 rounded-xl px-3 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        >
                          {['00','15','30','45'].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <div className="flex rounded-xl overflow-hidden border border-gray-200">
                          {(['AM','PM'] as const).map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setBookingAmPm(p)}
                              className={`px-4 py-3 text-sm font-bold transition-colors ${bookingAmPm === p ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                      {dateWarning && (
                        <p className={`text-xs mt-1.5 flex items-center gap-1 ${dateWarning.startsWith('No disponible') ? 'text-red-600' : 'text-amber-600'}`}>
                          {dateWarning.startsWith('No disponible')
                            ? <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            : <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          }
                          {dateWarning}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Notas <span className="font-normal text-gray-400">(opcional)</span>
                      </label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Alguna preferencia o indicación..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={bookingLoading || selectedServices.length === 0 || !bookingDate}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      {bookingLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : !user ? (
                        'Inicia sesión para reservar'
                      ) : selectedServices.length === 0 ? (
                        'Selecciona un servicio'
                      ) : !bookingDate ? (
                        'Elige una fecha'
                      ) : business?.onlinePaymentEnabled ? (
                        <><Calendar className="w-4 h-4" /> Reservar y pagar</>
                      ) : (
                        <><Calendar className="w-4 h-4" /> Reservar ahora</>
                      )}
                    </button>

                    <p className="text-xs text-gray-400 text-center">
                      {business?.onlinePaymentEnabled
                        ? 'Pago seguro · Tarjeta de crédito, débito o Yape'
                        : 'Reserva gratis · El negocio te contactará'}
                    </p>
                  </form>
                </>
              )}
            </div>
            ))
          }
          </div>
        </div>
      </main>


      {/* ── Botón flotante mobile: ORDER ── */}
      {isOrderCategory && business?.ownerPlan !== 'FREE' && !orderSuccess && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 flex items-center gap-3 shadow-2xl shadow-black/20">
          {cartCount > 0 ? (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700">{cartCount} producto{cartCount > 1 ? 's' : ''} en el carrito</p>
                <p className="text-sm font-black text-indigo-600">
                  S/ {cartTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <button
                onClick={() => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex-shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all flex items-center gap-1.5"
              >
                <ShoppingCart className="w-4 h-4" /> Confirmar pedido
              </button>
            </>
          ) : (
            <>
              <p className="flex-1 text-sm text-gray-500">Agrega productos a tu pedido</p>
              <button
                onClick={() => document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex-shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:shadow-lg transition-all"
              >
                Ver productos
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Botón flotante mobile: APPOINTMENT ── */}
      {!isOrderCategory && business?.ownerPlan !== 'FREE' && !bookingSuccess && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 flex items-center gap-3 shadow-2xl shadow-black/20">
          {selectedServices.length > 0 ? (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">
                  {selectedServices.length === 1 ? selectedServices[0].name : `${selectedServices.length} servicios seleccionados`}
                </p>
                <p className="text-sm font-black text-indigo-600">
                  S/ {appointmentTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <button
                onClick={() => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex-shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all"
              >
                Reservar ahora
              </button>
            </>
          ) : (
            <>
              <p className="flex-1 text-sm text-gray-500">Elige un servicio para reservar</p>
              <button
                onClick={() => document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex-shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:shadow-lg transition-all"
              >
                Ver servicios
              </button>
            </>
          )}
        </div>
      )}

      {/* Modal de pago PREMIUM */}
      {premiumPayment && business && (
        <CulqiPaymentModal
          booking={{
            id: premiumPayment.booking.id,
            service: { name: premiumPayment.booking.service.name },
            business: { name: business.name },
            date: premiumPayment.booking.date,
            totalAmount: premiumPayment.booking.totalAmount,
          }}
          paymentId={premiumPayment.paymentId}
          publicKey={business.culqiPublicKey}
          isOrder={isOrderCategory}
          onSuccess={() => {
            setPremiumPayment(null);
            if (isOrderCategory) {
              setCart([]); setDeliveryAddress(''); setDeliveryDate(''); setOrderNotes('');
              setOrderSuccess(true);
            } else {
              setSelectedServices([]);
              setBookingPaid(true); setBookingSuccess(true);
            }
          }}
          onClose={() => setPremiumPayment(null)}
        />
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
            onClick={() => setLightboxPhoto(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={resolveUrl(lightboxPhoto.url)}
            alt={lightboxPhoto.caption ?? 'Foto'}
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
