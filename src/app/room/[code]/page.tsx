import { RoomClient } from "@/components/room-client";

type Props = {
  params: Promise<{
    code: string;
  }>;
};

export default async function RoomCodePage({ params }: Props) {
  const { code } = await params;
  return <RoomClient roomCode={code.toUpperCase()} />;
}
