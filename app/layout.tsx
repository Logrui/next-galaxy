import './globals.css';

export const metadata = {
  title: 'Next Galaxy',
  description: 'Three.js Galaxy in Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
