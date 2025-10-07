// menuItems.js
import { RiAwardFill, RiCalendarEventFill, RiCalendarFill, RiContractLine, RiCouponLine, RiFile2Line, RiFoldersLine, RiGroupLine, RiHomeLine, RiListCheck2, RiQuestionAnswerLine, RiSettings3Line, RiSurveyLine, RiTodoLine, RiUserLine } from "@remixicon/react";

const itensMenu = [
  { title: "Home", icon: RiHomeLine, path: "/[tenant]/user" },
  { title: "Editais", icon: RiContractLine, path: "/[tenant]/user/editais" },
  { title: "Atividades", icon: RiListCheck2, path: "/[tenant]/user/atividades" },
  { title: "Eventos", icon: RiCalendarEventFill, path: "/[tenant]/user/eventos" },
  { title: "Meus Documentos", icon: RiFoldersLine, path: "/[tenant]/user/documentos" },
  //{ title: "Meus eventos", icon: RiCouponLine, path: "/[tenant]/user/meuseventos" },
  { title: "Certificados", icon: RiAwardFill, path: "/[tenant]/user/certificados" },

];

export default itensMenu;
