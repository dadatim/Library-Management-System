import { useEffect, useState } from "react";
import { AuthProvider, ROLE_LABELS, useAuth } from "./auth.jsx";
import { LibraryProvider, useLibrary } from "./library.jsx";
import { CatalogView, LoansView, LoginView, ManageView, MembersView, Toast } from "./components.jsx";

// Each view declares the permission it needs; the nav and the router both read this table.
const VIEWS = [
  { id: "catalog", perm: "catalog:view", label: () => "Catalog", Component: CatalogView },
  { id: "loans", perm: "loans:view", label: (can) => (can("loans:all") ? "Loans" : "My loans"), Component: LoansView },
  { id: "members", perm: "members:view", label: () => "Members", Component: MembersView },
  { id: "manage", perm: "catalog:manage", label: () => "Manage", Component: ManageView },
];

const readHash = () => window.location.hash.slice(1);

function Shell() {
  const { user, can, logout } = useAuth();
  const { toast, clearToast } = useLibrary();
  const [hash, setHash] = useState(readHash);

  useEffect(() => {
    const onHash = () => setHash(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const allowed = VIEWS.filter((v) => can(v.perm));
  const active = allowed.find((v) => v.id === hash) ?? allowed[0]; // blocked or unknown routes fall back

  return (
    <>
      <header>
        <h1>Circulation Desk</h1>
        {user && (
          <>
            <nav aria-label="Sections">
              {allowed.map((v) => (
                <a key={v.id} href={`#${v.id}`} aria-current={v.id === active.id ? "page" : undefined}>{v.label(can)}</a>
              ))}
            </nav>
            <div className="who">
              <span>{user.name}</span><span className="badge">{ROLE_LABELS[user.role]}</span>
              <button className="ghost" onClick={logout}>Sign out</button>
            </div>
          </>
        )}
      </header>
      <main>{user ? <active.Component /> : <LoginView />}</main>
      <Toast message={toast} onDone={clearToast} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LibraryProvider>
        <Shell />
      </LibraryProvider>
    </AuthProvider>
  );
}
