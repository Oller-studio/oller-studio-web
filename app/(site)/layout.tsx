import { TopBar } from "@/components/layout/TopBar";
import { Header } from "@/components/layout/Header";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <TopBar />
      <Header />
      {children}
    </>
  );
}
