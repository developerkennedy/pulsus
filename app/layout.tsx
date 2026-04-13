import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Pulsus - Gestão de Clínica',
  description: 'Sistema de agenda médica e gestão de clínicas',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full antialiased font-sans">
        <SidebarProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
