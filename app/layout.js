import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata = {
  title: "Jarvis",
  description: "Personal AI Assistant",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
