import { PortfolioCatalog } from "@/components/portfolio/portfolio-catalog";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import { listNichePortfolio } from "@/lib/freelance/portfolio-service";

export default async function PortfolioPage() {
  const entries = await listNichePortfolio(await getCurrentUserScope());

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-cyan-300">Freelance portfolio</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-50">Templates por nicho</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Cadastre um projeto de referencia para cada nicho. A demo publicada pode ser incluida
          automaticamente no primeiro contato; o repositorio fica salvo como referencia tecnica.
        </p>
      </header>
      <PortfolioCatalog entries={entries} />
    </div>
  );
}
