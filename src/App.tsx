import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CataloguePage from './features/products/CataloguePage'
import ProductDetailPage from './features/products/ProductDetailPage'
import LoginPage from './features/auth/LoginPage'
import DashboardPage from './features/dashboard/DashboardPage'
import MyReservationsPage from './features/reservations/MyReservationsPage'
import { AuthProvider } from './features/auth/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CataloguePage />} />
          <Route path="/produit/:id" element={<ProductDetailPage />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/mes-reservations" element={<MyReservationsPage />} />
          <Route path="/admin" element={<DashboardPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
