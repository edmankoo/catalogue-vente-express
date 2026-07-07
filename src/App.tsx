import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CataloguePage from './features/products/CataloguePage'
import ProductDetailPage from './features/products/ProductDetailPage'
import LoginPage from './features/auth/LoginPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CataloguePage />} />
        <Route path="/produit/:id" element={<ProductDetailPage />} />
        <Route path="/connexion" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  )
}
