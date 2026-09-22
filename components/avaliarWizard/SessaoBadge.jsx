import { Badge } from "@/components/Badge";
import { RiCheckboxCircleLine } from "@remixicon/react";

// Único elemento "gamificado" do wizard: um contador discreto de
// produtividade, sem confete/pontos/emojis — dado objetivo, não recompensa
// piscante. `quantidade` vem direto do banco (total no evento, não só nesta
// sessão/navegador), então reflete avaliações feitas em qualquer
// dispositivo ou tela.
const SessaoBadge = ({ quantidade }) => {
  if (!quantidade) return null;

  return (
    <Badge variant="neutral" size="medium" icon={<RiCheckboxCircleLine />}>
      Você já avaliou {quantidade} {quantidade === 1 ? "trabalho" : "trabalhos"} neste evento
    </Badge>
  );
};

export default SessaoBadge;
