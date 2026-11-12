import { useEffect, useState } from "react";
import {
  books, members, bookOf, memberOf, availableCopies, daysLate, fineOf, fmtDate, money,
} from "./library.js";

export function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [message, onDone]);
  return <div id="toast" className={message ? "on" : ""} role="status" aria-live="polite">{message}</div>;
}

export function BookRow({ book, loans, onCheckout }) {
  const free = availableCopies(book, loans);
  return (
    <div className={`row ${free ? "avail" : ""}`}>
      <div>
        <div className="t">{book.title}</div>
        <div className="m">{book.author} · {book.subject}</div>
        <span className={`tag ${free ? "ok" : "late"}`}>
          {free ? `${free} of ${book.copies} available` : `All ${book.copies} out`}
        </span>
      </div>
      <div className="act">
        <button disabled={!free} onClick={() => onCheckout(book.id)}>Check out</button>
      </div>
    </div>
  );
}

export function LoanRow({ loan, onReturn, onRenew }) {
  const book = bookOf(loan.book);
  const member = memberOf(loan.member);
  const late = daysLate(loan);
  return (
    <div className={`row ${late ? "late" : ""}`}>
      <div>
        <div className="t">{book.title}</div>
        <div className="m">{member.name} · out {fmtDate(loan.out)} · due {fmtDate(loan.due)}</div>
        {late ? (
          <span className="stamp">{late} day{late > 1 ? "s" : ""} overdue · {money(fineOf(loan))}</span>
        ) : (
          <span className="tag ok">On time</span>
        )}
      </div>
      <div className="act">
        <button className="ghost" disabled={late > 0} title={late ? "Return overdue items first" : undefined} onClick={() => onRenew(loan.id)}>Renew</button>
        <button onClick={() => onReturn(loan.id)}>Return</button>
      </div>
    </div>
  );
}

export function MemberRow({ member, loans }) {
  const mine = loans.filter((l) => l.member === member.id);
  const owed = mine.reduce((sum, l) => sum + fineOf(l), 0);
  return (
    <div className={`row ${owed ? "late" : ""}`}>
      <div>
        <div className="t">{member.name}</div>
        <div className="m">{member.tier} member · {mine.length} item{mine.length === 1 ? "" : "s"} out</div>
      </div>
      <div className="act">
        {owed ? <span className="tag late">Owes {money(owed)}</span> : <span className="tag ok">No fines</span>}
      </div>
    </div>
  );
}

export function CatalogView({ loans, onCheckout }) {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("All");
  const [onlyFree, setOnlyFree] = useState(false);
  const [memberId, setMemberId] = useState(members[0].id);
  const subjects = ["All", ...new Set(books.map((b) => b.subject))];

  const shown = books.filter(
    (b) =>
      (subject === "All" || b.subject === subject) &&
      (!onlyFree || availableCopies(b, loans) > 0) &&
      `${b.title} ${b.author}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <div className="bar">
        <input type="search" placeholder="Search title or author" aria-label="Search title or author" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select aria-label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
          {subjects.map((s) => <option key={s}>{s}</option>)}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} /> Available now
        </label>
      </div>
      <div className="bar">
        <label htmlFor="who">Checking out to</label>
        <select id="who" value={memberId} onChange={(e) => setMemberId(+e.target.value)}>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      {shown.length ? (
        shown.map((b) => <BookRow key={b.id} book={b} loans={loans} onCheckout={(id) => onCheckout(id, memberId)} />)
      ) : (
        <div className="empty">No books match. Clear the search or turn off “Available now”.</div>
      )}
    </>
  );
}

export function LoansView({ loans, onReturn, onRenew }) {
  const [overdueOnly, setOverdueOnly] = useState(false);
  const sorted = [...loans].sort((a, b) => a.due - b.due);
  const late = sorted.filter((l) => daysLate(l) > 0);
  const owed = late.reduce((sum, l) => sum + fineOf(l), 0);
  const shown = overdueOnly ? late : sorted;

  return (
    <>
      <div className="sum">
        <div><b>{sorted.length}</b><span className="m">on loan</span></div>
        <div><b>{late.length}</b><span className="m">overdue</span></div>
        <div><b>{money(owed)}</b><span className="m">fines accrued</span></div>
      </div>
      <div className="bar">
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} /> Overdue only
        </label>
      </div>
      {shown.length ? (
        shown.map((l) => <LoanRow key={l.id} loan={l} onReturn={onReturn} onRenew={onRenew} />)
      ) : (
        <div className="empty">Nothing here. Check out a book from the catalog to start a loan.</div>
      )}
    </>
  );
}

export function MembersView({ loans }) {
  return members.map((m) => <MemberRow key={m.id} member={m} loans={loans} />);
}
