export type TransactionType = "venta" | "intercambio" | "ambos"
export type Condition = "nuevo" | "seminuevo" | "usado"
export type MaterialStatus = "disponible" | "reservado" | "prestado" | "intercambiado" | "vendido"

export interface Faculty {
  id: string
  name: string
  careers: Career[]
}

export interface Career {
  id: string
  name: string
  courses: string[]
}

export interface Category {
  id: string
  name: string
  icon: string
}

export interface Seller {
  id: string
  name: string
  email: string
  avatar: string
  faculty: string
  career: string
  verified: boolean
  rating: number
  ratingCount: number
  sales: number
  exchanges: number
  listings: number
  badges: string[]
}

export interface Product {
  id: string
  title: string
  description: string
  price: number
  images: string[]
  category: string
  faculty: string
  career: string
  course: string
  condition: Condition
  transaction: TransactionType
  status: MaterialStatus
  stock: number
  location: string
  views: number
  favorites: number
  createdAt: string
  featured: boolean
  seller: Seller
}

export const faculties: Faculty[] = [
  {
    id: "ingenieria",
    name: "Ingeniería y Arquitectura",
    careers: [
      {
        id: "sistemas",
        name: "Ingeniería de Sistemas",
        courses: ["Programación I", "Base de Datos", "Redes", "Estadística", "Sistemas Operativos"],
      },
      {
        id: "civil",
        name: "Ingeniería Civil",
        courses: ["Estática", "Resistencia de Materiales", "Topografía", "Hidráulica"],
      },
      {
        id: "arquitectura",
        name: "Arquitectura",
        courses: ["Diseño Arquitectónico", "Urbanismo", "Dibujo Técnico", "Maquetería"],
      },
    ],
  },
  {
    id: "administracion",
    name: "Ciencias Administrativas",
    careers: [
      {
        id: "administracion",
        name: "Administración",
        courses: ["Marketing", "Finanzas", "Contabilidad", "Recursos Humanos"],
      },
      {
        id: "negocios",
        name: "Negocios Internacionales",
        courses: ["Comercio Exterior", "Logística", "Economía"],
      },
    ],
  },
  {
    id: "medicina",
    name: "Medicina Humana",
    careers: [
      {
        id: "medicina",
        name: "Medicina",
        courses: ["Anatomía", "Fisiología", "Bioquímica", "Histología"],
      },
    ],
  },
  {
    id: "derecho",
    name: "Derecho y Ciencia Política",
    careers: [
      {
        id: "derecho",
        name: "Derecho",
        courses: ["Derecho Civil", "Derecho Penal", "Derecho Constitucional"],
      },
    ],
  },
]

export const categories: Category[] = [
  { id: "material", name: "Material Académico", icon: "BookOpen" },
  { id: "tecnologia", name: "Tecnología", icon: "Laptop" },
  { id: "arquitectura", name: "Arquitectura e Ingeniería", icon: "Ruler" },
  { id: "mobiliario", name: "Mobiliario", icon: "Armchair" },
  { id: "accesorios", name: "Accesorios", icon: "Backpack" },
]

const sellers: Seller[] = [
  {
    id: "s1",
    name: "Camila Rojas",
    email: "crojas@usmp.pe",
    avatar: "/diverse-students-studying.png",
    faculty: "Ingeniería y Arquitectura",
    career: "Ingeniería de Sistemas",
    verified: true,
    rating: 4.9,
    ratingCount: 28,
    sales: 32,
    exchanges: 11,
    listings: 8,
    badges: ["Estudiante Verificado", "Top Vendedor"],
  },
  {
    id: "s2",
    name: "Diego Fernández",
    email: "dfernandez@usmp.pe",
    avatar: "/male-student.png",
    faculty: "Ingeniería y Arquitectura",
    career: "Arquitectura",
    verified: true,
    rating: 4.7,
    ratingCount: 15,
    sales: 18,
    exchanges: 6,
    listings: 5,
    badges: ["Estudiante Verificado", "Vendedor Confiable"],
  },
  {
    id: "s3",
    name: "Valeria Quispe",
    email: "vquispe@usmp.pe",
    avatar: "/female-student.png",
    faculty: "Ciencias Administrativas",
    career: "Administración",
    verified: true,
    rating: 4.8,
    ratingCount: 20,
    sales: 24,
    exchanges: 9,
    listings: 6,
    badges: ["Estudiante Verificado", "Vendedor Confiable"],
  },
]

