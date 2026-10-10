interface User {
  _id: string;
  username: string;
  email: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

interface Book {
  _id: string;
  title: string;
  caption: string;
  image: string;
  rating: number;
  user: Pick<User, "username" | "email"> & {
    _id: string;
  };

  createdAt: string;
  updatedAt: string;
}

interface BooksResponse {
  books: Book[];
  totalBooks: number;
  currentPage: number;
  totalPages: number;
}
