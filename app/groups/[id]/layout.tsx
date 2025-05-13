import ThemeProvider from './ThemeProvider';

export default function GroupLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  return (
    <ThemeProvider groupId={params.id}>
      {children}
    </ThemeProvider>
  );
} 