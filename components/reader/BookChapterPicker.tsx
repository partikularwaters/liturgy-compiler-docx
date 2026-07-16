import type { BibleBook } from "@/types/bible";

interface BookChapterPickerProps {
  books: BibleBook[];
  selectedBook: string;
  selectedChapter: number;
  onBookChange: (book: string) => void;
  onChapterChange: (chapter: number) => void;
}

export default function BookChapterPicker({
  books,
  selectedBook,
  selectedChapter,
  onBookChange,
  onChapterChange,
}: BookChapterPickerProps): React.ReactElement {
  const chapterCount = books.find((b) => b.name === selectedBook)?.chapterCount ?? 1;
  const chapters = Array.from({ length: chapterCount }, (_, i) => i + 1);

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium leading-[18px] text-text-secondary" htmlFor="book-select">
          Book
        </label>
        <select
          id="book-select"
          value={selectedBook}
          onChange={(e) => onBookChange(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        >
          {books.map((book) => (
            <option key={book.name} value={book.name}>
              {book.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium leading-[18px] text-text-secondary" htmlFor="chapter-select">
          Chapter
        </label>
        <select
          id="chapter-select"
          value={selectedChapter}
          onChange={(e) => onChapterChange(Number(e.target.value))}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        >
          {chapters.map((chapter) => (
            <option key={chapter} value={chapter}>
              {chapter}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
