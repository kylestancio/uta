import { createHashRouter, Navigate, RouterProvider } from "react-router";
import { Root } from "./routes/Root.tsx";
import { Home } from "./routes/Home.tsx";
import { SongLayout } from "./routes/SongLayout.tsx";
import { LyricsStep } from "./routes/LyricsStep.tsx";
import { ChordsStep } from "./routes/ChordsStep.tsx";
import { NotFound } from "./routes/NotFound.tsx";

// Hash routing so deep links work on GitHub Pages, which has no SPA fallback.
const router = createHashRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      {
        path: "songs/:songId",
        element: <SongLayout />,
        children: [
          { index: true, element: <Navigate to="lyrics" replace /> },
          { path: "lyrics", element: <LyricsStep /> },
          { path: "chords", element: <ChordsStep /> },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export const App = () => {
  return <RouterProvider router={router} />;
};