export const products: Product[] = [
  {
    id: "p1",
    title: "Laptop HP Pavilion i5 8GB RAM",
    description:
      "Laptop ideal para programación y diseño. Batería en excelente estado, incluye cargador original. Perfecta para los cursos de Ingeniería de Sistemas.",
    price: 1450,
    images: ["/products/laptop.png"],
    category: "tecnologia",
    faculty: "Ingeniería y Arquitectura",
    career: "Ingeniería de Sistemas",
    course: "Programación I",
    condition: "seminuevo",
    transaction: "venta",
    status: "disponible",
    stock: 1,
    location: "Campus Santa Anita",
    views: 342,
    favorites: 28,
    createdAt: "2026-05-28",
    featured: true,
    seller: sellers[0],
  },
  {
    id: "p2",
    title: "Calculadora Casio fx-991ES Plus",
    description:
      "Calculadora científica en perfecto estado. Usada solo un semestre. Ideal para cursos de cálculo y estadística.",
    price: 85,
    images: ["/products/calculadora.png"],
    category: "tecnologia",
    faculty: "Ingeniería y Arquitectura",
    career: "Ingeniería Civil",
    course: "Estática",
    condition: "seminuevo",
    transaction: "ambos",
    status: "disponible",
    stock: 2,
    location: "Biblioteca Central",
    views: 198,
    favorites: 15,
    createdAt: "2026-05-29",
    featured: true,
    seller: sellers[1],
  },
  {
    id: "p3",
    title: "Libro Física Universitaria - Sears Zemansky",
    description:
      "Decimotercera edición. Tiene algunos subrayados pero está completo y en buen estado. Acepto intercambio por libro de cálculo.",
    price: 60,
    images: ["/products/libro-fisica.png"],
    category: "material",
    faculty: "Ingeniería y Arquitectura",
    career: "Ingeniería de Sistemas",
    course: "Estadística",
    condition: "usado",
    transaction: "intercambio",
    status: "intercambiado",
    stock: 1,
    location: "Cafetería Central",
    views: 156,
    favorites: 12,
    createdAt: "2026-05-27",
    featured: false,
    seller: sellers[0],
  },
  {
    id: "p4",
    title: "Maqueta arquitectónica escala 1:100",
    description:
      "Maqueta de proyecto de vivienda, material balsa y cartón pluma. Ideal como referencia para el curso de Diseño Arquitectónico.",
    price: 120,
    images: ["/products/maqueta.png"],
    category: "arquitectura",
    faculty: "Ingeniería y Arquitectura",
    career: "Arquitectura",
    course: "Diseño Arquitectónico",
    condition: "usado",
    transaction: "venta",
    status: "disponible",
    stock: 1,
    location: "Pabellón de Arquitectura",
    views: 89,
    favorites: 7,
    createdAt: "2026-05-26",
    featured: true,
    seller: sellers[1],
  },
  {
    id: "p5",
    title: "Mochila universitaria resistente al agua",
    description:
      "Mochila con compartimento para laptop hasta 15.6\". Color guinda, muy poco uso. Perfecta para llevar todos tus materiales.",
    price: 95,
    images: ["/products/mochila.png"],
    category: "accesorios",
    faculty: "Ciencias Administrativas",
    career: "Administración",
    course: "Marketing",
    condition: "seminuevo",
    transaction: "ambos",
    status: "prestado",
    stock: 1,
    location: "Centro de Estudiantes",
    views: 134,
    favorites: 19,
    createdAt: "2026-05-30",
    featured: false,
    seller: sellers[2],
  },
  {
    id: "p6",
    title: "Tablet con lápiz para tomar apuntes",
    description:
      "Tablet de 10 pulgadas con lápiz óptico incluido. Ideal para digitalizar tus apuntes y leer PDFs de clase.",
    price: 520,
    images: ["/products/tablet.png"],
    category: "tecnologia",
    faculty: "Medicina Humana",
    career: "Medicina",
    course: "Anatomía",
    condition: "seminuevo",
    transaction: "venta",
    status: "disponible",
    stock: 1,
    location: "Campus La Fontana",
    views: 211,
    favorites: 22,
    createdAt: "2026-05-29",
    featured: true,
    seller: sellers[2],
  },
  {
    id: "p7",
    title: "Set completo de dibujo técnico",
    description:
      "Incluye escuadras, compás de precisión, escalímetro y reglas. Todo lo que necesitas para Dibujo Técnico.",
    price: 70,
    images: ["/products/dibujo.png"],
    category: "arquitectura",
    faculty: "Ingeniería y Arquitectura",
    career: "Arquitectura",
    course: "Dibujo Técnico",
    condition: "usado",
    transaction: "ambos",
    status: "disponible",
    stock: 1,
    location: "Pabellón de Arquitectura",
    views: 76,
    favorites: 9,
    createdAt: "2026-05-25",
    featured: false,
    seller: sellers[1],
  },
  {
    id: "p8",
    title: "Apuntes completos de Base de Datos",
    description:
      "Apuntes a mano de todo el ciclo, incluye ejercicios resueltos de SQL y modelado entidad-relación. Aprobé con 18.",
    price: 25,
    images: ["/products/apuntes.png"],
    category: "material",
    faculty: "Ingeniería y Arquitectura",
    career: "Ingeniería de Sistemas",
    course: "Base de Datos",
    condition: "nuevo",
    transaction: "venta",
    status: "disponible",
    stock: 5,
    location: "Biblioteca Central",
    views: 167,
    favorites: 31,
    createdAt: "2026-05-31",
    featured: true,
    seller: sellers[0],
  },
]

