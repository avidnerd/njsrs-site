import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Donate to NJSRS | Support Science Research Education',
  description: 'Support the New Jersey Science Research Symposium through donations. Help fund event costs, judging, student awards, and expand opportunities for New Jersey student researchers.',
  keywords: ['donate to science fair', 'donate to research competition', 'NJSRS donation', 'support science education', 'science fair sponsorship', 'STEM education funding'],
  openGraph: {
    title: 'Donate to NJSRS | Support Science Research Education',
    description: 'Support the New Jersey Science Research Symposium through donations.',
    url: 'https://njsrs.org/donate',
  },
  alternates: {
    canonical: 'https://njsrs.org/donate',
  },
};

export default function DonateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
