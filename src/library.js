// Data, domain rules and state for the library. Swap the seed data for API calls later.
import { useReducer, useState } from "react";

const DAY = 864e5;
export const FINE_PER_DAY = 0.25;
export const LOAN_DAYS = 14;

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const TODAY = startOfDay(new Date());
export const addDays = (d, n) => new Date(d.getTime() + n * DAY);
export const fmtDate = (d) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
export const money = (n) => "$" + n.toFixed(2);

export const books = [
  { id: 1, title: "Things Fall Apart", author: "Chinua Achebe", subject: "Fiction", copies: 3 },
  { id: 2, title: "Half of a Yellow Sun", author: "Chimamanda Ngozi Adichie", subject: "Fiction", copies: 2 },
  { id: 3, title: "Clean Code", author: "Robert C. Martin", subject: "Computing", copies: 2 },
  { id: 4, title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", subject: "Computing", copies: 1 },
  { id: 5, title: "A Brief History of Time", author: "Stephen Hawking", subject: "Science", copies: 2 },
  { id: 6, title: "The Selfish Gene", author: "Richard Dawkins", subject: "Science", copies: 1 },
  { id: 7, title: "Sapiens", author: "Yuval Noah Harari", subject: "History", copies: 3 },
  { id: 8, title: "Americanah", author: "Chimamanda Ngozi Adichie", subject: "Fiction", copies: 1 },
];

export const members = [
  { id: 1, name: "Amina Bello", tier: "Standard" },
  { id: 2, name: "Tunde Okafor", tier: "Student" },
  { id: 3, name: "Grace Eze", tier: "Standard" },
];

export const bookOf = (id) => books.find((b) => b.id === id);
export const memberOf = (id) => members.find((m) => m.id === id);
export const availableCopies = (book, loans) =>
  book.copies - loans.filter((l) => l.book === book.id).length;
export const daysLate = (loan) => Math.max(0, Math.round((TODAY - loan.due) / DAY));
export const fineOf = (loan) => daysLate(loan) * FINE_PER_DAY;

const seed = {
  nextId: 4,
  loans: [
    { id: 1, book: 3, member: 1, out: addDays(TODAY, -20), due: addDays(TODAY, -6) },
    { id: 2, book: 7, member: 2, out: addDays(TODAY, -5), due: addDays(TODAY, 9) },
    { id: 3, book: 4, member: 3, out: addDays(TODAY, -10), due: addDays(TODAY, 4) },
  ],
};

function reducer(state, action) {
  switch (action.type) {
    case "checkout":
      return {
        nextId: state.nextId + 1,
        loans: [
          ...state.loans,
          { id: state.nextId, book: action.bookId, member: action.memberId, out: TODAY, due: addDays(TODAY, LOAN_DAYS) },
        ],
      };
    case "return":
      return { ...state, loans: state.loans.filter((l) => l.id !== action.id) };
    case "renew":
      return {
        ...state,
        loans: state.loans.map((l) => (l.id === action.id ? { ...l, due: addDays(l.due, LOAN_DAYS) } : l)),
      };
    default:
      return state;
  }
}

export function useLibrary() {
  const [{ loans }, dispatch] = useReducer(reducer, seed);
  const [toast, setToast] = useState("");

  const checkout = (bookId, memberId) => {
    if (availableCopies(bookOf(bookId), loans) < 1) return;
    dispatch({ type: "checkout", bookId, memberId });
    setToast(`Checked out to ${memberOf(memberId).name}, due ${fmtDate(addDays(TODAY, LOAN_DAYS))}`);
  };

  const giveBack = (id) => {
    const fine = fineOf(loans.find((l) => l.id === id));
    dispatch({ type: "return", id });
    setToast(fine ? `Returned. Collect fine of ${money(fine)}` : "Returned");
  };

  const renew = (id) => {
    const loan = loans.find((l) => l.id === id);
    if (daysLate(loan) > 0) return;
    dispatch({ type: "renew", id });
    setToast(`Renewed until ${fmtDate(addDays(loan.due, LOAN_DAYS))}`);
  };

  return { loans, checkout, giveBack, renew, toast, clearToast: () => setToast("") };
}
