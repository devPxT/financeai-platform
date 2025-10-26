import React from "react";
import Header from "../components/Header";
import Dashboard from "../components/Dashboard";
import Transactions from "../components/Transactions";
import ReportPanel from "../components/ReportPanel";
import MyPlan from "../components/MyPlan";

export default function Home() {
  return (
    <div>
      <Header />
      <main>
        <Dashboard />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 12 }}>
          <div>
            <Transactions />
            <ReportPanel />
          </div>
          <aside>
            <MyPlan />
          </aside>
        </div>
      </main>
    </div>
  );
}
