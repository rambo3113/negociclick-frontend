'use client';

import { useEffect, useState, useCallback, useRef, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Store, Calendar, TrendingUp, Star, Plus, Trash2,
  Package, X, Check, Clock, AlertCircle,
  Zap, Crown, Sparkles, Pencil, Save, Image, Upload, Clock3, BarChart2, Lock,
  Mail, ClipboardCopy, Banknote, CalendarOff, Loader2,
  BadgeCheck, Camera, Eye,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import FeaturedSection from '@/components/FeaturedSection';

interface Subscription { plan: string; commissionRate: number; endDate?: string | null; }

interface Business {
  id: string; name: string; category: string; city: string;
  address: string; phone: string; email?: string; description?: string;
  slogan?: string; coverImage?: string;
  isActive: boolean; averageRating?: number | null; totalReviews?: number;
  services: Service[]; _count?: { bookings: number };
}

interface Service {
  id: string; name: string; description?: string | null;
  price: number; duration?: number | null; category: string; photo?: string | null;
}

interface Booking {
  id: string; date: string; status: string; totalAmount: number; vendorAmount: number;
  notes?: string; client: { name: string; email: string }; service: { name: string };
}

interface BusinessHour {
  dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean;
}

interface Photo { id: string; url: string; caption?: string | null; order: number; }

type Tab = 'Reservas' | 'Negocios' | 'Servicios' | 'Horarios' | 'Fotos' | 'Perfil' | 'Ingresos' | 'Agenda' | 'Analíticas';

interface BusinessAnalytics {
  views: number;
  bookingsLast30: number;
  bookingsLast7: number;
  bookingsByStatus: Record<string, number>;
  recentReviews: Array<{ rating: number; comment?: string; createdAt: string; client: { name: string } }>;
  topServices: Array<{ name: string; count: number }>;
  revenueLastMonth: number;
}

interface AvailabilityBlock { id: string; startDate: string; endDate: string; reason?: string | null; }
type EarningsPeriod = 'week' | 'month' | 'year' | 'all';

interface EarningsSummary { totalRevenue: number; totalCommission: number; totalNet: number; transactionCount: number; }
interface EarningsTx { id: string; date: string; clientName: string; serviceName: string; notes: string | null; amount: number; commission: number; net: number; provider: string; }

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  PENDING:   { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  CONFIRMED: { label: 'Confirmada', color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  COMPLETED: { label: 'Completada', color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  CANCELLED: { label: 'Cancelada',  color: 'bg-red-100 text-red-700',      dot: 'bg-red-400' },
};

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DEFAULT_HOURS: BusinessHour[] = DAYS_ES.map((_, i) => ({
  dayOfWeek: i,
  openTime: '09:00',
  closeTime: '18:00',
  isClosed: i === 0, // Domingo cerrado por defecto
}));

const SERVICE_CATEGORIES = ['BARBERIA', 'SPA', 'SALON_BELLEZA', 'TIENDA_CELULARES', 'VETERINARIA', 'REPOSTERIA', 'ODONTOLOGIA', 'GIMNASIO', 'TATUAJES', 'PSICOLOGO', 'NUTRICIONISTA', 'PELUQUERIA_CANINA', 'FISIOTERAPIA', 'MICROPIGMENTACION', 'CLASES_PARTICULARES', 'LIMPIEZA_HOGAR', 'MAQUILLAJE', 'DJ', 'DECORACION_EVENTOS', 'CATERING', 'GASFITERIA', 'CARPINTERIA', 'JARDINERIA', 'ELECTRICIDAD', 'DEPILACION', 'MASAJES_DOMICILIO', 'NAIL_ART', 'FLORES', 'TEJIDOS_CROCHET', 'OTRO'];
const CATEGORY_LABELS: Record<string, string> = {
  BARBERIA: 'Barbería', SPA: 'Spa', SALON_BELLEZA: 'Salón de Belleza',
  TIENDA_CELULARES: 'Tienda de Celulares', VETERINARIA: 'Veterinaria',
  REPOSTERIA: 'Repostería', ODONTOLOGIA: 'Odontología',
  GIMNASIO: 'Gimnasio / Fitness', TATUAJES: 'Tatuajes & Piercing',
  PSICOLOGO: 'Psicólogo / Terapia', NUTRICIONISTA: 'Nutricionista',
  PELUQUERIA_CANINA: 'Peluquería Canina', FISIOTERAPIA: 'Fisioterapia',
  MICROPIGMENTACION: 'Micropigmentación', CLASES_PARTICULARES: 'Clases Particulares',
  LIMPIEZA_HOGAR: 'Limpieza del Hogar', MAQUILLAJE: 'Maquillaje Profesional',
  DJ: 'DJ / Animación', DECORACION_EVENTOS: 'Decoración de Eventos',
  CATERING: 'Catering / Chef', GASFITERIA: 'Gasfitería',
  CARPINTERIA: 'Carpintería', JARDINERIA: 'Jardinería',
  ELECTRICIDAD: 'Electricidad', DEPILACION: 'Depilación',
  MASAJES_DOMICILIO: 'Masajes a Domicilio', NAIL_ART: 'Uñas / Nail Art',
  FLORES: 'Venta de Flores', TEJIDOS_CROCHET: 'Tejidos a Crochet', OTRO: 'Otro',
};
const emptyServiceForm = { name: '', description: '', price: '', duration: '', category: 'BARBERIA' };

interface CategoryConfig {
  termPlural: string;
  emoji: string;
  staffLabel: string;
  bookingLabel: string;
  templates: { name: string; price: number; duration?: number | null; description: string }[];
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  BARBERIA: {
    termPlural: 'Turnos', emoji: '✂️', staffLabel: 'Barbero', bookingLabel: 'turno',
    templates: [
      { name: 'Corte clásico',          price: 20,  duration: 30, description: 'Corte con tijera o máquina' },
      { name: 'Corte + arreglo de barba', price: 35, duration: 45, description: 'Corte completo con perfilado de barba' },
      { name: 'Afeitado clásico',        price: 15,  duration: 20, description: 'Afeitado con navaja y toalla caliente' },
      { name: 'Degradado / Fade',        price: 25,  duration: 35, description: 'Degradado moderno con máquina' },
      { name: 'Arreglo de barba',        price: 15,  duration: 20, description: 'Perfilado y arreglo de barba' },
    ],
  },
  SPA: {
    termPlural: 'Sesiones', emoji: '🌿', staffLabel: 'Terapeuta', bookingLabel: 'sesión',
    templates: [
      { name: 'Masaje relajante',           price: 80,  duration: 60, description: 'Masaje corporal de relajación profunda' },
      { name: 'Masaje de piedras calientes', price: 110, duration: 75, description: 'Terapia con piedras volcánicas calientes' },
      { name: 'Facial hidratante',           price: 65,  duration: 45, description: 'Tratamiento facial con hidratación profunda' },
      { name: 'Aromaterapia',               price: 70,  duration: 60, description: 'Relajación con aceites esenciales' },
      { name: 'Reflexología',               price: 60,  duration: 45, description: 'Masaje terapéutico en pies y manos' },
    ],
  },
  SALON_BELLEZA: {
    termPlural: 'Citas', emoji: '💅', staffLabel: 'Estilista', bookingLabel: 'cita',
    templates: [
      { name: 'Corte de dama',      price: 35, duration: 45, description: 'Corte y peinado para dama' },
      { name: 'Tinte completo',     price: 90, duration: 90, description: 'Coloración completa con productos profesionales' },
      { name: 'Manicure',           price: 25, duration: 30, description: 'Limpieza y esmaltado de uñas de manos' },
      { name: 'Pedicure',           price: 30, duration: 40, description: 'Limpieza y esmaltado de uñas de pies' },
      { name: 'Tratamiento capilar',price: 50, duration: 45, description: 'Hidratación y nutrición del cabello' },
    ],
  },
  TIENDA_CELULARES: {
    termPlural: 'Servicios', emoji: '📱', staffLabel: 'Técnico', bookingLabel: 'servicio',
    templates: [
      { name: 'Cambio de pantalla',    price: 150, duration: 60, description: 'Reemplazo de pantalla original' },
      { name: 'Cambio de batería',     price: 60,  duration: 30, description: 'Reemplazo de batería original' },
      { name: 'Limpieza interna',      price: 40,  duration: 30, description: 'Limpieza de placa y componentes' },
      { name: 'Reparación de carga',   price: 50,  duration: 30, description: 'Reparación del puerto de carga' },
      { name: 'Formateo / Restauración', price: 35, duration: 45, description: 'Restauración de fábrica del equipo' },
    ],
  },
  REPOSTERIA: {
    termPlural: 'Pedidos', emoji: '🎂', staffLabel: 'Repostero', bookingLabel: 'pedido',
    templates: [
      { name: 'Torta personalizada',    price: 120, duration: 60, description: 'Torta decorada según diseño del cliente (pedido con 3 días de anticipación)' },
      { name: 'Torta de cumpleaños',    price: 80,  duration: 60, description: 'Torta clásica de cumpleaños con decoración estándar' },
      { name: 'Cupcakes (docena)',       price: 45,  duration: 30, description: '12 cupcakes decorados a elección' },
      { name: 'Galletas decoradas',     price: 35,  duration: 30, description: 'Caja de galletas decoradas con glaseado' },
      { name: 'Macarons (caja x12)',    price: 55,  duration: 30, description: '12 macarons surtidos de distintos sabores' },
    ],
  },
  VETERINARIA: {
    termPlural: 'Citas', emoji: '🐾', staffLabel: 'Veterinario', bookingLabel: 'cita',
    templates: [
      { name: 'Consulta general',       price: 50,  duration: 30, description: 'Evaluación general del estado de salud de tu mascota' },
      { name: 'Vacunación',             price: 35,  duration: 15, description: 'Aplicación de vacunas según calendario' },
      { name: 'Desparasitación',        price: 25,  duration: 15, description: 'Tratamiento antiparasitario interno y externo' },
      { name: 'Grooming / Baño',        price: 45,  duration: 60, description: 'Baño, corte de pelo y arreglo completo' },
      { name: 'Control post-operatorio',price: 40,  duration: 20, description: 'Revisión de evolución tras una cirugía' },
    ],
  },
  ODONTOLOGIA: {
    termPlural: 'Citas', emoji: '🦷', staffLabel: 'Odontólogo', bookingLabel: 'cita',
    templates: [
      { name: 'Consulta y diagnóstico',    price: 60,  duration: 30, description: 'Evaluación bucal completa y diagnóstico' },
      { name: 'Limpieza dental',           price: 80,  duration: 45, description: 'Profilaxis dental y eliminación de sarro' },
      { name: 'Blanqueamiento dental',     price: 250, duration: 60, description: 'Blanqueamiento con láser o gel profesional' },
      { name: 'Extracción simple',         price: 120, duration: 30, description: 'Extracción de pieza dental con anestesia local' },
      { name: 'Sellantes / Resina',        price: 150, duration: 45, description: 'Restauración con resina del color del diente' },
    ],
  },
  GIMNASIO: {
    termPlural: 'Clases', emoji: '🏋️', staffLabel: 'Entrenador', bookingLabel: 'clase',
    templates: [
      { name: 'Clase de Yoga',             price: 35, duration: 60, description: 'Sesión de yoga para todos los niveles' },
      { name: 'Clase de Pilates',          price: 40, duration: 60, description: 'Pilates en colchoneta o máquinas (reformer)' },
      { name: 'Entrenamiento personal',    price: 80, duration: 60, description: 'Sesión 1 a 1 con entrenador certificado' },
      { name: 'Clase de Spinning',         price: 30, duration: 45, description: 'Clase de ciclismo indoor de alta intensidad' },
      { name: 'Clase de Crossfit',         price: 45, duration: 60, description: 'Entrenamiento funcional de alta intensidad' },
    ],
  },
  TATUAJES: {
    termPlural: 'Citas', emoji: '🎨', staffLabel: 'Tatuador', bookingLabel: 'cita',
    templates: [
      { name: 'Tatuaje pequeño (hasta 5cm)', price: 150, duration: 60,  description: 'Diseño pequeño en zona sencilla' },
      { name: 'Tatuaje mediano (5–15cm)',    price: 300, duration: 120, description: 'Diseño mediano con detalle moderado' },
      { name: 'Tatuaje grande (15cm+)',      price: 600, duration: 240, description: 'Pieza grande o elaborada con diseño complejo' },
      { name: 'Piercing',                   price: 60,  duration: 15,  description: 'Piercing profesional con joya de titanio incluida' },
      { name: 'Retoque de tatuaje',         price: 80,  duration: 45,  description: 'Refresco de color y líneas de tatuaje existente' },
    ],
  },
  PSICOLOGO: {
    termPlural: 'Sesiones', emoji: '🧠', staffLabel: 'Psicólogo', bookingLabel: 'sesión',
    templates: [
      { name: 'Consulta inicial',       price: 80,  duration: 50, description: 'Primera sesión de evaluación y diagnóstico' },
      { name: 'Sesión individual',      price: 100, duration: 50, description: 'Sesión de psicoterapia individual' },
      { name: 'Terapia de pareja',      price: 150, duration: 60, description: 'Sesión terapéutica para parejas' },
      { name: 'Terapia familiar',       price: 180, duration: 60, description: 'Sesión con participación de la familia' },
      { name: 'Sesión online',          price: 80,  duration: 50, description: 'Sesión por videollamada (Zoom / Meet)' },
    ],
  },
  NUTRICIONISTA: {
    termPlural: 'Consultas', emoji: '🥗', staffLabel: 'Nutricionista', bookingLabel: 'consulta',
    templates: [
      { name: 'Consulta inicial',       price: 80,  duration: 60, description: 'Evaluación nutricional completa y plan base' },
      { name: 'Control y seguimiento',  price: 60,  duration: 30, description: 'Seguimiento de progreso y ajuste de plan' },
      { name: 'Plan de alimentación',   price: 120, duration: 60, description: 'Elaboración de plan alimenticio personalizado' },
      { name: 'Nutrición deportiva',    price: 100, duration: 60, description: 'Plan específico para rendimiento deportivo' },
      { name: 'Consulta online',        price: 70,  duration: 45, description: 'Consulta por videollamada con plan digital' },
    ],
  },
  PELUQUERIA_CANINA: {
    termPlural: 'Citas', emoji: '🐕', staffLabel: 'Groomer', bookingLabel: 'cita',
    templates: [
      { name: 'Baño y secado (pequeño)', price: 35, duration: 60,  description: 'Baño, secado y perfumado para razas pequeñas' },
      { name: 'Baño y secado (mediano)', price: 50, duration: 75,  description: 'Baño, secado y perfumado para razas medianas' },
      { name: 'Corte de pelo',           price: 45, duration: 60,  description: 'Corte según raza o preferencia del dueño' },
      { name: 'Baño + corte completo',   price: 80, duration: 90,  description: 'Baño, corte, secado, perfumado y arreglo de uñas' },
      { name: 'Corte de uñas',           price: 20, duration: 15,  description: 'Corte y limado de uñas' },
    ],
  },
  FISIOTERAPIA: {
    termPlural: 'Sesiones', emoji: '🦺', staffLabel: 'Fisioterapeuta', bookingLabel: 'sesión',
    templates: [
      { name: 'Evaluación inicial',         price: 80,  duration: 60, description: 'Evaluación postural y diagnóstico fisioterapéutico' },
      { name: 'Sesión de rehabilitación',   price: 70,  duration: 45, description: 'Rehabilitación de lesiones musculares y articulares' },
      { name: 'Terapia manual',             price: 80,  duration: 45, description: 'Técnicas manuales para alivio del dolor y movilidad' },
      { name: 'Masaje terapéutico',         price: 60,  duration: 45, description: 'Masaje enfocado en zonas de tensión y contracturas' },
      { name: 'Electroterapia',             price: 50,  duration: 30, description: 'Tratamiento con corrientes eléctricas terapéuticas' },
    ],
  },
  MICROPIGMENTACION: {
    termPlural: 'Citas', emoji: '🖌️', staffLabel: 'Microartista', bookingLabel: 'cita',
    templates: [
      { name: 'Micropigmentación de cejas', price: 350, duration: 120, description: 'Técnica pelo a pelo o sombreado para cejas perfectas' },
      { name: 'Retoque de cejas',           price: 150, duration: 90,  description: 'Retoque a los 30-45 días del procedimiento inicial' },
      { name: 'Micropigmentación de labios',price: 400, duration: 150, description: 'Perfilado y relleno de labios con pigmento semipermanente' },
      { name: 'Delineado permanente',       price: 300, duration: 120, description: 'Delineado superior e inferior de ojos' },
      { name: 'Consulta y diseño',          price: 50,  duration: 30,  description: 'Consulta previa, diseño y prueba de color' },
    ],
  },
  CLASES_PARTICULARES: {
    termPlural: 'Clases', emoji: '📚', staffLabel: 'Tutor', bookingLabel: 'clase',
    templates: [
      { name: 'Clase de matemáticas',       price: 40, duration: 60, description: 'Refuerzo y clases de matemáticas escolar o preuniversitaria' },
      { name: 'Clase de inglés',            price: 45, duration: 60, description: 'Inglés conversacional, gramática y preparación de exámenes' },
      { name: 'Refuerzo escolar general',   price: 35, duration: 60, description: 'Apoyo en todas las materias para nivel escolar' },
      { name: 'Clase de física / química',  price: 45, duration: 60, description: 'Clases de física y química escolar o preuniversitaria' },
      { name: 'Clase universitaria',        price: 60, duration: 60, description: 'Tutoría especializada para cursos universitarios' },
    ],
  },
  LIMPIEZA_HOGAR: {
    termPlural: 'Servicios', emoji: '🧹', staffLabel: 'Limpiador', bookingLabel: 'servicio',
    templates: [
      { name: 'Limpieza estándar (2h)',      price: 60,  duration: 120, description: 'Limpieza general de ambientes, baños y cocina' },
      { name: 'Limpieza profunda (4h)',      price: 120, duration: 240, description: 'Limpieza detallada de toda la vivienda' },
      { name: 'Limpieza post-mudanza',       price: 180, duration: 300, description: 'Limpieza a fondo tras mudanza o remodelación' },
      { name: 'Limpieza de oficina',         price: 80,  duration: 120, description: 'Limpieza de espacios de trabajo y oficinas' },
      { name: 'Limpieza post-construcción',  price: 200, duration: 300, description: 'Remoción de polvo y residuos de obra' },
    ],
  },
  MAQUILLAJE: {
    termPlural: 'Citas', emoji: '💄', staffLabel: 'Maquillista', bookingLabel: 'cita',
    templates: [
      { name: 'Maquillaje de novia',        price: 250, duration: 120, description: 'Maquillaje nupcial de larga duración con fijador' },
      { name: 'Maquillaje de evento',       price: 120, duration: 60,  description: 'Maquillaje para fiestas, cenas y eventos sociales' },
      { name: 'Maquillaje de graduación',   price: 150, duration: 75,  description: 'Look elegante para ceremonia de graduación' },
      { name: 'Maquillaje artístico',       price: 180, duration: 90,  description: 'Maquillaje creativo para sesiones fotográficas o teatral' },
      { name: 'Maquillaje natural (day look)',price: 80, duration: 45,  description: 'Look natural y fresco para el día a día' },
    ],
  },
  DJ: {
    termPlural: 'Eventos', emoji: '🎧', staffLabel: 'DJ', bookingLabel: 'evento',
    templates: [
      { name: 'DJ para fiesta (4h)',          price: 400, duration: 240, description: 'DJ con equipo de sonido para fiestas privadas' },
      { name: 'DJ para boda (8h)',             price: 800, duration: 480, description: 'DJ completo para ceremonia y recepción de boda' },
      { name: 'DJ para quinceañero',           price: 500, duration: 300, description: 'DJ con luces y efectos para quinceañero' },
      { name: 'DJ para evento corporativo',    price: 600, duration: 300, description: 'DJ profesional para eventos de empresa' },
      { name: 'Servicio de animación',         price: 350, duration: 240, description: 'Animación con juegos, dinámicas y música' },
    ],
  },
  DECORACION_EVENTOS: {
    termPlural: 'Eventos', emoji: '🎊', staffLabel: 'Decorador', bookingLabel: 'evento',
    templates: [
      { name: 'Decoración de cumpleaños',      price: 200, duration: 120, description: 'Globos, banner y decoración temática' },
      { name: 'Decoración de boda',            price: 800, duration: 300, description: 'Ambientación completa con flores y telas' },
      { name: 'Decoración de quinceañero',     price: 600, duration: 240, description: 'Decoración temática completa para quinceañero' },
      { name: 'Arco de globos',                price: 150, duration: 60,  description: 'Arco de globos de látex o burbuja personalizado' },
      { name: 'Ambientación corporativa',      price: 400, duration: 180, description: 'Decoración para eventos y reuniones de empresa' },
    ],
  },
  CATERING: {
    termPlural: 'Pedidos', emoji: '🍽️', staffLabel: 'Chef', bookingLabel: 'pedido',
    templates: [
      { name: 'Cena romántica para 2',         price: 180, duration: 120, description: 'Chef a domicilio con menú de 3 tiempos para 2 personas' },
      { name: 'Brunch para 10 personas',       price: 350, duration: 180, description: 'Brunch completo con variedad de platos' },
      { name: 'Catering evento (20 pax)',       price: 800, duration: 240, description: 'Servicio de catering completo para 20 personas' },
      { name: 'Cocina semanal a domicilio',    price: 250, duration: 180, description: 'Preparación de comidas para la semana en tu hogar' },
      { name: 'Mesa de postres',               price: 200, duration: 120, description: 'Mesa dulce con postres surtidos para eventos' },
    ],
  },
  GASFITERIA: {
    termPlural: 'Servicios', emoji: '🔧', staffLabel: 'Gasfitero', bookingLabel: 'servicio',
    templates: [
      { name: 'Destape de desagüe',            price: 80,  duration: 60,  description: 'Destape de tuberías y desagüe obstruido' },
      { name: 'Instalación de grifo',          price: 60,  duration: 30,  description: 'Instalación o cambio de grifo de cocina o baño' },
      { name: 'Reparación de tubería',         price: 100, duration: 60,  description: 'Reparación de fugas y roturas en tuberías' },
      { name: 'Instalación de inodoro',        price: 120, duration: 90,  description: 'Instalación completa de inodoro nuevo' },
      { name: 'Revisión sistema de agua',      price: 80,  duration: 60,  description: 'Diagnóstico general del sistema de agua y desagüe' },
    ],
  },
  CARPINTERIA: {
    termPlural: 'Servicios', emoji: '🪚', staffLabel: 'Carpintero', bookingLabel: 'servicio',
    templates: [
      { name: 'Visita técnica y cotización',   price: 50,  duration: 60,  description: 'Visita para evaluar trabajo y dar presupuesto' },
      { name: 'Reparación de mueble',          price: 80,  duration: 60,  description: 'Reparación de bisagras, cajones y estructura' },
      { name: 'Instalación de puerta',         price: 120, duration: 90,  description: 'Instalación y ajuste de puerta de madera' },
      { name: 'Instalación de cocina',         price: 300, duration: 180, description: 'Instalación de muebles de cocina a medida' },
      { name: 'Reparación de piso de madera',  price: 150, duration: 120, description: 'Reparación y barnizado de pisos de madera' },
    ],
  },
  JARDINERIA: {
    termPlural: 'Servicios', emoji: '🌱', staffLabel: 'Jardinero', bookingLabel: 'servicio',
    templates: [
      { name: 'Mantenimiento básico',          price: 80,  duration: 120, description: 'Corte de césped, riego y limpieza general' },
      { name: 'Poda de árboles y arbustos',    price: 120, duration: 120, description: 'Poda técnica para salud y estética de la planta' },
      { name: 'Diseño de jardín',              price: 200, duration: 180, description: 'Diseño y ejecución de jardín desde cero' },
      { name: 'Siembra y trasplante',          price: 60,  duration: 60,  description: 'Siembra de plantas nuevas o trasplante de macetas' },
      { name: 'Fumigación de jardín',          price: 100, duration: 60,  description: 'Control de plagas y enfermedades en plantas' },
    ],
  },
  ELECTRICIDAD: {
    termPlural: 'Servicios', emoji: '⚡', staffLabel: 'Electricista', bookingLabel: 'servicio',
    templates: [
      { name: 'Instalación de tomacorriente',  price: 60,  duration: 30,  description: 'Instalación o cambio de tomacorriente' },
      { name: 'Instalación de luminaria',      price: 50,  duration: 30,  description: 'Instalación de lámpara, foco o luz LED' },
      { name: 'Revisión eléctrica general',    price: 100, duration: 60,  description: 'Diagnóstico del sistema eléctrico del hogar' },
      { name: 'Instalación de tablero',        price: 200, duration: 120, description: 'Instalación o cambio de tablero eléctrico' },
      { name: 'Reparación de cortocircuito',   price: 80,  duration: 60,  description: 'Diagnóstico y reparación de fallas eléctricas' },
    ],
  },
  DEPILACION: {
    termPlural: 'Citas', emoji: '🪒', staffLabel: 'Esteticista', bookingLabel: 'cita',
    templates: [
      { name: 'Depilación piernas completas',  price: 50,  duration: 45,  description: 'Depilación con cera de piernas completas' },
      { name: 'Depilación de axilas',          price: 20,  duration: 15,  description: 'Depilación de axilas con cera' },
      { name: 'Depilación de bikini',          price: 35,  duration: 20,  description: 'Depilación de zona bikini con cera' },
      { name: 'Depilación facial',             price: 25,  duration: 20,  description: 'Depilación de bozo, mentón o cejas con hilo/cera' },
      { name: 'Depilación láser (zona)',       price: 150, duration: 30,  description: 'Sesión de depilación láser por zona' },
    ],
  },
  MASAJES_DOMICILIO: {
    termPlural: 'Sesiones', emoji: '💆', staffLabel: 'Masajista', bookingLabel: 'sesión',
    templates: [
      { name: 'Masaje relajante (60 min)',      price: 80,  duration: 60,  description: 'Masaje relajante corporal en tu domicilio' },
      { name: 'Masaje relajante (90 min)',      price: 110, duration: 90,  description: 'Masaje relajante extendido con técnicas suecas' },
      { name: 'Masaje de piedras calientes',    price: 120, duration: 75,  description: 'Terapia con piedras volcánicas calientes a domicilio' },
      { name: 'Masaje descontracturante',       price: 90,  duration: 60,  description: 'Masaje profundo para contracturas y tensión muscular' },
      { name: 'Masaje para parejas',            price: 180, duration: 60,  description: 'Sesión simultánea para dos personas a domicilio' },
    ],
  },
  NAIL_ART: {
    termPlural: 'Citas', emoji: '💅', staffLabel: 'Nail Artist', bookingLabel: 'cita',
    templates: [
      { name: 'Uñas acrílicas',                price: 70,  duration: 90,  description: 'Uñas acrílicas con diseño a elección' },
      { name: 'Uñas en gel',                   price: 60,  duration: 75,  description: 'Uñas en gel de larga duración' },
      { name: 'Nail art (diseño)',              price: 80,  duration: 90,  description: 'Diseño artístico personalizado en uñas naturales o acrílicas' },
      { name: 'Retiro de acrílicas',           price: 30,  duration: 30,  description: 'Retiro seguro de uñas acrílicas o gel' },
      { name: 'Esmaltado permanente',          price: 45,  duration: 45,  description: 'Manicure con esmalte permanente de larga duración' },
    ],
  },
  FLORES: {
    termPlural: 'Pedidos', emoji: '🌸', staffLabel: 'Florista', bookingLabel: 'pedido',
    templates: [
      { name: 'Ramo de rosas',                 price: 49.90, duration: null, description: 'Ramo de 12 rosas naturales con decoración y lazo' },
      { name: 'Arreglo floral para eventos',   price: 89.90, duration: null, description: 'Arreglo floral grande para bodas, cumpleaños o eventos especiales' },
      { name: 'Bouquet de novia',              price: 149.90,duration: null, description: 'Bouquet personalizado para matrimonio con flores de temporada' },
      { name: 'Caja de flores preservadas',   price: 99.90, duration: null, description: 'Caja elegante con flores preservadas que duran meses' },
      { name: 'Corona fúnebre',               price: 69.90, duration: null, description: 'Corona fúnebre con flores naturales y dedicatoria' },
    ],
  },
  TEJIDOS_CROCHET: {
    termPlural: 'Pedidos', emoji: '🧶', staffLabel: 'Artesana', bookingLabel: 'pedido',
    templates: [
      { name: 'Bolso tejido a crochet',        price: 59.90, duration: null, description: 'Bolso artesanal tejido a crochet con diseño personalizado' },
      { name: 'Manta personalizada',           price: 89.90, duration: null, description: 'Manta suave tejida a crochet con colores y tamaño a pedido' },
      { name: 'Amigurumi / muñeco tejido',     price: 39.90, duration: null, description: 'Muñeco o figura personalizada tejida a crochet' },
      { name: 'Ropa de bebé tejida',           price: 49.90, duration: null, description: 'Set de ropa tejida para bebé: gorro, escarpines y ajuar' },
      { name: 'Accesorios (gorro / bufanda)',  price: 29.90, duration: null, description: 'Gorro, bufanda o accesorios tejidos a crochet a pedido' },
    ],
  },
  OTRO: {
    termPlural: 'Reservas', emoji: '🏪', staffLabel: 'Profesional', bookingLabel: 'reserva',
    templates: [],
  },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const UPLOADS_BASE = API_BASE.replace('/api', '');
const resolveUrl = (path?: string | null) => {
  if (!path) return '';
  return path.startsWith('http') ? path : `${UPLOADS_BASE}${path}`;
};

interface ParsedOrder {
  isOrder: boolean;
  items: string;
  total: string;
  deliveryDate: string;
  address: string;
  extraNotes: string;
}
function buildContactMailto(booking: { client: { name: string; email: string }; totalAmount: number }, order: ParsedOrder, bizName: string): string {
  const subject = encodeURIComponent(`Re: Tu pedido en ${bizName}`);
  const body = encodeURIComponent(
    `Hola ${booking.client.name},\n\nTe escribimos sobre tu pedido:\n\n` +
    `Productos: ${order.items}\n` +
    `Total: S/ ${Number(booking.totalAmount).toLocaleString('es-PE', { minimumFractionDigits: 2 })}\n` +
    (order.address ? `Dirección: ${order.address}\n` : '') +
    (order.deliveryDate && order.deliveryDate !== 'A coordinar' ? `Fecha de entrega: ${order.deliveryDate}\n` : '') +
    `\nSaludos,\n${bizName}`
  );
  return `mailto:${booking.client.email}?subject=${subject}&body=${body}`;
}

function parseOrderNotes(notes?: string): ParsedOrder {
  if (notes?.startsWith('[PEDIDO]')) {
    const body = notes.slice('[PEDIDO] '.length);
    const parts = body.split(' | ');
    const items = parts[0] ?? '';
    const total = (parts.find(p => p.startsWith('Total:')) ?? '').slice('Total: '.length);
    const deliveryDate = (parts.find(p => p.startsWith('Entrega:')) ?? '').slice('Entrega: '.length);
    const address = (parts.find(p => p.startsWith('Dirección:')) ?? '').slice('Dirección: '.length);
    const extraNotes = (parts.find(p => p.startsWith('Notas:')) ?? '').slice('Notas: '.length);
    return { isOrder: true, items, total, deliveryDate, address, extraNotes };
  }
  if (notes?.startsWith('[MULTI-SERVICIO]')) {
    const body = notes.slice('[MULTI-SERVICIO] '.length);
    const parts = body.split(' | ');
    const items = parts[0] ?? '';
    const total = (parts.find(p => p.startsWith('Total:')) ?? '').slice('Total: '.length);
    const extraNotes = (parts.find(p => p.startsWith('Notas:')) ?? '').slice('Notas: '.length);
    return { isOrder: true, items, total, deliveryDate: '', address: '', extraNotes };
  }
  return { isOrder: false, items: '', total: '', deliveryDate: '', address: '', extraNotes: notes || '' };
}

export default function DashboardPage() {
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>('Reservas');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBizId, setSelectedBizId] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [bizLoadError, setBizLoadError] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);

  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [savingService, setSavingService] = useState(false);
  const [serviceError, setServiceError] = useState('');
  const [deletingService, setDeletingService] = useState<string | null>(null);

  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState<number | null>(null);

  const [editingBiz, setEditingBiz] = useState<Business | null>(null);
  const [editForm, setEditForm] = useState({ name: '', category: '', city: '', address: '', phone: '', email: '', description: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Horarios
  const [hours, setHours] = useState<BusinessHour[]>(DEFAULT_HOURS);
  const [hoursLoading, setHoursLoading] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [hoursSaved, setHoursSaved] = useState(false);

  // Fotos
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [confirmDeleteService, setConfirmDeleteService] = useState<string | null>(null);
  const [confirmDeletePhoto, setConfirmDeletePhoto] = useState<string | null>(null);

  // Marcar pagado
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  // Ingresos
  const [earnings, setEarnings] = useState<{ summary: EarningsSummary; transactions: EarningsTx[] } | null>(null);
  const [earningsPeriod, setEarningsPeriod] = useState<EarningsPeriod>('month');
  const [earningsLoading, setEarningsLoading] = useState(false);

  // Analíticas
  const [analyticsData, setAnalyticsData] = useState<BusinessAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const loadAnalytics = useCallback((bizId: string) => {
    setAnalyticsLoading(true);
    api.get(`/businesses/${bizId}/analytics`)
      .then(res => setAnalyticsData(res.data.analytics))
      .catch(() => setAnalyticsData(null))
      .finally(() => setAnalyticsLoading(false));
  }, []);

  // Agenda / bloqueo de disponibilidad
  const [availBlocks, setAvailBlocks] = useState<AvailabilityBlock[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [newBlock, setNewBlock] = useState({ startDate: '', endDate: '', reason: '' });
  const [savingBlock, setSavingBlock] = useState(false);
  const [deletingBlock, setDeletingBlock] = useState<string | null>(null);

  // Perfil PRO
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [profileForm, setProfileForm] = useState({ slogan: '', description: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Avatar
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Onboarding dismissal
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  // 2FA
  const [twoFAStatus, setTwoFAStatus] = useState<{ twoFactorEnabled: boolean; backupCodesRemaining: number } | null>(null);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFASetup, setTwoFASetup] = useState<{ secret: string; qrCode: string; backupCodes: string[] } | null>(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFADisablePassword, setTwoFADisablePassword] = useState('');
  const [twoFAStep, setTwoFAStep] = useState<'idle' | 'setup' | 'confirm' | 'disable'>('idle');

  const toast = useToast();

  const loadBookings = useCallback((bizId: string) => {
    setBookingsLoading(true);
    Promise.all([
      api.get(`/bookings/business/${bizId}`),
      api.get(`/bookings/business/${bizId}/earnings?period=all`),
    ])
      .then(([bookRes, earnRes]) => {
        setBookings(bookRes.data.bookings || []);
        setEarnings(earnRes.data);
      })
      .catch(() => { setBookings([]); })
      .finally(() => setBookingsLoading(false));
  }, []);

  const loadServices = useCallback((bizId: string) => {
    setServicesLoading(true);
    api.get(`/services/business/${bizId}`)
      .then(res => setServices(res.data.services || []))
      .catch(() => setServices([]))
      .finally(() => setServicesLoading(false));
  }, []);

  const loadHours = useCallback((bizId: string) => {
    setHoursLoading(true);
    api.get(`/businesses/${bizId}/hours`)
      .then(res => {
        const loaded: BusinessHour[] = res.data.hours ?? [];
        // Merge con defaults: si existe el día usa el cargado, sino el default
        setHours(DEFAULT_HOURS.map(d => {
          const found = loaded.find(h => h.dayOfWeek === d.dayOfWeek);
          return found ? { dayOfWeek: found.dayOfWeek, openTime: found.openTime, closeTime: found.closeTime, isClosed: found.isClosed } : d;
        }));
      })
      .catch(() => setHours(DEFAULT_HOURS))
      .finally(() => setHoursLoading(false));
  }, []);

  const loadPhotos = useCallback((bizId: string) => {
    setPhotosLoading(true);
    api.get(`/businesses/${bizId}/photos`)
      .then(res => setPhotos(res.data.photos ?? []))
      .catch(() => setPhotos([]))
      .finally(() => setPhotosLoading(false));
  }, []);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!authLoading && user?.role === 'CLIENT') { router.push('/'); return; }
    if (user) {
      Promise.all([
        api.get('/businesses/my'),
        api.get('/subscriptions/my').catch(() => ({ data: { subscription: null } })),
        api.get('/auth/2fa/status').catch(() => null),
      ]).then(([bizRes, subRes, twoFARes]) => {
        const list: Business[] = bizRes.data.businesses || [];
        setBusinesses(list);
        setSubscription(subRes.data.subscription);
        setDaysUntilExpiry(subRes.data.daysUntilExpiry ?? null);
        if (list.length > 0) setSelectedBizId(list[0].id);
        if (twoFARes) setTwoFAStatus(twoFARes.data);
      }).catch(() => { setBizLoadError(true); })
      .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!selectedBizId) return;
    loadBookings(selectedBizId);
    loadServices(selectedBizId);
    loadHours(selectedBizId);
    loadPhotos(selectedBizId);
    const biz = businesses.find(b => b.id === selectedBizId);
    if (biz) {
      setProfileForm({ slogan: biz.slogan ?? '', description: biz.description ?? '' });
      setCoverPreview(biz.coverImage ? resolveUrl(biz.coverImage) : null);
    }
  }, [selectedBizId, loadBookings, loadServices, loadHours, loadPhotos, businesses]);

  // Auto-refresco cada 30 segundos para mostrar nuevos pedidos sin recargar la página
  useEffect(() => {
    if (!selectedBizId) return;
    const interval = setInterval(() => loadBookings(selectedBizId), 30_000);
    return () => clearInterval(interval);
  }, [selectedBizId, loadBookings]);

  const handleStatusChange = async (bookingId: string, status: string) => {
    setUpdatingBooking(bookingId);
    try {
      await api.put(`/bookings/${bookingId}/status`, { status });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
    } catch (err: any) {
      toast.show(err.response?.data?.error || 'Error al actualizar reserva', 'error');
    } finally {
      setUpdatingBooking(null);
    }
  };

  const handleAddService = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!selectedBizId) return;
    setSavingService(true); setServiceError('');
    try {
      const res = await api.post('/services', {
        businessId: selectedBizId,
        name: serviceForm.name,
        description: serviceForm.description || undefined,
        price: parseFloat(serviceForm.price),
        duration: serviceForm.duration ? parseInt(serviceForm.duration) : undefined,
        category: serviceForm.category,
      });
      setServices(prev => [...prev, res.data.service]);
      setServiceForm(emptyServiceForm);
      setShowServiceForm(false);
    } catch (err: any) {
      setServiceError(err.response?.data?.error || 'Error al crear servicio');
    } finally {
      setSavingService(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (confirmDeleteService !== serviceId) { setConfirmDeleteService(serviceId); return; }
    setConfirmDeleteService(null);
    setDeletingService(serviceId);
    try {
      await api.delete(`/services/${serviceId}`);
      setServices(prev => prev.filter(s => s.id !== serviceId));
      toast.show('Servicio eliminado', 'success');
    } catch (err: any) {
      toast.show(err.response?.data?.error || 'Error al eliminar servicio', 'error');
    } finally {
      setDeletingService(null);
    }
  };

  const openEditModal = (biz: Business) => {
    setEditingBiz(biz);
    setEditForm({ name: biz.name, category: biz.category, city: biz.city, address: biz.address ?? '', phone: biz.phone ?? '', email: biz.email ?? '', description: biz.description ?? '' });
    setEditError('');
  };

  const handleEditBusiness = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!editingBiz) return;
    setSavingEdit(true); setEditError('');
    try {
      const res = await api.put(`/businesses/${editingBiz.id}`, editForm);
      setBusinesses(prev => prev.map(b => b.id === editingBiz.id ? { ...b, ...res.data.business } : b));
      setEditingBiz(null);
    } catch (err: any) {
      setEditError(err.response?.data?.error || 'Error al guardar los cambios');
    } finally {
      setSavingEdit(false);
    }
  };

  const updateHour = (dayIndex: number, field: keyof BusinessHour, value: string | boolean) => {
    setHours(prev => prev.map(h => h.dayOfWeek === dayIndex ? { ...h, [field]: value } : h));
    setHoursSaved(false);
  };

  const handleSaveHours = async () => {
    if (!selectedBizId) return;
    setSavingHours(true);
    try {
      await api.put(`/businesses/${selectedBizId}/hours`, hours);
      setHoursSaved(true);
      setTimeout(() => setHoursSaved(false), 3000);
    } catch {
      toast.show('Error al guardar horarios', 'error');
    } finally {
      setSavingHours(false);
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBizId) return;
    setUploadingPhoto(true); setPhotoError('');
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const res = await api.post(`/businesses/${selectedBizId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhotos(prev => [...prev, res.data.photo]);
    } catch (err: any) {
      setPhotoError(err.response?.data?.error || 'Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (confirmDeletePhoto !== photoId) { setConfirmDeletePhoto(photoId); return; }
    setConfirmDeletePhoto(null);
    setDeletingPhoto(photoId);
    try {
      await api.delete(`/businesses/${selectedBizId}/photos/${photoId}`);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      toast.show('Foto eliminada', 'success');
    } catch {
      toast.show('Error al eliminar la foto', 'error');
    } finally {
      setDeletingPhoto(null);
    }
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBizId) return;
    setUploadingCover(true);
    const formData = new FormData();
    formData.append('cover', file);
    try {
      const res = await api.post(`/businesses/${selectedBizId}/cover`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = resolveUrl(res.data.coverImage);
      setCoverPreview(url);
      setBusinesses(prev => prev.map(b => b.id === selectedBizId ? { ...b, coverImage: res.data.coverImage } : b));
      toast.show('Foto de portada actualizada', 'success');
    } catch {
      toast.show('Error al subir la foto de portada', 'error');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleMarkPaid = async (bookingId: string) => {
    setMarkingPaid(bookingId);
    try {
      await api.post(`/bookings/${bookingId}/mark-paid`);
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'COMPLETED' } : b));
      toast.show('Marcado como pagado en efectivo', 'success');
    } catch (err: any) {
      toast.show(err.response?.data?.error || 'Error al marcar como pagado', 'error');
    } finally {
      setMarkingPaid(null);
    }
  };

  const loadEarnings = useCallback((bizId: string, period: EarningsPeriod) => {
    setEarningsLoading(true);
    api.get(`/bookings/business/${bizId}/earnings?period=${period}`)
      .then(res => setEarnings(res.data))
      .catch(() => setEarnings(null))
      .finally(() => setEarningsLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'Ingresos' && selectedBizId) loadEarnings(selectedBizId, earningsPeriod);
  }, [tab, selectedBizId, earningsPeriod, loadEarnings]);

  useEffect(() => {
    if (tab === 'Analíticas' && selectedBizId) loadAnalytics(selectedBizId);
  }, [tab, selectedBizId, loadAnalytics]);

  const loadAvailBlocks = useCallback((bizId: string) => {
    setAvailLoading(true);
    api.get(`/businesses/${bizId}/availability`)
      .then(res => setAvailBlocks(res.data.blocks ?? []))
      .catch(() => setAvailBlocks([]))
      .finally(() => setAvailLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'Agenda' && selectedBizId) loadAvailBlocks(selectedBizId);
  }, [tab, selectedBizId, loadAvailBlocks]);

  const handleAddBlock = async () => {
    if (!selectedBizId || !newBlock.startDate || !newBlock.endDate) return;
    setSavingBlock(true);
    try {
      await api.post(`/businesses/${selectedBizId}/availability`, newBlock);
      setNewBlock({ startDate: '', endDate: '', reason: '' });
      loadAvailBlocks(selectedBizId);
      toast.show('Fecha bloqueada correctamente', 'success');
    } catch (err: any) {
      toast.show(err.response?.data?.error || 'Error al bloquear fecha', 'error');
    } finally {
      setSavingBlock(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!selectedBizId) return;
    setDeletingBlock(blockId);
    try {
      await api.delete(`/businesses/${selectedBizId}/availability/${blockId}`);
      setAvailBlocks(prev => prev.filter(b => b.id !== blockId));
      toast.show('Bloqueo eliminado', 'info');
    } catch {
      toast.show('Error al eliminar bloqueo', 'error');
    } finally {
      setDeletingBlock(null);
    }
  };

  const handle2FASetup = async () => {
    setTwoFALoading(true);
    try {
      const res = await api.post('/auth/2fa/setup');
      setTwoFASetup(res.data);
      setTwoFAStep('setup');
    } catch {
      toast.show('Error al iniciar configuración 2FA', 'error');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handle2FAEnable = async () => {
    if (!twoFASetup || !/^\d{6}$/.test(twoFACode)) return;
    setTwoFALoading(true);
    try {
      await api.post('/auth/2fa/enable', {
        secret: twoFASetup.secret,
        totp: twoFACode,
        backupCodes: twoFASetup.backupCodes,
      });
      setTwoFAStatus({ twoFactorEnabled: true, backupCodesRemaining: twoFASetup.backupCodes.length });
      setTwoFAStep('idle');
      setTwoFASetup(null);
      setTwoFACode('');
      toast.show('2FA habilitado correctamente', 'success');
    } catch (err: any) {
      toast.show(err.response?.data?.error || 'Código incorrecto', 'error');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handle2FADisable = async () => {
    if (!twoFADisablePassword) return;
    setTwoFALoading(true);
    try {
      await api.post('/auth/2fa/disable', { password: twoFADisablePassword });
      setTwoFAStatus({ twoFactorEnabled: false, backupCodesRemaining: 0 });
      setTwoFAStep('idle');
      setTwoFADisablePassword('');
      toast.show('2FA deshabilitado', 'info');
    } catch (err: any) {
      toast.show(err.response?.data?.error || 'Contraseña incorrecta', 'error');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!selectedBizId) return;
    setSavingProfile(true);
    try {
      await api.put(`/businesses/${selectedBizId}/profile`, profileForm);
      setBusinesses(prev => prev.map(b =>
        b.id === selectedBizId ? { ...b, ...profileForm } : b
      ));
      toast.show('Perfil actualizado correctamente', 'success');
    } catch {
      toast.show('Error al guardar el perfil', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      await api.post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshProfile();
      toast.show('Foto de perfil actualizada', 'success');
    } catch {
      toast.show('Error al subir foto de perfil', 'error');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const selectedBiz = businesses.find(b => b.id === selectedBizId);
  const isFreePlan = (subscription?.plan ?? 'FREE') === 'FREE';
  const isPremium  = (subscription?.plan ?? 'FREE') === 'PREMIUM';

  // Negocio "verificado" si tiene portada + descripción + al menos 1 foto de galería
  const isVerified = !!(selectedBiz?.coverImage && selectedBiz?.description && photos.length >= 1);
  const catConfig = CATEGORY_CONFIG[selectedBiz?.category ?? 'OTRO'] ?? CATEGORY_CONFIG.OTRO;
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
  const totalIncome = completedBookings.reduce((sum, b) => sum + Number(b.vendorAmount), 0);

  // Last 6 months bar chart data
  const monthlyChart = (() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-PE', { month: 'short' });
      const count = bookings.filter(b => b.date.startsWith(key)).length;
      const income = bookings.filter(b => b.date.startsWith(key) && b.status === 'COMPLETED')
        .reduce((s, b) => s + Number(b.vendorAmount), 0);
      return { label, count, income };
    });
  })();
  const maxCount = Math.max(...monthlyChart.map(m => m.count), 1);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Mi Dashboard</h1>
            <p className="text-indigo-200 text-sm mt-0.5">Bienvenido, {user?.name?.split(' ')[0]}</p>
            <Link
              href="/subscription"
              className="mt-2 inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-semibold px-3 py-1 rounded-full transition backdrop-blur"
            >
              {(subscription?.plan ?? 'FREE') === 'FREE'  && <Zap      className="w-3 h-3" />}
              {subscription?.plan === 'PRO'               && <Crown    className="w-3 h-3" />}
              {subscription?.plan === 'PREMIUM'           && <Sparkles className="w-3 h-3" />}
              Plan {subscription?.plan ?? 'FREE'}
              <span className="ml-1 text-white/60">· Cambiar</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {businesses.length === 0 && (
              <button
                onClick={() => router.push('/dashboard/new-business')}
                className="flex items-center gap-2 bg-white text-indigo-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-50 transition"
              >
                <Plus className="w-4 h-4" /> Crear negocio
              </button>
            )}
            {/* Avatar con upload */}
            <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUploadAvatar} />
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              title="Cambiar foto de perfil"
              aria-label="Cambiar foto de perfil"
              className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/40 hover:border-white transition group flex-shrink-0"
            >
              {uploadingAvatar ? (
                <div className="w-full h-full bg-white/20 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
              ) : user?.avatar ? (
                <img src={resolveUrl(user.avatar)} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <Camera className="w-3.5 h-3.5 text-white" />
              </div>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto w-full px-4 py-8 space-y-6">

        {bizLoadError ? (
          <div className="bg-white rounded-2xl border border-red-200 p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error al cargar tus negocios</h2>
            <p className="text-gray-500 text-sm mb-6">No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.</p>
            <button
              onClick={() => { setBizLoadError(false); setLoading(true); window.location.reload(); }}
              className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition"
            >
              Reintentar
            </button>
          </div>
        ) : businesses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Aún no tienes negocios</h2>
            <p className="text-gray-500 text-sm mb-6">Crea tu primer negocio para empezar a recibir reservas.</p>
            <button
              onClick={() => router.push('/dashboard/new-business')}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              <Plus className="w-5 h-5" />
              Crear mi primer negocio
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Store,      label: selectedBiz ? `${catConfig.emoji} ${CATEGORY_LABELS[selectedBiz.category] ?? 'Negocio'}` : 'Negocio', value: selectedBiz?.name ?? '—', color: 'bg-indigo-50 text-indigo-600' },
                { icon: Calendar,   label: catConfig.termPlural, value: bookings.length,              color: 'bg-blue-50 text-blue-600' },
                { icon: TrendingUp, label: 'Ingresos',     value: `S/ ${(earnings?.summary.totalRevenue ?? totalIncome).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, color: 'bg-green-50 text-green-600' },
                { icon: Star,       label: 'Rating',       value: selectedBiz?.averageRating ?? '—',  color: 'bg-yellow-50 text-yellow-600' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-sm text-gray-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Banner de verificación de email */}
            {user && !user.emailVerified && (
              <EmailVerificationBanner />
            )}

            {/* Banner de vencimiento de suscripción */}
            {daysUntilExpiry !== null && daysUntilExpiry <= 7 && subscription?.plan !== 'FREE' && (
              <div className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 border text-sm ${
                daysUntilExpiry <= 1
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : daysUntilExpiry <= 3
                  ? 'bg-orange-50 border-orange-200 text-orange-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {daysUntilExpiry <= 0
                      ? `Tu plan ${subscription?.plan} venció hoy. Tu cuenta pasará a FREE automáticamente.`
                      : daysUntilExpiry === 1
                      ? `¡Último aviso! Tu plan ${subscription?.plan} vence mañana.`
                      : `Tu plan ${subscription?.plan} vence en ${daysUntilExpiry} días. Renueva para mantener todos tus servicios activos.`
                    }
                  </span>
                </div>
                <a href="/subscription" className="whitespace-nowrap font-semibold underline underline-offset-2 hover:opacity-80 transition">
                  Renovar ahora
                </a>
              </div>
            )}

            {/* Onboarding checklist — solo mientras el perfil esté incompleto */}
            {!onboardingDismissed && selectedBiz && (services.length === 0 || !selectedBiz.coverImage) && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-indigo-900 text-sm mb-3">🚀 Primeros pasos — configura tu perfil</p>
                    <div className="space-y-2">
                      {[
                        { done: true,                         label: 'Crear tu negocio',            tab: null },
                        { done: services.length > 0,          label: 'Agregar al menos un servicio', tab: 'Servicios' as Tab },
                        { done: !!selectedBiz.coverImage,     label: 'Subir foto de portada',        tab: 'Perfil' as Tab },
                        { done: !!selectedBiz.description,    label: 'Añadir descripción del negocio', tab: 'Negocios' as Tab },
                      ].map(({ done, label, tab: targetTab }) => (
                        <div key={label} className="flex items-center gap-2.5">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-500' : 'bg-white border-2 border-indigo-300'}`}>
                            {done && <Check className="w-3 h-3 text-white" />}
                          </div>
                          {targetTab && !done ? (
                            <button onClick={() => setTab(targetTab)} className="text-sm text-indigo-700 font-medium hover:underline text-left">
                              {label}
                            </button>
                          ) : (
                            <span className={`text-sm ${done ? 'text-gray-400 line-through' : 'text-indigo-700 font-medium'}`}>{label}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setOnboardingDismissed(true)} className="text-indigo-400 hover:text-indigo-600 transition flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Business name indicator */}
            {selectedBiz && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {selectedBiz.name.charAt(0)}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{selectedBiz.name}</span>
                    {isVerified && (
                      <span title="Perfil completo">
                        <BadgeCheck className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      </span>
                    )}
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[selectedBiz.category] || selectedBiz.category}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/businesses/${selectedBiz.id}`}
                  target="_blank"
                  className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Eye className="w-4 h-4" /> Ver página pública
                </Link>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
                {(['Reservas', 'Ingresos', 'Analíticas', 'Agenda', 'Negocios', 'Servicios', 'Horarios', 'Fotos', 'Perfil'] as Tab[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium transition-colors ${
                      tab === t
                        ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    {t === 'Horarios' && <Clock3     className="w-3.5 h-3.5" />}
                    {t === 'Fotos'    && <Image     className="w-3.5 h-3.5" />}
                    {t === 'Perfil'   && <Pencil    className="w-3.5 h-3.5" />}
                    {t === 'Ingresos'   && <Banknote    className="w-3.5 h-3.5" />}
                    {t === 'Analíticas' && <BarChart2  className="w-3.5 h-3.5" />}
                    {t === 'Agenda'     && <CalendarOff className="w-3.5 h-3.5" />}
                    {t === 'Reservas' ? catConfig.termPlural : t}
                    {t === 'Reservas' && bookings.length > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                        {bookings.length}
                      </span>
                    )}
                    {t === 'Fotos' && photos.length > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                        {photos.length}/8
                      </span>
                    )}
                    {t === 'Perfil' && isFreePlan && <Lock className="w-3 h-3 text-gray-400" />}
                  </button>
                ))}
              </div>

              {/* ── TAB: RESERVAS ── */}
              {tab === 'Reservas' && (
                <div className="p-6">

                  {/* Monthly bar chart */}
                  {!bookingsLoading && bookings.length > 0 && (
                    <div className="mb-6 bg-gray-50 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <BarChart2 className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-semibold text-gray-700">Reservas últimos 6 meses</span>
                      </div>
                      <div className="flex items-end gap-2 h-28">
                        {monthlyChart.map(m => (
                          <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[10px] text-gray-500 font-medium">{m.count > 0 ? m.count : ''}</span>
                            <div className="w-full flex items-end" style={{ height: '72px' }}>
                              <div
                                className="w-full rounded-t-md bg-indigo-500 transition-all duration-500"
                                style={{ height: `${Math.max((m.count / maxCount) * 100, m.count > 0 ? 8 : 0)}%` }}
                                title={`S/ ${m.income.toLocaleString('es-PE')}`}
                              />
                            </div>
                            <span className="text-[10px] text-gray-400 capitalize">{m.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {bookingsLoading ? (
                    <div className="py-12 flex justify-center">
                      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="text-5xl mb-3">{catConfig.emoji}</div>
                      <p className="text-gray-700 font-semibold mb-1">Aún no hay {catConfig.termPlural.toLowerCase()}</p>
                      <p className="text-gray-400 text-sm">Cuando un cliente reserve, aparecerá aquí.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 border-b border-gray-100">
                            <th className="pb-3 font-medium">Cliente</th>
                            <th className="pb-3 font-medium">Servicio / Pedido</th>
                            <th className="pb-3 font-medium">Fecha</th>
                            <th className="pb-3 font-medium">Total</th>
                            <th className="pb-3 font-medium">Estado</th>
                            <th className="pb-3 font-medium">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {bookings.map(booking => {
                            const meta = STATUS_META[booking.status] || { label: booking.status, color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' };
                            const isUpdating = updatingBooking === booking.id;
                            const order = parseOrderNotes(booking.notes);
                            const isExpanded = expandedBooking === booking.id;
                            return (
                              <Fragment key={booking.id}>
                                <tr className="hover:bg-gray-50/50 transition-colors">
                                  <td className="py-3.5">
                                    <div className="font-medium text-gray-900">{booking.client.name}</div>
                                    <div className="text-xs text-gray-400">{booking.client.email}</div>
                                  </td>
                                  <td className="py-3.5">
                                    {order.isOrder ? (
                                      <div>
                                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full mb-1">
                                          📦 Pedido
                                        </span>
                                        <div className="text-gray-600 text-xs leading-snug line-clamp-1">{order.items}</div>
                                        <button
                                          onClick={() => setExpandedBooking(isExpanded ? null : booking.id)}
                                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-0.5 flex items-center gap-0.5"
                                        >
                                          {isExpanded ? '▲ Ocultar detalle' : '▼ Ver detalle del pedido'}
                                        </button>
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="text-gray-600">{booking.service.name}</div>
                                        {booking.notes && (
                                          <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{booking.notes}</div>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3.5 text-gray-600">
                                    {new Date(booking.date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </td>
                                  <td className="py-3.5">
                                    <span className="font-semibold text-green-600">S/ {Number(booking.totalAmount).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                                  </td>
                                  <td className="py-3.5">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${meta.color}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                                      {meta.label}
                                    </span>
                                  </td>
                                  <td className="py-3.5">
                                    {order.isOrder ? (
                                      /* ── Acciones para PEDIDOS ── */
                                      <div className="flex flex-col gap-1.5">
                                        {booking.status === 'PENDING' && (
                                          <button onClick={() => handleStatusChange(booking.id, 'CONFIRMED')} disabled={isUpdating}
                                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition font-medium">
                                            <Check className="w-3 h-3" />{isUpdating ? 'Actualizando...' : 'Confirmar'}
                                          </button>
                                        )}
                                        {booking.status === 'CONFIRMED' && (
                                          isPremium
                                            ? <button onClick={() => handleStatusChange(booking.id, 'COMPLETED')} disabled={isUpdating}
                                                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-50 transition font-medium">
                                                <Check className="w-3 h-3" />{isUpdating ? 'Actualizando...' : 'Completar'}
                                              </button>
                                            : <button onClick={() => handleMarkPaid(booking.id)} disabled={markingPaid === booking.id}
                                                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-50 transition font-medium">
                                                <Banknote className="w-3 h-3" />{markingPaid === booking.id ? 'Registrando...' : 'Marcar pagado'}
                                              </button>
                                        )}
                                        <a
                                          href={buildContactMailto(booking, order, businesses.find(b => b.id === selectedBizId)?.name ?? 'NegociClick')}
                                          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition font-medium"
                                        >
                                          <Mail className="w-3 h-3" /> Contactar
                                        </a>
                                        {booking.status === 'COMPLETED' && (
                                          <button
                                            onClick={() => {
                                              const bizName = businesses.find(b => b.id === selectedBizId)?.name ?? 'NegociClick';
                                              const text =
                                                `📦 Pedido de ${booking.client.name} (${booking.client.email})\n` +
                                                `Productos: ${order.items}\n` +
                                                `Total: S/ ${Number(booking.totalAmount).toLocaleString('es-PE', { minimumFractionDigits: 2 })}\n` +
                                                (order.address ? `Dirección: ${order.address}\n` : '') +
                                                (order.deliveryDate ? `Entrega: ${order.deliveryDate}\n` : '') +
                                                (order.extraNotes ? `Notas: ${order.extraNotes}\n` : '') +
                                                `Negocio: ${bizName}`;
                                              navigator.clipboard.writeText(text).then(() => toast.show('Resumen copiado al portapapeles', 'success'));
                                            }}
                                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition font-medium"
                                          >
                                            <ClipboardCopy className="w-3 h-3" /> Copiar resumen
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      /* ── Acciones para RESERVAS ── */
                                      <>
                                        {booking.status === 'PENDING' && (
                                          <button onClick={() => handleStatusChange(booking.id, 'CONFIRMED')} disabled={isUpdating}
                                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition font-medium">
                                            <Check className="w-3 h-3" />{isUpdating ? 'Actualizando...' : 'Confirmar'}
                                          </button>
                                        )}
                                        {booking.status === 'CONFIRMED' && (
                                          isPremium
                                            ? <button onClick={() => handleStatusChange(booking.id, 'COMPLETED')} disabled={isUpdating}
                                                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-50 transition font-medium">
                                                <Check className="w-3 h-3" />{isUpdating ? 'Actualizando...' : 'Completar'}
                                              </button>
                                            : <button onClick={() => handleMarkPaid(booking.id)} disabled={markingPaid === booking.id}
                                                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-50 transition font-medium">
                                                <Banknote className="w-3 h-3" />{markingPaid === booking.id ? 'Registrando...' : 'Marcar pagado'}
                                              </button>
                                        )}
                                        {(booking.status === 'COMPLETED' || booking.status === 'CANCELLED') && (
                                          <span className="text-xs text-gray-400">—</span>
                                        )}
                                      </>
                                    )}
                                  </td>
                                </tr>
                                {order.isOrder && isExpanded && (
                                  <tr key={`${booking.id}-detail`} className="bg-orange-50/60">
                                    <td colSpan={6} className="px-4 py-4">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        <div>
                                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Productos del pedido</p>
                                          <ul className="space-y-0.5">
                                            {order.items.split(' + ').map((item, i) => (
                                              <li key={i} className="text-gray-700 flex items-start gap-1.5">
                                                <span className="text-orange-400 mt-0.5">•</span>{item.trim()}
                                              </li>
                                            ))}
                                          </ul>
                                          {order.total && (
                                            <div className="mt-2 pt-2 border-t border-orange-100">
                                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">Total del pedido</p>
                                              <p className="text-base font-bold text-orange-600">{order.total}</p>
                                            </div>
                                          )}
                                        </div>
                                        <div className="space-y-2">
                                          {order.address && (
                                            <div>
                                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">Dirección de entrega</p>
                                              <p className="text-gray-700">📍 {order.address}</p>
                                            </div>
                                          )}
                                          {order.deliveryDate && order.deliveryDate !== 'A coordinar' && (
                                            <div>
                                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">Fecha de entrega</p>
                                              <p className="text-gray-700">📅 {new Date(order.deliveryDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                            </div>
                                          )}
                                          {order.deliveryDate === 'A coordinar' && (
                                            <div>
                                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">Fecha de entrega</p>
                                              <p className="text-gray-500 italic">A coordinar con el cliente</p>
                                            </div>
                                          )}
                                          {order.extraNotes && (
                                            <div>
                                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">Notas del cliente</p>
                                              <p className="text-gray-700">💬 {order.extraNotes}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB: INGRESOS ── */}
              {tab === 'Ingresos' && (
                <div className="p-6 space-y-5">
                  {/* Period selector */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {(['week', 'month', 'year', 'all'] as EarningsPeriod[]).map(p => {
                      const labels: Record<EarningsPeriod, string> = { week: 'Esta semana', month: 'Este mes', year: 'Este año', all: 'Todo' };
                      return (
                        <button key={p} onClick={() => setEarningsPeriod(p)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${earningsPeriod === p ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                          {labels[p]}
                        </button>
                      );
                    })}
                  </div>

                  {earningsLoading ? (
                    <div className="py-16 flex justify-center">
                      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : !earnings ? (
                    <div className="py-12 text-center text-gray-400 text-sm">No se pudieron cargar los ingresos.</div>
                  ) : (
                    <>
                      {/* Summary cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          { label: 'Total ingresos',  value: `S/ ${earnings.summary.totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, color: 'bg-green-50 text-green-600', icon: TrendingUp },
                          { label: 'Transacciones',   value: earnings.summary.transactionCount,                                                           color: 'bg-indigo-50 text-indigo-600', icon: Calendar },
                          { label: 'Promedio',        value: earnings.summary.transactionCount > 0 ? `S/ ${(earnings.summary.totalRevenue / earnings.summary.transactionCount).toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : '—', color: 'bg-blue-50 text-blue-600', icon: Banknote },
                        ].map(({ label, value, color, icon: Icon }) => (
                          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Transactions table */}
                      {earnings.transactions.length === 0 ? (
                        <div className="py-10 text-center">
                          <Banknote className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm font-medium">Sin ingresos en este período</p>
                          <p className="text-gray-400 text-xs mt-1">Los pagos confirmados aparecerán aquí.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500 border-b border-gray-100">
                                <th className="pb-3 font-medium">Fecha</th>
                                <th className="pb-3 font-medium">Cliente</th>
                                <th className="pb-3 font-medium">Servicio</th>
                                <th className="pb-3 font-medium text-right">Total</th>
                                <th className="pb-3 font-medium">Método</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {earnings.transactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-gray-50/50">
                                  <td className="py-3 text-gray-500 whitespace-nowrap">
                                    {new Date(tx.date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </td>
                                  <td className="py-3 font-medium text-gray-900">{tx.clientName}</td>
                                  <td className="py-3 text-gray-600 max-w-[180px] truncate">{tx.serviceName}</td>
                                  <td className="py-3 text-right font-bold text-green-600">S/ {tx.amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                                  <td className="py-3">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tx.provider === 'CASH' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                      {tx.provider === 'CASH' ? '💵 Efectivo' : '💳 Online'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── TAB: ANALÍTICAS ── */}
              {tab === 'Analíticas' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Analíticas de tu negocio</h3>
                    <p className="text-sm text-gray-500">Visitas al perfil, reservas recientes y servicios más populares.</p>
                  </div>

                  {analyticsLoading ? (
                    <div className="py-16 flex justify-center">
                      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : !analyticsData ? (
                    <div className="py-12 text-center text-gray-400 text-sm">No se pudieron cargar las analíticas.</div>
                  ) : (
                    <>
                      {/* KPI cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          { label: 'Visitas al perfil', value: analyticsData.views.toLocaleString('es-PE'),        icon: Eye,        color: 'bg-blue-50 text-blue-600' },
                          { label: 'Reservas (30 días)', value: analyticsData.bookingsLast30,                       icon: Calendar,   color: 'bg-indigo-50 text-indigo-600' },
                          { label: 'Reservas (7 días)',  value: analyticsData.bookingsLast7,                        icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
                          { label: 'Ingresos (mes)',     value: `S/ ${analyticsData.revenueLastMonth.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, icon: Banknote, color: 'bg-green-50 text-green-600' },
                        ].map(({ label, value, icon: Icon, color }) => (
                          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${color}`}><Icon className="w-4 h-4" /></div>
                            <div>
                              <p className="text-xs text-gray-500">{label}</p>
                              <p className="text-lg font-bold text-gray-900">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid lg:grid-cols-2 gap-5">
                        {/* Estado de reservas */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                          <h4 className="font-semibold text-gray-800 text-sm">Reservas por estado (total)</h4>
                          {Object.entries(analyticsData.bookingsByStatus).length === 0 ? (
                            <p className="text-sm text-gray-400">Sin reservas aún.</p>
                          ) : (
                            <div className="space-y-2">
                              {Object.entries(analyticsData.bookingsByStatus).map(([status, count]) => {
                                const total = Object.values(analyticsData.bookingsByStatus).reduce((s, n) => s + n, 0);
                                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                                const colors: Record<string, string> = { PENDING: 'bg-yellow-400', CONFIRMED: 'bg-blue-500', COMPLETED: 'bg-green-500', CANCELLED: 'bg-red-400' };
                                const labels: Record<string, string> = { PENDING: 'Pendientes', CONFIRMED: 'Confirmadas', COMPLETED: 'Completadas', CANCELLED: 'Canceladas' };
                                return (
                                  <div key={status} className="space-y-1">
                                    <div className="flex justify-between text-xs text-gray-600">
                                      <span>{labels[status] ?? status}</span>
                                      <span className="font-medium">{count} ({pct}%)</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${colors[status] ?? 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Servicios más solicitados */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                          <h4 className="font-semibold text-gray-800 text-sm">Servicios más solicitados</h4>
                          {analyticsData.topServices.length === 0 ? (
                            <p className="text-sm text-gray-400">Sin datos aún.</p>
                          ) : (
                            <div className="space-y-2">
                              {analyticsData.topServices.map((svc, i) => (
                                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-400">#{i + 1}</span>
                                    <span className="text-sm text-gray-800">{svc.name}</span>
                                  </div>
                                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{svc.count} reservas</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reseñas recientes */}
                      {analyticsData.recentReviews.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                          <h4 className="font-semibold text-gray-800 text-sm">Últimas reseñas</h4>
                          <div className="space-y-3">
                            {analyticsData.recentReviews.map((r, i) => (
                              <div key={i} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                                  {r.client.name[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900">{r.client.name}</span>
                                    <div className="flex">
                                      {Array.from({ length: 5 }).map((_, si) => (
                                        <Star key={si} className={`w-3 h-3 ${si < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                      ))}
                                    </div>
                                  </div>
                                  {r.comment && <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{r.comment}</p>}
                                  <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString('es-PE')}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── TAB: AGENDA ── */}
              {tab === 'Agenda' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Bloquear fechas no disponibles</h3>
                    <p className="text-sm text-gray-500">Los clientes verán una advertencia si intentan reservar en estas fechas.</p>
                  </div>

                  {/* Formulario nuevo bloqueo */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-medium text-gray-700">Agregar bloqueo</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Desde</label>
                        <input
                          type="date"
                          value={newBlock.startDate}
                          min={new Date().toISOString().slice(0, 10)}
                          onChange={e => setNewBlock(b => ({ ...b, startDate: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                        <input
                          type="date"
                          value={newBlock.endDate}
                          min={newBlock.startDate || new Date().toISOString().slice(0, 10)}
                          onChange={e => setNewBlock(b => ({ ...b, endDate: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Motivo (opcional) — ej: Vacaciones, feriado, mantenimiento"
                      value={newBlock.reason}
                      onChange={e => setNewBlock(b => ({ ...b, reason: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleAddBlock}
                      disabled={savingBlock || !newBlock.startDate || !newBlock.endDate}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {savingBlock ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Bloquear fechas
                    </button>
                  </div>

                  {/* Lista de bloqueos activos */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Bloqueos activos</p>
                    {availLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : availBlocks.length === 0 ? (
                      <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
                        <CalendarOff className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No tienes fechas bloqueadas.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {availBlocks.map(block => (
                          <div key={block.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {new Date(block.startDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                {' — '}
                                {new Date(block.endDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                              {block.reason && <p className="text-xs text-gray-400 mt-0.5">{block.reason}</p>}
                            </div>
                            <button
                              onClick={() => handleDeleteBlock(block.id)}
                              disabled={deletingBlock === block.id}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition disabled:opacity-50"
                            >
                              {deletingBlock === block.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Trash2 className="w-4 h-4" />
                              }
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── TAB: NEGOCIOS ── */}
              {tab === 'Negocios' && (
                <div className="p-6 space-y-4">
                  {businesses.map(biz => (
                    <div key={biz.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                          {biz.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{biz.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{CATEGORY_LABELS[biz.category] || biz.category}</span>
                            <span className="text-xs text-gray-400">{biz.city}</span>
                            {biz.averageRating && (
                              <span className="flex items-center gap-1 text-xs text-yellow-600">
                                <Star className="w-3 h-3 fill-yellow-400" />{biz.averageRating}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <button onClick={() => openEditModal(biz)}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
                          <Pencil className="w-3.5 h-3.5" /> Editar
                        </button>
                        {!isFreePlan && (
                          <button onClick={() => { setSelectedBizId(biz.id); setTab('Horarios'); }}
                            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
                            <Clock3 className="w-3.5 h-3.5" /> Horarios
                          </button>
                        )}
                        {!isFreePlan && (
                          <button onClick={() => { setSelectedBizId(biz.id); setTab('Fotos'); }}
                            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
                            <Image className="w-3.5 h-3.5" /> Fotos
                          </button>
                        )}
                        <Link href={`/businesses/${biz.id}`}
                          className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
                          Ver página
                        </Link>
                      </div>
                    </div>
                  ))}
                  <div className="w-full border-2 border-dashed border-gray-100 rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-400">Solo puedes tener 1 negocio por cuenta.</p>
                  </div>
                  {businesses.length > 0 && (
                    <FeaturedSection businessId={businesses[0].id} />
                  )}
                </div>
              )}

              {/* ── TAB: SERVICIOS ── */}
              {tab === 'Servicios' && (
                <div className="p-6">
                  {(() => {
                    const plan = subscription?.plan ?? 'FREE';
                    const SERVICE_LIMITS: Record<string, number> = { FREE: 5, PRO: 15, PREMIUM: Infinity };
                    const limit = SERVICE_LIMITS[plan] ?? 3;
                    const atLimit = limit !== Infinity && services.length >= limit;
                    return (
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-semibold text-gray-900">Servicios de {selectedBiz?.name}</h3>
                      <p className="text-sm text-gray-500">
                        {services.length} servicio{services.length !== 1 ? 's' : ''}
                        {limit !== Infinity && (
                          <span className={`ml-1 ${atLimit ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                            · límite {services.length}/{limit} (plan {plan})
                          </span>
                        )}
                      </p>
                    </div>
                    {atLimit ? (
                      <a href="/subscription"
                        className="inline-flex items-center gap-2 bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-amber-600 transition">
                        <Zap className="w-4 h-4" /> Mejorar plan
                      </a>
                    ) : (
                      <button onClick={() => { setShowServiceForm(true); setServiceError(''); }}
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                        <Plus className="w-4 h-4" /> Agregar servicio
                      </button>
                    )}
                  </div>
                    );
                  })()}

                  {/* Servicios sugeridos para la categoría */}
                  {!showServiceForm && services.length === 0 && catConfig.templates.length > 0 && (
                    <div className="mb-6 border border-indigo-100 bg-indigo-50/50 rounded-2xl p-5">
                      <p className="text-sm font-bold text-indigo-800 mb-1">
                        {catConfig.emoji} Servicios típicos para tu {CATEGORY_LABELS[selectedBiz?.category ?? ''] ?? 'negocio'}
                      </p>
                      <p className="text-xs text-indigo-500 mb-4">Agrégalos con un clic y edítalos después.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {catConfig.templates.map(tpl => (
                          <button
                            key={tpl.name}
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await api.post('/services', {
                                  businessId: selectedBizId,
                                  name: tpl.name,
                                  description: tpl.description,
                                  price: tpl.price,
                                  duration: tpl.duration,
                                  category: selectedBiz?.category ?? 'OTRO',
                                });
                                setServices(prev => [...prev, res.data.service]);
                              } catch {}
                            }}
                            className="flex items-center justify-between text-left bg-white border border-indigo-100 rounded-xl px-4 py-3 hover:border-indigo-400 hover:shadow-sm transition group"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition">{tpl.name}</p>
                              <p className="text-xs text-gray-400">{tpl.duration} min · S/ {tpl.price}</p>
                            </div>
                            <Plus className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 flex-shrink-0 ml-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {showServiceForm && (
                    <div className="mb-6 border border-indigo-200 bg-indigo-50/40 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 text-sm">Nuevo servicio</h4>
                        <button onClick={() => setShowServiceForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                      </div>
                      {serviceError && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />{serviceError}
                        </div>
                      )}
                      <form onSubmit={handleAddService} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                          <input type="text" required value={serviceForm.name}
                            onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Ej: Corte de pelo"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Categoría *</label>
                          <select required value={serviceForm.category}
                            onChange={e => setServiceForm(f => ({ ...f, category: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Precio (S/) *</label>
                          <input type="number" required min="0" step="0.01" value={serviceForm.price}
                            onChange={e => setServiceForm(f => ({ ...f, price: e.target.value }))}
                            placeholder="50"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Duración (min)</label>
                          <input type="number" min="1" value={serviceForm.duration}
                            onChange={e => setServiceForm(f => ({ ...f, duration: e.target.value }))}
                            placeholder="30"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                          <input type="text" value={serviceForm.description}
                            onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Descripción del servicio"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div className="sm:col-span-2 flex gap-3 pt-1">
                          <button type="button" onClick={() => setShowServiceForm(false)}
                            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Cancelar</button>
                          <button type="submit" disabled={savingService}
                            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
                            {savingService ? 'Guardando...' : 'Guardar servicio'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {servicesLoading ? (
                    <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
                  ) : services.length === 0 ? (
                    <div className="py-12 text-center">
                      <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Este negocio no tiene servicios.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {services.map(service => (
                        <div key={service.id} className="border border-gray-200 rounded-xl overflow-hidden hover:border-indigo-200 hover:shadow-sm transition-all group">
                          {/* Foto del servicio */}
                          <label className="relative block cursor-pointer">
                            {service.photo ? (
                              <img src={resolveUrl(service.photo)}
                                alt={service.name}
                                className="w-full h-36 object-contain object-center bg-gray-50 p-2" />
                            ) : (
                              <div className="w-full h-36 bg-gray-100 flex flex-col items-center justify-center gap-1 text-gray-400 hover:bg-indigo-50 hover:text-indigo-400 transition">
                                <Image className="w-5 h-5" />
                                <span className="text-[10px] font-medium">Agregar foto</span>
                              </div>
                            )}
                            {service.photo && (
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Camera className="w-6 h-6 text-white drop-shadow" />
                              </div>
                            )}
                            <input type="file" accept="image/*" className="sr-only"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const fd = new FormData();
                                fd.append('photo', file);
                                try {
                                  const res = await api.post(`/services/${service.id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                                  setServices(prev => prev.map(s => s.id === service.id ? { ...s, photo: res.data.photo } : s));
                                } catch { toast.show('Error al subir la foto', 'error'); }
                              }} />
                          </label>
                          <div className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{service.name}</p>
                                <p className="text-xs text-indigo-600 mt-0.5">{CATEGORY_LABELS[service.category] || service.category}</p>
                                {service.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{service.description}</p>}
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-sm font-bold text-gray-900">S/ {Number(service.price).toFixed(2)}</span>
                                  {service.duration && (
                                    <span className="flex items-center gap-1 text-xs text-gray-400">
                                      <Clock className="w-3 h-3" />{service.duration} min
                                    </span>
                                  )}
                                </div>
                              </div>
                              {confirmDeleteService === service.id ? (
                                <div className="ml-3 flex items-center gap-1 flex-shrink-0">
                                  <button onClick={() => handleDeleteService(service.id)} disabled={deletingService === service.id}
                                    className="text-[10px] font-bold px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
                                    {deletingService === service.id ? '...' : 'Sí'}
                                  </button>
                                  <button onClick={() => setConfirmDeleteService(null)}
                                    className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => handleDeleteService(service.id)}
                                  className="ml-3 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100" title="Eliminar">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB: HORARIOS ── */}
              {tab === 'Horarios' && (
                <div className="p-6">
                  {isFreePlan
                    ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Lock className="w-7 h-7 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Disponible en planes PRO y Premium</h3>
                        <p className="text-gray-500 text-sm mb-6 max-w-xs">Configura los horarios de atención para que los clientes sepan cuándo pueden reservar.</p>
                        <Link href="/subscription" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition text-sm">
                          <Crown className="w-4 h-4" /> Mejorar plan
                        </Link>
                      </div>
                    )
                    : (
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="font-semibold text-gray-900">Horarios de atención</h3>
                            <p className="text-sm text-gray-500">{selectedBiz?.name}</p>
                          </div>
                          <button
                            onClick={handleSaveHours}
                            disabled={savingHours}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${hoursSaved ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60'}`}
                          >
                            {savingHours
                              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : hoursSaved
                                ? <><Check className="w-4 h-4" /> Guardado</>
                                : <><Save className="w-4 h-4" /> Guardar horarios</>
                            }
                          </button>
                        </div>
                        {hoursLoading
                          ? <div className="py-10 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
                          : (
                            <div className="space-y-3">
                              {hours.map(h => (
                                <div key={h.dayOfWeek} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${h.isClosed ? 'bg-gray-50 border-gray-100 opacity-70' : 'bg-white border-gray-200'}`}>
                                  <div className="w-24 flex-shrink-0">
                                    <p className="text-sm font-semibold text-gray-800">{DAYS_ES[h.dayOfWeek]}</p>
                                  </div>
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <div onClick={() => updateHour(h.dayOfWeek, 'isClosed', !h.isClosed)} className={`relative w-10 h-5 rounded-full transition-colors ${h.isClosed ? 'bg-red-400' : 'bg-green-500'}`}>
                                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${h.isClosed ? 'translate-x-0.5' : 'translate-x-5'}`} />
                                    </div>
                                    <span className={`text-xs font-medium ${h.isClosed ? 'text-red-500' : 'text-green-600'}`}>{h.isClosed ? 'Cerrado' : 'Abierto'}</span>
                                  </label>
                                  {!h.isClosed && (
                                    <div className="flex items-center gap-2 ml-auto">
                                      <input type="time" value={h.openTime} onChange={e => updateHour(h.dayOfWeek, 'openTime', e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                      <span className="text-gray-400 text-sm">—</span>
                                      <input type="time" value={h.closeTime} onChange={e => updateHour(h.dayOfWeek, 'closeTime', e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                  )}
                                  {h.isClosed && <div className="ml-auto text-xs text-gray-400">No disponible</div>}
                                </div>
                              ))}
                            </div>
                          )
                        }
                      </>
                    )
                  }
                </div>
              )}

              {/* ── TAB: FOTOS ── */}
              {tab === 'Fotos' && (
                <div className="p-6">
                  {isFreePlan
                    ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Lock className="w-7 h-7 text-amber-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Disponible en planes PRO y Premium</h3>
                        <p className="text-gray-500 text-sm mb-6 max-w-xs">Sube fotos de tu negocio para atraer más clientes y destacar en los resultados de búsqueda.</p>
                        <Link href="/subscription" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition text-sm">
                          <Crown className="w-4 h-4" /> Mejorar plan
                        </Link>
                      </div>
                    )
                    : (
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="font-semibold text-gray-900">Galería de fotos</h3>
                            <p className={`text-sm ${photos.length >= 8 ? 'text-amber-600 font-semibold' : 'text-gray-500'}`}>
                              {photos.length} de 8 fotos{photos.length >= 8 ? ' · Límite alcanzado' : ''} · {selectedBiz?.name}
                            </p>
                          </div>
                          {photos.length < 8 && (
                            <>
                              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUploadPhoto} className="hidden" />
                              <button onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto} className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60">
                                {uploadingPhoto ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                                {uploadingPhoto ? 'Subiendo...' : 'Subir foto'}
                              </button>
                            </>
                          )}
                        </div>
                        {photoError && (
                          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />{photoError}
                          </div>
                        )}
                        {photosLoading
                          ? <div className="py-10 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
                          : photos.length === 0
                            ? (
                              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors">
                                <Image className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">Sube tu primera foto</p>
                                <p className="text-gray-400 text-sm mt-1">JPG, PNG o WebP · máx. 5 MB · hasta 8 fotos</p>
                              </div>
                            )
                            : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {photos.map(photo => (
                                  <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
                                    <img src={resolveUrl(photo.url)} alt={photo.caption ?? 'Foto del negocio'} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                      {confirmDeletePhoto === photo.id
                                        ? (
                                          <>
                                            <button onClick={() => handleDeletePhoto(photo.id)} disabled={deletingPhoto === photo.id} className="text-xs font-bold px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition">
                                              {deletingPhoto === photo.id ? '...' : 'Eliminar'}
                                            </button>
                                            <button onClick={() => setConfirmDeletePhoto(null)} className="text-xs font-bold px-3 py-1.5 bg-white/20 text-white rounded-lg hover:bg-white/30 transition">Cancelar</button>
                                          </>
                                        )
                                        : (
                                          <button onClick={() => handleDeletePhoto(photo.id)} className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition" title="Eliminar foto" aria-label="Eliminar foto">
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        )
                                      }
                                    </div>
                                  </div>
                                ))}
                                {photos.length < 8 && (
                                  <div onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors">
                                    <Plus className="w-6 h-6 text-gray-400" />
                                    <span className="text-xs text-gray-400 mt-1">Agregar</span>
                                  </div>
                                )}
                              </div>
                            )
                        }
                      </>
                    )
                  }
                </div>
              )}

              {/* ── TAB: PERFIL ── */}
              {tab === 'Perfil' && (
                <div className="p-6">
                  {isFreePlan ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-7 h-7 text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Disponible en planes PRO y Premium</h3>
                      <p className="text-gray-500 text-sm mb-6 max-w-xs">Personaliza tu negocio con foto de portada, slogan y descripción para destacar frente a tus clientes.</p>
                      <Link href="/subscription" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition text-sm">
                        <Crown className="w-4 h-4" /> Mejorar plan
                      </Link>
                    </div>
                  ) : (
                    <div className="max-w-xl space-y-6">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Perfil del negocio</h3>
                        <p className="text-sm text-gray-500">Esta información aparece en tu página pública.</p>
                      </div>

                      {/* Foto de portada */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Foto de portada</label>
                        <div
                          className="relative w-full h-44 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors cursor-pointer bg-gray-50 group"
                          onClick={() => coverInputRef.current?.click()}
                        >
                          {coverPreview ? (
                            <>
                              <img src={coverPreview} alt="Portada" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="flex items-center gap-2 bg-white text-gray-800 font-semibold text-sm px-4 py-2 rounded-xl">
                                  <Upload className="w-4 h-4" /> Cambiar foto
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-2">
                              {uploadingCover
                                ? <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                : <>
                                    <Upload className="w-8 h-8 text-gray-400" />
                                    <p className="text-sm text-gray-500 font-medium">Subir foto de portada</p>
                                    <p className="text-xs text-gray-400">JPG, PNG o WebP · máx. 5 MB</p>
                                  </>
                              }
                            </div>
                          )}
                        </div>
                        <input
                          ref={coverInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleUploadCover}
                          className="hidden"
                        />
                        <p className="text-xs text-gray-400 mt-1.5">Reemplaza el fondo de color en tu página pública.</p>
                      </div>

                      {/* Slogan */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Slogan</label>
                        <input
                          type="text"
                          maxLength={80}
                          placeholder="Ej: El mejor corte de tu vida, garantizado."
                          value={profileForm.slogan}
                          onChange={e => setProfileForm(f => ({ ...f, slogan: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                        />
                        <p className="text-xs text-gray-400 mt-1">{profileForm.slogan.length}/80 caracteres</p>
                      </div>

                      {/* Descripción */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descripción</label>
                        <textarea
                          rows={4}
                          maxLength={500}
                          placeholder="Describe tu negocio, qué ofreces y qué te diferencia..."
                          value={profileForm.description}
                          onChange={e => setProfileForm(f => ({ ...f, description: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">{profileForm.description.length}/500 caracteres</p>
                      </div>

                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-60"
                      >
                        {savingProfile
                          ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <Save className="w-4 h-4" />
                        }
                        {savingProfile ? 'Guardando...' : 'Guardar perfil'}
                      </button>

                      {/* ── Seguridad: 2FA ── */}
                      <div className="border-t border-gray-100 pt-6 mt-2">
                        <h3 className="font-semibold text-gray-900 mb-1">Autenticación en dos pasos (2FA)</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Protege tu cuenta con Google Authenticator, Authy o Microsoft Authenticator.
                        </p>

                        {twoFAStep === 'idle' && (
                          twoFAStatus?.twoFactorEnabled ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                                <BadgeCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-semibold text-green-800">2FA activo</p>
                                  <p className="text-xs text-green-600">{twoFAStatus.backupCodesRemaining} códigos de respaldo restantes</p>
                                </div>
                              </div>
                              <button
                                onClick={() => setTwoFAStep('disable')}
                                className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                              >
                                Deshabilitar 2FA
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={handle2FASetup}
                              disabled={twoFALoading}
                              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-60"
                            >
                              {twoFALoading
                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <Lock className="w-4 h-4" />}
                              Activar 2FA
                            </button>
                          )
                        )}

                        {twoFAStep === 'setup' && twoFASetup && (
                          <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                              1. Escanea este QR con tu app autenticadora.
                            </p>
                            <img src={twoFASetup.qrCode} alt="QR 2FA" className="w-48 h-48 rounded-xl border border-gray-200" />
                            <p className="text-xs text-gray-400">O copia el código manualmente: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700 select-all">{twoFASetup.secret}</span></p>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                              <p className="text-xs font-semibold text-amber-800 mb-2">Códigos de respaldo — guárdalos ya, no se mostrarán de nuevo:</p>
                              <div className="grid grid-cols-2 gap-1">
                                {twoFASetup.backupCodes.map(c => (
                                  <span key={c} className="font-mono text-xs bg-white border border-amber-200 rounded px-2 py-1 text-center">{c}</span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                2. Ingresa el código de 6 dígitos para confirmar
                              </label>
                              <input
                                type="text"
                                value={twoFACode}
                                onChange={e => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                className="w-40 border border-gray-200 rounded-xl px-4 py-2.5 text-center text-xl font-mono tracking-widest bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                              />
                            </div>

                            <div className="flex gap-3">
                              <button
                                onClick={handle2FAEnable}
                                disabled={twoFALoading || twoFACode.length < 6}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-50"
                              >
                                {twoFALoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                                Confirmar y activar
                              </button>
                              <button
                                onClick={() => { setTwoFAStep('idle'); setTwoFASetup(null); setTwoFACode(''); }}
                                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}

                        {twoFAStep === 'disable' && (
                          <div className="space-y-3 max-w-xs">
                            <p className="text-sm text-gray-600">Confirma tu contraseña para deshabilitar 2FA.</p>
                            <input
                              type="password"
                              value={twoFADisablePassword}
                              onChange={e => setTwoFADisablePassword(e.target.value)}
                              placeholder="Tu contraseña"
                              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white transition"
                            />
                            <div className="flex gap-3">
                              <button
                                onClick={handle2FADisable}
                                disabled={twoFALoading || !twoFADisablePassword}
                                className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-600 transition disabled:opacity-50"
                              >
                                {twoFALoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                                Deshabilitar
                              </button>
                              <button
                                onClick={() => { setTwoFAStep('idle'); setTwoFADisablePassword(''); }}
                                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* ── MODAL EDITAR NEGOCIO ── */}
      {editingBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingBiz(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Editar negocio</h3>
                <p className="text-xs text-gray-400 mt-0.5">{editingBiz.name}</p>
              </div>
              <button onClick={() => setEditingBiz(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditBusiness} className="p-6 space-y-4">
              {editError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{editError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nombre *</label>
                  <input type="text" required value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Categoría *</label>
                  <select required value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition">
                    {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Ciudad *</label>
                  <input type="text" required value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Dirección *</label>
                  <input type="text" required value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Teléfono / WhatsApp *</label>
                  <input type="tel" required value={editForm.phone}
                    onChange={e => setEditForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                    maxLength={9} placeholder="983081196"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email de contacto</label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Descripción</label>
                  <textarea rows={3} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Cuéntale a los clientes sobre tu negocio..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingBiz(null)}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" disabled={savingEdit}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {savingEdit
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Save className="w-4 h-4" /> Guardar cambios</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
