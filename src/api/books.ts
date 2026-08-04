import { api, USER_ID } from './client';
import type { Book, BookLookupResult } from '../types';

export function lookupBook(isbn: string): Promise<BookLookupResult> {
  return api.post<BookLookupResult>('/book_lookups', { user_id: USER_ID, isbn });
}

export function listBooks(): Promise<Book[]> {
  return api.get<Book[]>('/books');
}
