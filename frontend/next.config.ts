import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cho phép mở dev qua IP LAN (vd phone/máy khác → 192.168.1.5:3000)
  allowedDevOrigins: ["192.168.1.5"],
};

export default nextConfig;
