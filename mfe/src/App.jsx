import React from "react";
import Home from "./pages/Home";

export default function App() {
  return <Home />;
}


// import React from "react";
// import { Routes, Route } from "react-router-dom";
// import Home from "./pages/Home";
// import { UserButton, SignedIn, SignedOut } from "@clerk/clerk-react";

// export default function App() {
//   return (
//     <div className="app-root">
//       <SignedIn>
//         <Routes>
//           <Route path="/" element={<Home />} />
//         </Routes>
//       </SignedIn>

//       <SignedOut>
//         <Routes>
//           <Route path="/" element={<Home />} />
//         </Routes>
//       </SignedOut>
//     </div>
//   );
// }
