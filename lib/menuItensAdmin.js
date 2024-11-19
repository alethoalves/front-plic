// menuItems.js
import { RiCalendarEventFill, RiContractLine, RiCouponLine, RiFile2Line, RiFileTextLine, RiFoldersLine, RiGroupLine, RiHomeLine, RiListCheck2, RiPresentationFill, RiQuestionAnswerLine, RiSettings3Line, RiSurveyLine, RiTodoLine, RiUserLine } from "@remixicon/react";

const itensMenu = [
  { title: "Home", icon: RiHomeLine, path: "/evento/[tenant]/admin" },
  { title: "Avaliadores", icon: RiGroupLine, path: "/evento/[tenant]/admin/avaliadores" },
  { title: "Submissões", icon: RiFileTextLine, path: "/evento/[tenant]/admin/submissao" },
  { title: "Apresentacão", icon: RiPresentationFill, path: "/evento/[tenant]/admin/apresentacao" },
  { title: "Certificados", icon: RiContractLine, path: "/evento/[tenant]/admin/certificados" }

  
];

export default itensMenu;
