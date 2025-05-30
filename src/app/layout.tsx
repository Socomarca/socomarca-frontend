import type { Metadata } from 'next';
import './globals.css';
import NavbarTest from './components/global/NavbarTest';
import { Poppins } from 'next/font/google';
import Modal from './components/global/Modal';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Socomarca | Compra rápida',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/logo_plant-192.png',
    apple: '/icons/logo_plant-192.png',
  },
};

export const viewport = {
  themeColor: 'white',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={poppins.variable}>
      <body className="font-poppins">
        {children}
        <NavbarTest />
        <Modal />
      </body>
    </html>
  );
}
