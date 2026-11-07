import { Link, Outlet } from "react-router";

export const Root = () => {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="brand">
          <span className="brand-mark">♪</span> Uta
        </Link>
        <span className="brand-tag">Chord sheet maker</span>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};
