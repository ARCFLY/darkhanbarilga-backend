export interface Property {
  _id?: string;
  id?: string;
  title: string;
  price: number;
  currency?: string;
  location?: string;
  district?: string;
  rooms: number;
  bathrooms: number;
  area?: number;
  sizeSqm?: number;
  floor?: number;
  totalFloors?: number;
  images: string[];
  agent?: { name: string; avatar: string; phone: string };
  assignedAgent?: { _id: string; firstName: string; lastName: string; phone?: string };
  isFeatured?: boolean;
  isNew?: boolean;
  status?: string;
  listingType?: string;
  description?: string;
}

export const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Баянзүрх дүүрэгт тансаг зайтай байр',
    price: 580000000,
    location: 'Баянзүрх дүүрэг, 15-р хороо',
    district: 'Баянзүрх',
    rooms: 3, bathrooms: 2, area: 112, floor: 8, totalFloors: 12,
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop'],
    agent: { name: 'Б. Анхбаяр', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', phone: '9911-2233' },
    isFeatured: true, isNew: false,
  },
  {
    id: '2',
    title: 'Хан-Уул дүүрэгт гэрэлтүүлэг сайн байр',
    price: 420000000,
    location: 'Хан-Уул дүүрэг, 3-р хороо',
    district: 'Хан-Уул',
    rooms: 2, bathrooms: 1, area: 78, floor: 5, totalFloors: 10,
    images: ['https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&h=400&fit=crop'],
    agent: { name: 'Г. Сарангэрэл', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', phone: '9911-4455' },
    isFeatured: false, isNew: true,
  },
  {
    id: '3',
    title: 'Сүхбаатар дүүрэгт цоо шинэ орон сууц',
    price: 750000000,
    location: 'Сүхбаатар дүүрэг, 1-р хороо',
    district: 'Сүхбаатар',
    rooms: 4, bathrooms: 2, area: 145, floor: 12, totalFloors: 18,
    images: ['https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&h=400&fit=crop'],
    agent: { name: 'Д. Баттулга', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', phone: '9911-6677' },
    isFeatured: true, isNew: true,
  },
  {
    id: '4',
    title: 'Чингэлтэй дүүрэгт тохилог байр',
    price: 350000000,
    location: 'Чингэлтэй дүүрэг, 5-р хороо',
    district: 'Чингэлтэй',
    rooms: 2, bathrooms: 1, area: 65, floor: 3, totalFloors: 5,
    images: ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&h=400&fit=crop'],
    agent: { name: 'Н. Энхтуул', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop', phone: '9911-8899' },
    isFeatured: false, isNew: false,
  },
  {
    id: '5',
    title: 'Сонгинохайрхан дүүрэгт хямд байр',
    price: 280000000,
    location: 'Сонгинохайрхан дүүрэг, 21-р хороо',
    district: 'Сонгинохайрхан',
    rooms: 2, bathrooms: 1, area: 58, floor: 4, totalFloors: 9,
    images: ['https://images.unsplash.com/photo-1600573472591-ee6c563aaec4?w=600&h=400&fit=crop'],
    agent: { name: 'Т. Мөнхбат', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', phone: '9911-0011' },
    isFeatured: false, isNew: true,
  },
  {
    id: '6',
    title: 'Баянгол дүүрэгт тансаг вилла',
    price: 1200000000,
    location: 'Баянгол дүүрэг, 10-р хороо',
    district: 'Баянгол',
    rooms: 5, bathrooms: 3, area: 320, floor: 2, totalFloors: 2,
    images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop'],
    agent: { name: 'Ц. Ариунбаатар', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop', phone: '9911-1122' },
    isFeatured: true, isNew: false,
  },
];

export const districts = [
  'Баянзүрх', 'Хан-Уул', 'Сүхбаатар',
  'Чингэлтэй', 'Сонгинохайрхан', 'Баянгол',
  'Налайх', 'Багануур', 'Багахангай',
];

export const priceRanges = [
  { label: 'Бүх үнэ', min: 0, max: Infinity },
  { label: '300 сая хүртэл', min: 0, max: 300000000 },
  { label: '300-500 сая', min: 300000000, max: 500000000 },
  { label: '500 сая - 1 тэрбум', min: 500000000, max: 1000000000 },
  { label: '1 тэрбумаас дээш', min: 1000000000, max: Infinity },
];

export const roomOptions = [1, 2, 3, 4, 5];
