/** @type {import('next').NextConfig} */
const nextConfig = {
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
