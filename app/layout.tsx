import type { Metadata } from "next";
import { Inter, Old_Standard_TT, Ibarra_Real_Nova } from "next/font/google";
import TopNav from "@/components/layout/TopNav";
import ScriptureLinker from "@/components/layout/ScriptureLinker";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oldStandardTT = Old_Standard_TT({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-old-standard-tt",
});
const ibarraRealNova = Ibarra_Real_Nova({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-ibarra-real-nova",
});

export const metadata: Metadata = {
  title: "Liturgy Compiler",
  description: "Compile Scripture, liturgical formulas, and prayer into a complete order of worship.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${oldStandardTT.variable} ${ibarraRealNova.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <TopNav />
        <main className="flex-1 min-h-full">{children}</main>
        <ScriptureLinker />
      </body>
    </html>
  );
}
