"use client";

/**
 * "Meus dados" — portabilidade em arquivo (P0.1 redefinido para uso pessoal).
 *
 * Explicação em linguagem simples: os textos ficam no navegador de cada aparelho.
 * Este card permite baixar tudo em um arquivo e restaurar em outro aparelho,
 * sem login, sem servidor e sem enviar nada para a internet.
 */
import { useRef, useState, type ChangeEvent } from "react";
import {
  Download,
  FileJson,
  Info,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useRedacaoStore } from "@/lib/store";
import {
  gerarBackup,
  lerBackupJson,
  mesclarDados,
  nomeArquivoBackup,
  resumoBackup,
  serializarBackup,
  type ArquivoBackup,
} from "@/lib/backup";

const LIMITE_ARQUIVO_BYTES = 3 * 1024 * 1024; // 3 MB

export function DadosPessoaisCard() {
  const estado = useRedacaoStore();
  const aplicarBackup = useRedacaoStore((s) => s.aplicarBackup);
  const apagarTudo = useRedacaoStore((s) => s.apagarTudo);
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<ArquivoBackup | null>(null);
  const [confirmarApagar, setConfirmarApagar] = useState(false);

  function baixar() {
    try {
      const backup = gerarBackup(estado);
      const blob = new Blob([serializarBackup(backup)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nomeArquivoBackup(backup.exportadoEm);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Arquivo baixado!", {
        description:
          "Guarde-o no Google Drive, envie para você mesmo por e-mail/WhatsApp e abra no outro aparelho.",
      });
    } catch {
      toast.error("Não foi possível baixar o arquivo. Tente novamente.");
    }
  }

  async function aoEscolherArquivo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!file) return;
    if (file.size > LIMITE_ARQUIVO_BYTES) {
      toast.error("Arquivo muito grande. Use um backup gerado por este app.");
      return;
    }
    try {
      const conteudo = await file.text();
      const resultado = lerBackupJson(conteudo);
      if (!resultado.ok) {
        toast.error("Não foi possível abrir o backup.", { description: resultado.erro });
        return;
      }
      setArquivo(resultado.arquivo);
    } catch {
      toast.error("Não consegui ler esse arquivo.");
    }
  }

  function restaurar(modo: "mesclar" | "substituir") {
    if (!arquivo) return;
    const dados = mesclarDados(estado, arquivo.dados, modo);
    aplicarBackup(dados);
    setArquivo(null);
    toast.success(
      modo === "mesclar" ? "Dados juntados com sucesso!" : "Dados restaurados!",
      {
        description:
          modo === "mesclar"
            ? "Seu texto atual foi mantido. Histórico, favoritos e checklist foram somados, sem duplicatas."
            : "Tudo o que havia neste aparelho foi trocado pelo conteúdo do arquivo.",
      }
    );
  }

  const resumo = arquivo ? resumoBackup(arquivo) : null;

  return (
    <>
      <Card className="border-blue-500/20">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1 border-blue-500/30 bg-blue-500/10 text-[10px] text-blue-300"
            >
              <ShieldCheck className="h-3 w-3" /> Sem login · sem nuvem
            </Badge>
          </div>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileJson className="h-4 w-4 text-blue-400" /> Meus dados
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Suas redações ficam guardadas <strong>neste navegador</strong>, neste aparelho.
            Para continuar no celular ou tablet, baixe o arquivo aqui e abra-o lá com o
            botão &quot;Restaurar&quot;. Nada é enviado para a internet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={baixar}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Baixar meus dados
            </Button>
            <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Restaurar de arquivo
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={aoEscolherArquivo}
              aria-label="Escolher arquivo de backup"
            />
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmarApagar(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Apagar tudo
            </Button>
          </div>
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            Dica: depois de escrever no notebook, baixe o arquivo e guarde no Google Drive.
            No celular, abra este mesmo site, toque em &quot;Restaurar de arquivo&quot; e
            escolha o arquivo. Repita quando quiser atualizar.
          </p>
        </CardContent>
      </Card>

      {/* Escolha do modo de restauração */}
      <Dialog open={Boolean(arquivo)} onOpenChange={(open) => !open && setArquivo(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Restaurar seus dados</DialogTitle>
            <DialogDescription>
              Confira o que há no arquivo antes de continuar.
            </DialogDescription>
          </DialogHeader>
          {resumo && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs">
                <p>
                  <strong>Backup de:</strong> {resumo.data}
                </p>
                <p>
                  <strong>Versões salvas:</strong> {resumo.versoes}
                </p>
                <p>
                  <strong>Favoritos:</strong> {resumo.favoritos} · <strong>Checklist:</strong>{" "}
                  {resumo.checklist}
                </p>
                <p>
                  <strong>Rascunho em andamento:</strong>{" "}
                  {resumo.temRascunho ? "sim" : "não"}
                </p>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                <strong>Juntar</strong> mantém o que você já tem aqui e soma o que veio no
                arquivo, sem duplicatas — é a opção mais segura. <strong>Substituir</strong>{" "}
                apaga tudo deste aparelho e deixa somente o conteúdo do arquivo.
              </p>
            </div>
          )}
          <DialogFooter className="flex flex-wrap gap-2 sm:justify-start">
            <Button size="sm" onClick={() => restaurar("mesclar")}>
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Juntar (recomendado)
            </Button>
            <Button size="sm" variant="outline" onClick={() => restaurar("substituir")}>
              Substituir tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exclusão total (LGPD) */}
      <AlertDialog open={confirmarApagar} onOpenChange={setConfirmarApagar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar todos os seus dados deste aparelho?</AlertDialogTitle>
            <AlertDialogDescription>
              Histórico de versões, favoritos, checklist e o texto em andamento serão
              removidos deste navegador. Isso não pode ser desfeito — a menos que você
              tenha baixado um arquivo de backup antes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                apagarTudo();
                setConfirmarApagar(false);
                toast.success("Dados apagados deste aparelho.");
              }}
            >
              Sim, apagar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
