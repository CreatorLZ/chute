import { QewordlyStyles, QewordlyHeader } from "@qewordly/react";
import { qw, API_URL } from "@/lib/qw";

export default async function BlogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const theme = await qw.getTheme();
  return (
    <>
      <QewordlyStyles theme={theme} fontBaseUrl={API_URL} />
      <QewordlyHeader theme={theme} imageBaseUrl={API_URL} />
      {children}
    </>
  );
}
