/** @type {import('next').NextConfig} */
const nextConfig = {
  // 병렬 E2E dev 서버가 .next 를 공유해 충돌하지 않도록 서버별 distDir 분리(기본값 .next).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      // Supabase Storage 공개 버킷
      { protocol: "https", hostname: "*.supabase.co" },
      // 목업/시드 데모 이미지 (Google Stitch)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
