// menuItems.js
import { RiCalendarEventFill, RiCouponLine, RiFile2Line, RiFileTextLine, RiFoldersLine, RiGroupLine, RiHomeLine, RiListCheck2, RiPresentationFill, RiQuestionAnswerLine, RiSettings3Line, RiSurveyLine, RiTodoLine, RiUserLine } from "@remixicon/react";

const itensMenu = [
  { title: "Home", icon: RiHomeLine, path: "/eventos/[tenant]/admin" },
  { title: "Avaliadores", icon: RiGroupLine, path: "/eventos/[tenant]/admin/avaliadores" },
  { title: "Submissões", icon: RiFileTextLine, path: "/eventos/[tenant]/admin/submissao" },
  { title: "Apresentacão", icon: RiPresentationFill, path: "/eventos/[tenant]/admin/apresentacao" },
];

export default itensMenu;
