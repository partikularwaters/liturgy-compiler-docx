import { getSectionNames } from "@/lib/liturgy/getSectionNames";
import { getSongs } from "@/lib/songs/getSongs";
import NewSongClient from "@/app/songs/new/NewSongClient";

export default async function NewSongPage(): Promise<React.ReactElement> {
  const [sectionNames, allSongs] = await Promise.all([getSectionNames(), getSongs()]);

  return (
    <div className="max-w-[960px] mx-auto p-8 flex flex-col gap-6">
      <h1 className="text-[28px] font-bold leading-9 text-text-primary">New Song</h1>
      <NewSongClient sectionNames={sectionNames} allSongs={allSongs} />
    </div>
  );
}
