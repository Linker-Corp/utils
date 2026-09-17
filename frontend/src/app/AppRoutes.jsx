import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';

const BackgroundRemoverPage = lazy(() => import('@/domains/background-remover/pages/BackgroundRemoverPage'));
const Base64DecoderPage = lazy(() => import('@/domains/base64/pages/Base64DecoderPage'));
const DashboardPage = lazy(() => import('@/domains/dashboard/pages/DashboardPage'));
const EcuadorIdPage = lazy(() => import('@/domains/ecuador-id/pages/EcuadorIdPage'));
const FileCompressorPage = lazy(() => import('@/domains/file-compressor/pages/FileCompressorPage'));
const JwtToolPage = lazy(() => import('@/domains/jwt/pages/JwtToolPage'));
const MarkdownConverterPage = lazy(() => import('@/domains/markdown/pages/MarkdownConverterPage'));
const PhotoMetadataPage = lazy(() => import('@/domains/photo-metadata/pages/PhotoMetadataPage'));
const TextToSpeechPage = lazy(() => import('@/domains/text-to-speech/pages/TextToSpeechPage'));

const AppRoutes = () => (
  <Suspense fallback={<div className="text-center p-5">Cargando herramienta...</div>}>
    <Routes>
      <Route path={ROUTES.home} element={<DashboardPage />} />
      <Route path={ROUTES.base64} element={<Base64DecoderPage />} />
      <Route path={ROUTES.textToSpeech} element={<TextToSpeechPage />} />
      <Route path={ROUTES.ecuadorId} element={<EcuadorIdPage />} />
      <Route path={ROUTES.jwt} element={<JwtToolPage />} />
      <Route path={ROUTES.photoMetadata} element={<PhotoMetadataPage />} />
      <Route path={ROUTES.backgroundRemover} element={<BackgroundRemoverPage />} />
      <Route path={ROUTES.fileCompressor} element={<FileCompressorPage />} />
      <Route path={ROUTES.markdown} element={<MarkdownConverterPage />} />
      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
