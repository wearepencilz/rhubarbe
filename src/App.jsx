import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Services from './pages/Services'
import About from './pages/About'
import News from './pages/News'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import FAQ from './pages/FAQ'
import TestStack from './pages/TestStack'
import LinkTest from './pages/LinkTest'
import MegaMenuTest from './pages/MegaMenuTest'
import Tests from './pages/Tests'
import CMSLogin from './cms/CMSLogin'
import CMSDashboard from './cms/CMSDashboard'
import ProjectEditPage from './cms/ProjectEditPage'
import NewsEditPage from './cms/NewsEditPage'
import PageEditPage from './cms/PageEditPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/tests" element={<Tests />} />
          <Route path="/test-stack" element={<TestStack />} />
          <Route path="/link-test" element={<LinkTest />} />
          <Route path="/mega-menu-test" element={<MegaMenuTest />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="services" element={<Services />} />
            <Route path="about" element={<About />} />
            <Route path="news" element={<News />} />
            <Route path="terms" element={<Terms />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="faq" element={<FAQ />} />
          </Route>
          <Route path="/cms/login" element={<CMSLogin />} />
          <Route path="/cms" element={<ProtectedRoute><CMSDashboard /></ProtectedRoute>} />
          <Route path="/cms/projects/:id" element={<ProtectedRoute><ProjectEditPage /></ProtectedRoute>} />
          <Route path="/cms/news/:id" element={<ProtectedRoute><NewsEditPage /></ProtectedRoute>} />
          <Route path="/cms/pages/:pageName" element={<ProtectedRoute><PageEditPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
