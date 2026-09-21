import { Badge } from "@/components/Badge";
import { RiCheckboxCircleLine } from "@remixicon/react";

// Único elemento "gamificado" do wizard: um contador discreto de
// produtividade do dia, sem confete/pontos/emojis — dado objetivo, não
// recompensa piscante.
const SessaoBadge = ({ quantidade }) => {
  if (!quantidade) return null;

  return (
    <Badge variant="neutral" size="medium" icon={<RiCheckboxCircleLine />}>
      Você já avaliou {quantidade} {quantidade === 1 ? "trabalho" : "trabalhos"} hoje
    </Badge>
  );
};

export default SessaoBadge;
