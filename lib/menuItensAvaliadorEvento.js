// menuItems.js
import { RiAwardFill, RiAwardLine, RiCalendarEventFill, RiCouponLine, RiFile2Line, RiFileTextLine, RiFolderHistoryLine, RiFolderOpenFill, RiFolderOpenLine, RiFoldersLine, RiGroupLine, RiHomeLine, RiListCheck2, RiPresentationFill, RiQuestionAnswerLine, RiQuillPenLine, RiSettings3Line, RiSurveyLine, RiTodoLine, RiUserLine } from "@remixicon/react";
const itensMenu = [
  { title: "Home", icon: RiHomeLine, path: "/evento/[tenant]/edicao/[edicao]/avaliador" },
  { title: "Avaliações", icon: RiQuillPenLine, path: "/evento/[tenant]/edicao/[edicao]/avaliador/avaliacoes" },
  { title: "Histórico de avaliações", icon: RiFolderHistoryLine, path: "/evento/[tenant]/edicao/[edicao]/avaliador/minhasAvaliacoes" },
  { title: "Certificados", icon: RiAwardFill, path: "/evento/[tenant]/edicao/[edicao]/avaliador/certificados" },

];

export default itensMenu;
