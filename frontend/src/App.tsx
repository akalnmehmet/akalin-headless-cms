import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages — lazy loaded
const HomePage = lazy(() => import("./pages/public/HomePage"));
const BlogListPage = lazy(() => import("./pages/public/BlogListPage"));
const BlogPostPage = lazy(() => import("./pages/public/BlogPostPage"));
const ProjectsPage = lazy(() => import("./pages/public/ProjectsPage"));

// Admin pages — GrapesJS bu chunk'a dahil, public bundle'a dahil değil
const LoginPage = lazy(() => import("./pages/admin/LoginPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
    Yükleniyor...
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner />}>
        <Routes>
          {/* Public — Layout ile sarılı */}
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/blog" element={<Layout><BlogListPage /></Layout>} />
          <Route path="/blog/:slug" element={<Layout><BlogPostPage /></Layout>} />
          <Route path="/projects" element={<Layout><ProjectsPage /></Layout>} />

          {/* Admin — Layout olmadan */}
          <Route path="/admin/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
