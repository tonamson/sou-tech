import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cho phép mở dev qua IP LAN (vd phone/máy khác → 192.168.1.5:3000)
  allowedDevOrigins: ["192.168.1.5"],
  // Cache dài cho model 3D tĩnh (GLB/FBX/skin)
  async headers() {
    return [
      {
        source: "/client/models/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
