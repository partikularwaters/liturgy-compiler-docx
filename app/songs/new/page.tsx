import { getSectionNames } from "@/lib/liturgy/getSectionNames";
import { getSongs } from "@/lib/songs/getSongs";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import NewSongClient from "@/app/songs/new/NewSongClient";

export default async function NewSongPage(): Promise<React.ReactElement> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return (
      <div className="max-w-[960px] mx-auto p-8">
        <p className="text-sm text-text-muted">Sign in to create a new Song.</p>
      </div>
    );
  }

  const [sectionNames, allSongsResult] = await Promise.all([getSectionNames("song"), getSongs()]);
  const allSongs = allSongsResult ?? [];

  return (
    <div className="max-w-[960px] mx-auto p-8 flex flex-col gap-6">
      <h1 className="text-[28px] font-bold leading-9 text-text-primary">New Song</h1>
      <NewSongClient sectionNames={sectionNames} allSongs={allSongs} />
    </div>
  );
}
