import type { ReactNode } from "react";
import "../src/style.css";

export const metadata = {
  title: "Wack a Drive",
  description: "A fast touch-friendly arcade game about unruly hard drives.",
};

export const viewport = {
  themeColor: "#08131c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>): React.JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
