import { DashboardUserNav } from './DashboardUserNav';

export function DashboardHeader() {
  return (
    <header className="border-b">
      <div className="flex items-center justify-between px-6">
        <h1 className="text-xl font-semibold">Keynotes</h1>
        <DashboardUserNav />
      </div>
    </header>
  );
}