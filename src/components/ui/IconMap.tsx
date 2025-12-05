// Icon mapping component to replace emojis with professional icons
import {
  UtensilsCrossed,
  ShoppingCart,
  Search,
  ChefHat,
  FileText,
  User,
  LogIn,
  Home,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Phone,
  MapPin,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  Trash2,
  Edit,
  Settings,
  BarChart3,
  Users,
  Bell,
  RefreshCw,
  Filter,
  X,
  Menu as MenuIcon,
} from 'lucide-react'

export const icons = {
  menu: UtensilsCrossed,
  cart: ShoppingCart,
  search: Search,
  chef: ChefHat,
  orders: FileText,
  user: User,
  login: LogIn,
  home: Home,
  package: Package,
  check: CheckCircle,
  clock: Clock,
  error: XCircle,
  warning: AlertCircle,
  phone: Phone,
  location: MapPin,
  payment: CreditCard,
  back: ArrowLeft,
  next: ArrowRight,
  add: Plus,
  remove: Minus,
  delete: Trash2,
  edit: Edit,
  settings: Settings,
  analytics: BarChart3,
  users: Users,
  notification: Bell,
  refresh: RefreshCw,
  filter: Filter,
  close: X,
  hamburger: MenuIcon,
}

export type IconName = keyof typeof icons

interface IconProps {
  name: IconName
  className?: string
  size?: number
}

export function Icon({ name, className = '', size = 24 }: IconProps) {
  const IconComponent = icons[name]
  if (!IconComponent) return null
  return <IconComponent className={className} size={size} />
}




