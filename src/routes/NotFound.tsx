import { Link } from "react-router";

export const NotFound = () => {
  return (
    <div className="empty">
      <h2>Page not found</h2>
      <p>
        <Link to="/">Back to your songs</Link>
      </p>
    </div>
  );
};
