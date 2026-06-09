import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Apresentação | GoMinistry",
  description: "Veja como o GoMinistry transforma a escalação de ministérios na sua igreja.",
};

export default function ApresentacaoPage() {
  return (
    <div className="fixed inset-0 flex flex-col bg-[#070b14]">
      <div className="flex items-center gap-3 px-4 py-3 bg-[#070b14]/80 backdrop-blur border-b border-white/10 z-10">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <span className="text-white/30">|</span>
        <span className="text-sm text-white/50">GoMinistry — Apresentação</span>
      </div>
      <iframe
        src="/apresentacao.html"
        className="flex-1 w-full border-0"
        title="Apresentação GoMinistry"
        allow="autoplay"
      />
    </div>
  );
}
