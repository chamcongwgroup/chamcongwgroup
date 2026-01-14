/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    ERP_URL: process.env.NEXT_PUBLIC_ERP_URL,
    ERP_DB: process.env.NEXT_PUBLIC_ODOO_DB,
  },
}

module.exports = nextConfig