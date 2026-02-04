import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Odoo Attendance",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        {children}
      </body>
    </html>
  );
}
