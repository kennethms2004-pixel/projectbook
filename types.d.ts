type Book = {
  _id: string;
  title: string;
  author: string;
  slug: string;
  coverURL: string;
  coverColor: string;
};

type BookCardProps = {
  book: Book;
};