export interface SafePoint {
  id: string
  name: string
  type: string
  schedule: string
  level: string
}

export interface Campus {
  id: string
  name: string
  city: string
  bbox: string
  points: SafePoint[]
}

export const campuses: Campus[] = [
  {
    id: "lima",
    name: "Sede Central",
    city: "Lima",
    bbox: "-76.97%2C-12.06%2C-76.94%2C-12.04",
    points: [
      { id: "lima-1", name: "Biblioteca Central", type: "Biblioteca", schedule: "Lun - Vie, 8:00 - 21:00", level: "Alta" },
      { id: "lima-2", name: "Cafetería Central", type: "Cafetería", schedule: "Lun - Sáb, 7:00 - 20:00", level: "Alta" },
      { id: "lima-3", name: "Patio Principal", type: "Área común", schedule: "Lun - Vie, 7:00 - 22:00", level: "Media" },
      { id: "lima-4", name: "Centro de Estudiantes", type: "Servicios", schedule: "Lun - Vie, 9:00 - 18:00", level: "Alta" },
    ],
  },
  {
    id: "arequipa",
    name: "Filial Sur",
    city: "Arequipa",
    bbox: "-71.55%2C-16.42%2C-71.51%2C-16.39",
    points: [
      { id: "aqp-1", name: "Biblioteca Filial Sur", type: "Biblioteca", schedule: "Lun - Vie, 8:00 - 20:00", level: "Alta" },
      { id: "aqp-2", name: "Cafetería Filial Sur", type: "Cafetería", schedule: "Lun - Sáb, 7:30 - 19:00", level: "Alta" },
    ],
  },
]

export function getProduct(id: string) {
  return products.find((p) => p.id === id)
}

export function getCategoryName(id: string) {
  return categories.find((c) => c.id === id)?.name ?? id
}

export const transactionLabels: Record<TransactionType, string> = {
  venta: "Venta",
  intercambio: "Intercambio",
  ambos: "Venta o intercambio",
}

export const conditionLabels: Record<Condition, string> = {
  nuevo: "Nuevo",
  seminuevo: "Seminuevo",
  usado: "Usado",
}

export const statusLabels: Record<MaterialStatus, string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  prestado: "Prestado",
  intercambiado: "Intercambiado",
  vendido: "Vendido",
}
