
import type { Metadata } from 'next';
import { Lato } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import './navStyle.css';
import Navbar from '@/components/Navbar/navbar';
import { SettingsProvider } from '@/hooks/useSettings'; 
import { SessionProvider } from 'next-auth/react';
import { Providers } from './providers';

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });
const dancingScript = localFont({
  src: [
    {
      path: '../public/fonts/static/DancingScript-Bold.ttf',
      weight: '700',
    },
    {
      path: '../public/fonts/static/DancingScript-SemiBold.ttf',
      weight: '600',
    },
    {
      path: '../public/fonts/static/DancingScript-Regular.ttf',
      weight: '400',
    },
    {
      path: '../public/fonts/static/DancingScript-Medium.ttf',
      weight: '500',
    },
  ],
  variable: '--font-DancingScript',
});

const latoFont = Lato({
  weight: ['300', '400', '700'],
  style: ['italic', 'normal'],
  subsets: ['latin'],
});
export const metadata: Metadata = { 
    openGraph: { title: "ScreenChoreo App", url: `${process.env.NEXTAUTH_URL}` },
    description: "This platform manages all visual screens at ballroom dance competitions, delivering synchronized heat lists, schedules, timers, and announcements across the venue. It ensures organizers, dancers, and audiences always see the right information at the right moment, keeping the entire event running smoothly and elegantly." ,
    title: "ScreenChoreo App" 
  };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`min-h-screen antialiased ${latoFont.className} ${dancingScript.variable}`}
    >
      <link
        rel="icon"
        href="/icon?<generated>"
        type="image/<generated>"
        sizes="<generated>"
      />
      <link
        rel="apple-touch-icon"
        href="/apple-icon?<generated>"
        type="image/<generated>"
        sizes="<generated>"
      />
      <body suppressHydrationWarning={true}>
        <Providers>
          <main
            id="mainPage"
            className="fixed w-screen h-svh p-0 m-0 items-center justify-center overflow-hidden text-lightMainColor dark:text-darkMainColor bg-lightMainBG dark:bg-darkMainBG"
          >
            <Navbar path={''} locale={'EN'}>
              {children}
            </Navbar>
          </main>
         </Providers>
      </body>
    </html>
  );
}
