// menuItems.js
import { RiAwardFill, RiCalendarEventFill, RiCalendarFill, RiContractLine, RiCouponLine, RiFile2Line, RiFilter2Line, RiFoldersLine, RiGroupLine, RiHistoryLine, RiHomeLine, RiListCheck2, RiMicroscopeLine, RiQuestionAnswerLine, RiScales3Line, RiSettings3Line, RiSurveyLine, RiTodoLine, RiUserLine } from "@remixicon/react";

const itensMenu = [
  { title: "Home", icon: RiHomeLine, path: "/[tenant]/user" },
  { title: "Editais", icon: RiContractLine, path: "/[tenant]/user/editais", requiredPerfil: "orientador" },
  {
    group: {
      title: "Resultados e Recursos",
      icon:RiFilter2Line ,
      itens: [
        { title: "Minhas Participações", path: "/[tenant]/user/participacoes" },
        {
          title: "Resultados e Recursos",
          path: "/[tenant]/user/resultados-recursos",
          highlight: true,
        },
      ],
    },
  },
  { title: "Minhas pesquisas", icon: RiMicroscopeLine, path: "/[tenant]/user/planos" },

  //{ title: "Atividades", icon: RiListCheck2, path: "/[tenant]/user/atividades" },
  { title: "Eventos", icon: RiCalendarEventFill, path: "/[tenant]/user/eventos" },
  { title: "Meus Documentos", icon: RiFoldersLine, path: "/[tenant]/user/documentos" },
  { title: "Histórico/Declarações", icon: RiHistoryLine, path: "/[tenant]/user/historico" },
  //{ title: "Certificados", icon: RiAwardFill, path: "/[tenant]/user/certificados" },

];

export default itensMenu;
