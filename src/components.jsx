import { useEffect, useState } from "react";
import { ACCOUNTS, ROLE_BLURBS, ROLE_LABELS, useAuth } from "./auth.jsx";
import { availableCopies, daysLate, fineOf, fmtDate, memberOf, members, money, useLibrary } from "./library.jsx";

export function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [message, onDone]);
  return <div id="toast" className={message ? "on" : ""} role="status" aria-live="polite">{message}</div>;
}

export function LoginView() {
  const { login } = useAuth();
  return (
    <>
      <h2 className="sec">Sign in</h2>
      <p className="m">Demo accounts. Pick a role to see how the interface changes.</p>
      {ACCOUNTS.map((a) => (
        <div className="row" key={a.id}>
          <div>
            <div className="t">{a.name} <span className="badge">{ROLE_LABELS[a.role]}</span></div>
            <div className="m">{ROLE_BLURBS[a.role]}</div>
          </div>
          <div className="act"><button onClick={() => login(a.id)}>Sign in</button></div>
        </div>
      ))}
    </>
  );
}

function BookRow({ book, loans, onCheckout }) {
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
      {onCheckout && (
        <div className="act"><button disabled={!free} onClick={() => onCheckout(book.id)}>Check out</button></div>
      )}
    </div>
  );
}

export function CatalogView() {
  const { can } = useAuth();
  const { books, loans, checkout } = useLibrary();
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("All");
  const [onlyFree, setOnlyFree] = useState(false);
  const [memberId, setMemberId] = useState(members[0].id);
  const subjects = ["All", ...new Set(books.map((b) => b.subject))];
  const canCheckout = can("catalog:checkout");

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
      {canCheckout ? (
        <div className="bar">
          <label htmlFor="who">Checking out to</label>
          <select id="who" value={memberId} onChange={(e) => setMemberId(+e.target.value)}>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      ) : (
        <p className="m">To borrow a book, ask at the circulation desk.</p>
      )}
      {shown.length ? (
        shown.map((b) => (
          <BookRow key={b.id} book={b} loans={loans} onCheckout={canCheckout ? (id) => checkout(id, memberId) : undefined} />
        ))
      ) : (
        <div className="empty">No books match. Clear the search or turn off “Available now”.</div>
      )}
    </>
  );
}

function LoanRow({ loan, showMember, canReturn, onReturn, onRenew }) {
  const { bookOf } = useLibrary();
  const late = daysLate(loan);
  const detail = `${showMember ? memberOf(loan.member).name + " · " : ""}out ${fmtDate(loan.out)} · due ${fmtDate(loan.due)}`;
  return (
    <div className={`row ${late ? "late" : ""}`}>
      <div>
        <div className="t">{bookOf(loan.book).title}</div>
        <div className="m">{detail}</div>
        {late ? (
          <span className="stamp">{late} day{late > 1 ? "s" : ""} overdue · {money(fineOf(loan))}</span>
        ) : (
          <span className="tag ok">On time</span>
        )}
      </div>
      <div className="act">
        <button className="ghost" disabled={late > 0} title={late ? "Overdue items can’t be renewed" : undefined} onClick={() => onRenew(loan.id)}>Renew</button>
        {canReturn && <button onClick={() => onReturn(loan.id)}>Return</button>}
      </div>
    </div>
  );
}

export function LoansView() {
  const { user, can } = useAuth();
  const { loans, giveBack, renew } = useLibrary();
  const [overdueOnly, setOverdueOnly] = useState(false);
  const seeAll = can("loans:all");
  const pool = (seeAll ? [...loans] : loans.filter((l) => l.member === user.memberId)).sort((a, b) => a.due - b.due);
  const late = pool.filter((l) => daysLate(l) > 0);
  const owed = late.reduce((sum, l) => sum + fineOf(l), 0);
  const shown = overdueOnly ? late : pool;

  return (
    <>
      <div className="sum">
        <div><b>{pool.length}</b><span className="m">{seeAll ? "on loan" : "borrowed"}</span></div>
        <div><b>{late.length}</b><span className="m">overdue</span></div>
        <div><b>{money(owed)}</b><span className="m">{seeAll ? "fines accrued" : "you owe"}</span></div>
      </div>
      <div className="bar">
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} /> Overdue only
        </label>
      </div>
      {shown.length ? (
        shown.map((l) => (
          <LoanRow key={l.id} loan={l} showMember={seeAll} canReturn={can("loans:return")} onReturn={giveBack} onRenew={renew} />
        ))
      ) : (
        <div className="empty">Nothing here.</div>
      )}
    </>
  );
}

export function MembersView() {
  const { loans } = useLibrary();
  return members.map((m) => {
    const mine = loans.filter((l) => l.member === m.id);
    const owed = mine.reduce((sum, l) => sum + fineOf(l), 0);
    return (
      <div className={`row ${owed ? "late" : ""}`} key={m.id}>
        <div>
          <div className="t">{m.name}</div>
          <div className="m">{m.tier} member · {mine.length} item{mine.length === 1 ? "" : "s"} out</div>
        </div>
        <div className="act">
          {owed ? <span className="tag late">Owes {money(owed)}</span> : <span className="tag ok">No fines</span>}
        </div>
      </div>
    );
  });
}

export function ManageView() {
  const { books, loans, addBook, removeBook } = useLibrary();
  const blank = { title: "", author: "", subject: "Fiction", copies: 1 };
  const [f, setF] = useState(blank);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (!f.title.trim() || !f.author.trim()) return;
    addBook({ title: f.title.trim(), author: f.author.trim(), subject: f.subject.trim() || "General", copies: Math.max(1, +f.copies || 1) });
    setF({ ...f, title: "", author: "", copies: 1 });
  };

  return (
    <>
      <h2 className="sec">Add a book</h2>
      <form className="form" onSubmit={submit}>
        <input placeholder="Title" aria-label="Title" value={f.title} onChange={set("title")} />
        <input placeholder="Author" aria-label="Author" value={f.author} onChange={set("author")} />
        <input placeholder="Subject" aria-label="Subject" value={f.subject} onChange={set("subject")} />
        <input type="number" min="1" aria-label="Copies" value={f.copies} onChange={set("copies")} />
        <button type="submit">Add</button>
      </form>
      <h2 className="sec">Collection</h2>
      {books.map((b) => {
        const out = loans.filter((l) => l.book === b.id).length;
        return (
          <div className="row" key={b.id}>
            <div>
              <div className="t">{b.title}</div>
              <div className="m">{b.author} · {b.subject} · {b.copies} cop{b.copies === 1 ? "y" : "ies"}</div>
            </div>
            <div className="act">
              <button className="ghost" disabled={out > 0} title={out ? "Copies are on loan" : undefined} onClick={() => removeBook(b.id)}>Remove</button>
            </div>
          </div>
        );
      })}
    </>
  );
}
