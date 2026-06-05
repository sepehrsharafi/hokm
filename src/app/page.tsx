import { LandingScreen } from "@/components/landing-screen";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: Props) {
  const resolved = await searchParams;
  return <LandingScreen searchParams={resolved} />;
}
