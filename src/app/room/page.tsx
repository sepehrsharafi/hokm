import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RoomPage({ searchParams }: Props) {
  const resolved = await searchParams;
  if (typeof resolved.code === "string" && resolved.code.trim()) {
    redirect(`/room/${resolved.code.toUpperCase()}`);
  }

  redirect("/");
}
