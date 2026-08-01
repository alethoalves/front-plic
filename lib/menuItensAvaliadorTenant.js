// menuItems.js
import { RiAwardFill, RiCalendarEventFill, RiCouponLine, RiFile2Line, RiFolderChartLine, RiFoldersLine, RiGroupLine, RiHomeLine, RiListCheck2, RiQuestionAnswerLine, RiQuillPenLine, RiScales3Line, RiSettings3Line, RiSurveyLine, RiTodoLine, RiUserLine } from "@remixicon/react";

const itensMenu = [
  { title: "Home", icon: RiHomeLine, path: "/[tenant]/avaliador/" },
  { title: "Sala de Avaliação", icon: RiFolderChartLine, path: "/[tenant]/avaliador/avaliacoes/projetos" },
  { title: "Sala de Recursos", icon: RiScales3Line, path: "/[tenant]/avaliador/avaliacoes/recursos" },
  { title: "Avaliações finalizadas", icon: RiQuillPenLine, path: "/[tenant]/avaliador/avaliacoes/fichas" },
];

export default itensMenu;
