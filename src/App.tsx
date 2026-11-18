import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Home } from "@/pages/Home";
import { Explore } from "@/pages/Explore";
import { CategoryView } from "@/pages/CategoryView";
import { LoopDetail } from "@/pages/LoopDetail";
import { Favorites } from "@/pages/Favorites";
import { Collections } from "@/pages/Collections";
import { CollectionDetail } from "@/pages/CollectionDetail";
import { NotFound } from "@/pages/NotFound";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="explore" element={<Explore />} />
        <Route path="category/:category" element={<CategoryView />} />
        <Route path="loop/:slug" element={<LoopDetail />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="collections" element={<Collections />} />
        <Route path="collection" element={<Navigate to="/collections" replace />} />
        <Route path="collection/:id" element={<CollectionDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
