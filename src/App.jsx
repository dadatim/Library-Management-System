import { useEffect, useState } from "react";
import { useLibrary } from "./library.js";
import { CatalogView, LoansView, MembersView, Toast } from "./components.jsx";

const VIEWS = ["catalog", "loans", "members"];
const readHash = () => {
  const h = window.location.hash.slice(1);
  return VIEWS.includes(h) ? h : "catalog";
};

export default function App() {
  const [view, setView] = useState(readHash);
  const { loans, checkout, giveBack, renew, toast, clearToast } = useLibrary();

  useEffect(() => {
    const onHash = () => setView(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <>
      <header>
        <h1>Circulation Desk</h1>
        <nav aria-label="Sections">
          {VIEWS.map((v) => (
            <a key={v} href={`#${v}`} aria-current={v === view ? "page" : undefined}>
              {v[0].toUpperCase() + v.slice(1)}
            </a>
          ))}
        </nav>
      </header>
      <main>
        {view === "catalog" && <CatalogView loans={loans} onCheckout={checkout} />}
        {view === "loans" && <LoansView loans={loans} onReturn={giveBack} onRenew={renew} />}
        {view === "members" && <MembersView loans={loans} />}
      </main>
      <Toast message={toast} onDone={clearToast} />
    </>
  );
}
